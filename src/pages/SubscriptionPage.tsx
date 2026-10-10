/**
 * BizMate AI - Subscription & Billing Page (/dashboard/subscription)
 * Manages active subscription plan, Razorpay checkout, credit allotments, and invoice records.
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CreditCard, Check, Zap, Shield, ArrowRight, FileText } from 'lucide-react';
import { PaymentRecord, PlanId } from '../server/types/index.ts';

export const SubscriptionPage: React.FC = () => {
  const { user, subscription, balance, navigate, addToast, refreshUserData } = useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

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
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow transition hover:brightness-110"
        >
          <span>Upgrade or Switch Plan</span>
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
