/**
 * BizMate AI - Credit & Usage Service
 * Implements atomic credit checking, reservation, consumption, and ledger reconciliation.
 */

import { db } from '../db/database.ts';
import { GenerationType, UsageBalance, UsageLedgerEntry } from '../types/index.ts';

export const CREDIT_COSTS: Record<GenerationType, number> = {
  marketing_copy: 5,
  promotional_poster: 20,
  product_image: 15,
  instagram_creative: 15,
  facebook_creative: 15,
  youtube_thumbnail: 20,
  promotional_video: 30,
  whatsapp_creative: 5,
  email_content: 5,
  business_report: 25
};

export class CreditService {
  public static getCost(type: GenerationType): number {
    return CREDIT_COSTS[type] || 10;
  }

  public static getBalance(userId: string): UsageBalance {
    let balance = db.usageBalances.get(userId);
    if (!balance) {
      balance = {
        userId,
        totalCredits: 0,
        usedCredits: 0,
        reservedCredits: 0,
        remainingCredits: 0,
        updatedAt: new Date().toISOString()
      };
      db.usageBalances.set(userId, balance);
    }
    return balance;
  }

  public static getLedger(userId: string): UsageLedgerEntry[] {
    return db.usageLedger.filter((entry) => entry.userId === userId).reverse();
  }

  /**
   * Atomic Reservation: Check balance and hold credits prior to job execution.
   */
  public static reserve(userId: string, amount: number, jobId: string): { success: boolean; remaining: number; error?: string } {
    return db.reserveCredits(userId, amount, jobId);
  }

  /**
   * Finalize reservation: Consume on success, or refund on failure.
   */
  public static finalize(userId: string, amount: number, jobId: string, success: boolean): void {
    db.finalizeCredits(userId, amount, jobId, success);
  }

  /**
   * Admin Credit Adjustment
   */
  public static adminAdjust(userId: string, amount: number, reason: string): UsageBalance {
    let balance = this.getBalance(userId);
    balance.totalCredits += amount;
    balance.remainingCredits += amount;
    balance.updatedAt = new Date().toISOString();

    db.usageLedger.push({
      id: `led-adm-${Date.now()}`,
      userId,
      amount,
      type: 'ADMIN_OVERRIDE',
      description: `Admin adjustment: ${reason}`,
      timestamp: new Date().toISOString()
    });

    db.logAudit({
      userId,
      action: 'ADMIN_CREDIT_OVERRIDE',
      resource: `balance/${userId}`,
      details: `Adjusted credits by ${amount}. New remaining: ${balance.remainingCredits}. Reason: ${reason}`,
      status: 'SUCCESS'
    });

    return balance;
  }
}
