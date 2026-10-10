/**
 * BizMate AI - Payment & Subscription Service
 * Implements Razorpay order creation, HMAC signature verification, and webhook handling.
 */

import crypto from 'crypto';
import { db, PLANS } from '../db/database.ts';
import { PaymentRecord, PlanId } from '../types/index.ts';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

export class PaymentService {
  public static isConfigured(): boolean {
    return Boolean(razorpayKeyId && razorpayKeySecret);
  }

  public static getStatus(): { configured: boolean; keyId: string; mode: string } {
    return {
      configured: this.isConfigured(),
      keyId: razorpayKeyId ? `${razorpayKeyId.slice(0, 8)}...` : 'NOT_CONFIGURED',
      mode: this.isConfigured() ? 'LIVE_OR_TEST_API' : 'NOT_CONFIGURED'
    };
  }

  /**
   * Create an order for a plan upgrade
   */
  public static async createOrder(userId: string, planId: PlanId, billingInterval: 'month' | 'year' = 'month'): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan selected');
    if (!this.isConfigured()) {
      throw new Error('Online payments are not configured yet. Please contact the site administrator.');
    }

    const monthlyPrice = billingInterval === 'year' && planId !== 'FREE'
      ? (planId === 'STARTER' ? 399 : planId === 'PRO' ? 1199 : 7999)
      : plan.price;
    const billedPrice = billingInterval === 'year' ? monthlyPrice * 12 : monthlyPrice;
    const amountInPaise = Math.round(billedPrice * 100);
    const receipt = `bm-${Date.now()}-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(-10)}`.slice(0, 40);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: { userId, planId }
      })
    });
    const order = await response.json() as { id?: string; amount?: number; currency?: string; error?: { description?: string } };
    if (!response.ok || !order.id) {
      throw new Error(order.error?.description || 'Razorpay could not create an order. Please retry.');
    }

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      orderId: order.id,
      amount: billedPrice,
      currency: 'INR',
      planId,
      billingInterval,
      status: 'CREATED',
      verified: false,
      createdAt: new Date().toISOString()
    };
    db.payments.set(payment.id, payment);
    db.logAudit({
      userId,
      action: 'PAYMENT_ORDER_CREATED',
      resource: `orders/${order.id}`,
      details: `Created Razorpay order for plan ${planId} (${billingInterval}, ₹${billedPrice})`,
      status: 'SUCCESS'
    });
    return { orderId: order.id, amount: order.amount ?? amountInPaise, currency: order.currency ?? 'INR', keyId: razorpayKeyId };
  }

  /**
   * Server-Side Verification: Validates cryptographic signature
   * Never trust client callbacks without server verification!
   */
  public static verifyPayment(params: {
    userId: string;
    orderId: string;
    paymentId: string;
    signature: string;
  }): { verified: boolean; planId?: PlanId; error?: string } {
    const payment = Array.from(db.payments.values()).find((p) => p.orderId === params.orderId);
    if (!payment) {
      return { verified: false, error: 'Order not found in records' };
    }

    if (payment.userId !== params.userId) {
      db.logAudit({
        userId: params.userId,
        action: 'PAYMENT_VERIFICATION_TAMPER',
        resource: `orders/${params.orderId}`,
        details: 'Attempted to verify payment belonging to another user',
        status: 'BLOCKED'
      });
      return { verified: false, error: 'Authorization error: Order owner mismatch' };
    }

    // A duplicate checkout callback must never allocate credits twice.
    if (payment.verified) return { verified: true, planId: payment.planId };

    if (!this.isConfigured()) {
      return { verified: false, error: 'Razorpay credentials are not configured. Payment cannot be verified.' };
    }

    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex');
    const isValidSignature = expectedSignature === params.signature;

    if (!isValidSignature) {
      payment.status = 'FAILED';
      payment.verified = false;
      db.logAudit({
        userId: params.userId,
        action: 'PAYMENT_SIGNATURE_FAILED',
        resource: `orders/${params.orderId}`,
        details: `Invalid cryptographic signature for payment ${params.paymentId}`,
        status: 'FAILURE'
      });
      return { verified: false, error: 'Cryptographic signature verification failed' };
    }

    // Payment is verified on the backend!
    payment.paymentId = params.paymentId;
    payment.signature = params.signature;
    payment.status = 'CAPTURED';
    payment.verified = true;

    // Activate subscription & Allocate Plan Credits
    const plan = PLANS[payment.planId];
    const sub = db.subscriptions.get(params.userId);
    if (sub) {
      sub.planId = payment.planId;
      sub.status = 'ACTIVE';
      sub.currentPeriodStart = new Date().toISOString();
      sub.currentPeriodEnd = new Date(Date.now() + (payment.billingInterval === 'year' ? 365 : 30) * 86400000).toISOString();
    }

    const balance = db.usageBalances.get(params.userId);
    if (balance) {
      const addedCredits = plan.textCredits + plan.imageCredits + (plan.videoCredits * 5);
      balance.totalCredits += addedCredits;
      balance.remainingCredits += addedCredits;
      balance.updatedAt = new Date().toISOString();

      db.usageLedger.push({
        id: `led-pay-${Date.now()}`,
        userId: params.userId,
        amount: addedCredits,
        type: 'PLAN_ALLOCATION',
        description: `Credits added for ${plan.name} upgrade (₹${plan.price})`,
        timestamp: new Date().toISOString()
      });
    }

    db.logAudit({
      userId: params.userId,
      action: 'PAYMENT_VERIFIED_AND_ACTIVATED',
      resource: `orders/${params.orderId}`,
      details: `Plan upgraded to ${payment.planId}. Allotted new monthly credits.`,
      status: 'SUCCESS'
    });

    return { verified: true, planId: payment.planId };
  }

  public static listPayments(userId: string): PaymentRecord[] {
    return Array.from(db.payments.values())
      .filter((p) => p.userId === userId)
      .reverse();
  }
}
