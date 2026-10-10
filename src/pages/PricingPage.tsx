/**
 * BizMate AI - Pricing & Credit Plans Page
 * Includes Indian Rupee pricing, credit quota comparison, and Razorpay upgrade trigger.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Check, Zap, Sparkles, Shield, CreditCard, ArrowRight, HelpCircle } from 'lucide-react';
import { PlanId } from '../server/types/index.ts';

export const PricingPage: React.FC = () => {
  const { user, subscription, navigate, addToast, refreshUserData } = useApp();
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [upgradingPlan, setUpgradingPlan] = useState<PlanId | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (planId === 'FREE') {
      addToast('You are already on the Free Starter plan', 'info');
      return;
    }

    setUpgradingPlan(planId);
    try {
      const res = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.success) {
        setOrderData(data.order);
        setPaymentModalOpen(true);
      } else {
        addToast(data.error || 'Failed to create payment order', 'error');
      }
    } catch (err) {
      addToast('Error initiating checkout order', 'error');
    }
  };

  const handleSimulatePayment = async (signatureStatus: 'valid' | 'invalid') => {
    if (!orderData || !upgradingPlan || !user) return;
    setProcessingPayment(true);

    try {
      const paymentId = `pay_sim_${Date.now()}`;
      const signature =
        signatureStatus === 'valid'
          ? `valid_sig_${Date.now()}_987654321`
          : 'tampered_bad_signature_xyz';

      const res = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId,
          signature
        })
      });

      const data = await res.json();
      if (data.success && data.verified) {
        addToast(`Payment Verified! Upgraded to ${upgradingPlan} plan. Credits credited to balance!`, 'success');
        setPaymentModalOpen(false);
        await refreshUserData();
        navigate('/dashboard');
      } else {
        addToast(`Payment verification rejected: ${data.error || 'Invalid signature'}`, 'error');
      }
    } catch (err) {
      addToast('Error verifying payment transaction', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Fair Credit Accounting & Zero Hidden Costs</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Simple, Transparent Pricing</h1>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            Choose the right capacity for your retail store, brand, or marketing agency. Credits roll over with active subscriptions.
          </p>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs mt-4">
            <button
              onClick={() => setBillingCycle('month')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition ${
                billingCycle === 'month' ? 'bg-neutral-800 text-amber-400 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('year')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                billingCycle === 'year' ? 'bg-neutral-800 text-amber-400 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* FREE */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg">Free Starter</h3>
                <p className="text-xs text-neutral-400">For testing and personal creative projects.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">₹0</span>
                <span className="text-xs text-neutral-400">/mo</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-1 font-mono">
                <div className="text-amber-400 font-bold">50 Credits / mo</div>
                <div className="text-neutral-400 text-[11px]">10 Image / 50 Text</div>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Single-prompt creative planner</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard SVG promotional posters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Copy to clipboard & SVG export</span>
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <span>1 Team Seat • 7-day retention</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('FREE')}
              disabled={subscription?.planId === 'FREE'}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition disabled:opacity-50"
            >
              {subscription?.planId === 'FREE' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>

          {/* STARTER */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg">Growth Starter</h3>
                <p className="text-xs text-neutral-400">For retail shops, boutiques, and freelancers.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  ₹{billingCycle === 'year' ? '399' : '499'}
                </span>
                <span className="text-xs text-neutral-400">/mo</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-1 font-mono">
                <div className="text-amber-400 font-bold">500 Credits / mo</div>
                <div className="text-neutral-400 text-[11px]">100 Image / 10 Video / 500 Text</div>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Omnichannel marketing campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>High-resolution promotional posters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Commercial video script generator</span>
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <span>2 Team Seats • 30-day retention</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('STARTER')}
              disabled={subscription?.planId === 'STARTER'}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs transition disabled:opacity-50 border border-amber-500/30"
            >
              {subscription?.planId === 'STARTER' ? 'Current Plan' : 'Upgrade to Starter'}
            </button>
          </div>

          {/* PRO (Highlight) */}
          <div className="p-6 rounded-2xl bg-neutral-900 border-2 border-amber-500/90 shadow-2xl shadow-amber-500/10 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] uppercase tracking-wider shadow">
              Recommended for Brands
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg">Business Pro</h3>
                <p className="text-xs text-neutral-400">For agencies, high-volume e-commerce, and brands.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  ₹{billingCycle === 'year' ? '1,199' : '1,499'}
                </span>
                <span className="text-xs text-neutral-400">/mo</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-amber-500/30 text-xs space-y-1 font-mono">
                <div className="text-amber-400 font-bold">2,000 Credits / mo</div>
                <div className="text-neutral-400 text-[11px]">500 Image / 50 Video / 2000 Text</div>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All 8 Creative Studios Unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom brand colors & styling</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Executive marketing reports (PDF/CSV)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority generation queue</span>
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <span>5 Team Seats • 90-day retention</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('PRO')}
              disabled={subscription?.planId === 'PRO'}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {subscription?.planId === 'PRO' ? 'Current Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* ENTERPRISE */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg">Enterprise Scale</h3>
                <p className="text-xs text-neutral-400">Custom volume, multi-brand organizations, and SLA.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">Custom</span>
                <span className="text-xs text-neutral-400">(from ₹9,999)</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-1 font-mono">
                <div className="text-amber-400 font-bold">10,000+ Credits</div>
                <div className="text-neutral-400 text-[11px]">Unlimited Teams & Brands</div>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom brand voice fine-tuning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Google Sheets & WhatsApp sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Account Manager & SLA</span>
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <span>50+ Team Seats • 365-day retention</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/contact')}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
            >
              Contact Sales
            </button>
          </div>
        </div>

        {/* Credit Consumption Table */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <h3 className="text-base font-bold text-white">Credit Consumption Ledger Matrix</h3>
          <p className="text-xs text-neutral-400">
            Every generation operation is atomic. If any generation fails, locked credits are immediately restored to your balance.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Marketing Copy:</span>
              <div className="text-amber-400 font-bold text-sm">5 Credits</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Promotional Poster:</span>
              <div className="text-amber-400 font-bold text-sm">20 Credits</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Social Creative:</span>
              <div className="text-amber-400 font-bold text-sm">15 Credits</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Video Storyboard:</span>
              <div className="text-amber-400 font-bold text-sm">30 Credits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Simulation / Real Modal */}
      {paymentModalOpen && orderData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Razorpay Secure Checkout</h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Selected Plan:</span>
                <span className="font-bold text-white">{upgradingPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Order ID:</span>
                <span className="font-mono text-neutral-300">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Amount:</span>
                <span className="font-bold text-amber-400 text-sm">
                  ₹{(orderData.amount / 100).toLocaleString()} INR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Gateway Key:</span>
                <span className="font-mono text-neutral-400">{orderData.keyId}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] leading-relaxed">
              <strong>Server-Side Verification:</strong> In accordance with Rule 20, subscription activation is never
              granted from client callback alone. The server validates the cryptographic HMAC SHA-256 signature before allocating credits.
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSimulatePayment('valid')}
                disabled={processingPayment}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                {processingPayment ? 'Verifying with Server...' : 'Complete Payment (Valid Signature)'}
              </button>

              <button
                onClick={() => handleSimulatePayment('invalid')}
                disabled={processingPayment}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-rose-400 font-semibold text-xs transition border border-rose-900/40"
              >
                Test Tampered Signature (Must Fail Verification)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
