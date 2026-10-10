/**
 * BizMate AI - Subscription & Billing Page (/dashboard/subscription)
 * Manages active subscription plan, Razorpay checkout, credit allotments, and invoice records.
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CreditCard, Zap, ArrowRight, FileText, Sparkles, Check } from 'lucide-react';
import { PaymentRecord, PlanId } from '../server/types/index.ts';

export const SubscriptionPage: React.FC = () => {
  const { user, subscription, balance, navigate, addToast, refreshUserData } = useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [upgradingPlan, setUpgradingPlan] = useState<PlanId | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/v1/payments/history', {
        headers: { 'x-user-id': user.id }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPayments(data.payments);
        })
        .catch((err) => console.error('Failed to load payment history:', err));
    }
  }, [user]);

  const loadRazorpay = () => new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean((window as any).Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleUpgrade = async (planId: PlanId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (processingPayment) return;

    setUpgradingPlan(planId);
    setProcessingPayment(true);
    try {
      const res = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ planId, billingInterval: 'month' })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.order?.orderId || !data.order?.keyId) {
        throw new Error(data.error || 'Razorpay checkout is not configured. Please try again later.');
      }

      if (!(await loadRazorpay())) {
        throw new Error('Could not load Razorpay checkout script. Check network connection.');
      }

      const checkout = new (window as any).Razorpay({
        key: data.order.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'BizMate AI',
        description: `${planId} Plan Subscription Upgrade`,
        order_id: data.order.orderId,
        prefill: { name: user.name || '', email: user.email || '' },
        notes: { planId },
        theme: { color: '#f59e0b' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });
            const verification = await verifyRes.json();
            if (!verifyRes.ok || !verification.success || !verification.verified) {
              throw new Error(verification.error || 'Payment signature verification failed.');
            }
            addToast(`Payment verified! Upgraded to ${planId} with full credits!`, 'success');
            await refreshUserData();
            // Refresh history
            const histRes = await fetch('/api/v1/payments/history', { headers: { 'x-user-id': user.id } });
            const histData = await histRes.json();
            if (histData.success) setPayments(histData.payments);
          } catch (error: any) {
            addToast(error?.message || 'Verification failed. Support has been notified.', 'error');
          } finally {
            setProcessingPayment(false);
            setUpgradingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            setUpgradingPlan(null);
            addToast('Payment cancelled or window closed.', 'info');
          }
        }
      });
      checkout.on('payment.failed', (response: any) => {
        setProcessingPayment(false);
        setUpgradingPlan(null);
        addToast(response?.error?.description || 'Payment was not completed.', 'error');
      });
      checkout.open();
    } catch (error: any) {
      setProcessingPayment(false);
      setUpgradingPlan(null);
      addToast(error?.message || 'Unable to start Razorpay checkout.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            Billing & Subscriptions
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage your active plan, upgrade capacity, and view payment transaction history.
          </p>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white font-bold text-xs rounded-xl shadow transition"
        >
          <span>Compare All Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Subscription Overview Card */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Current Membership</span>
            <div className="text-2xl font-extrabold text-white flex items-center gap-2 mt-0.5">
              <span>{subscription?.planId || 'FREE'} Plan</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                {subscription?.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          <div className="text-xs text-right">
            <span className="text-neutral-400">Current Period Ends:</span>
            <div className="font-mono text-white font-semibold">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-neutral-400">Available Credits:</span>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {balance?.remainingCredits ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-neutral-400">Consumed This Period:</span>
            <div className="text-xl font-bold text-white font-mono">
              {balance?.usedCredits ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-neutral-400">Payment Engine:</span>
            <div className="text-sm font-bold text-neutral-200 mt-1">
              Razorpay (UPI / NetBanking / Cards)
            </div>
          </div>
        </div>
      </div>

      {/* Instant Upgrade via Razorpay Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-amber-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                Most Popular Retailer Plan
              </span>
              <span className="text-xl font-black text-white">₹2,499<span className="text-xs font-normal text-neutral-400">/mo</span></span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Upgrade to PRO Plan
            </h3>
            <p className="text-xs text-neutral-400">
              Get 2,000 credits/mo, priority Gemini AI speed, and remove all watermark branding.
            </p>
          </div>

          <button
            onClick={() => handleUpgrade('PRO')}
            disabled={processingPayment}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {upgradingPlan === 'PRO' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>Opening Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Upgrade via Razorpay (₹2,499)</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900 border border-purple-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                Agency & Brand Scale
              </span>
              <span className="text-xl font-black text-white">₹6,999<span className="text-xs font-normal text-neutral-400">/mo</span></span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Upgrade to ENTERPRISE Plan
            </h3>
            <p className="text-xs text-neutral-400">
              Get 10,000 credits/mo, multi-user seats, unlimited exports, and dedicated support.
            </p>
          </div>

          <button
            onClick={() => handleUpgrade('ENTERPRISE')}
            disabled={processingPayment}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {upgradingPlan === 'ENTERPRISE' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Opening Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Upgrade via Razorpay (₹6,999)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment Transactions & Receipts Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          Verified Invoices & Transaction History
        </h3>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-400">
            No payments recorded yet. Upgrade your plan to see invoices.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Verified</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 text-neutral-300">{p.orderId}</td>
                    <td className="py-3 px-3 text-white font-bold">{p.planId}</td>
                    <td className="py-3 px-3 text-amber-400 font-bold">₹{p.amount}</td>
                    <td className="py-3 px-3 text-emerald-400">{p.verified ? 'YES (HMAC)' : 'NO'}</td>
                    <td className="py-3 px-3 text-neutral-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
