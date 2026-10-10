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
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) {
      sessionStorage.setItem('bizmate_pending_plan', planId);
      addToast('Please sign in or create an account to activate this plan', 'info');
      navigate('/login');
      return;
    }
    if (planId === 'FREE') {
      addToast('You are already on the Free Starter plan', 'info');
      return;
    }
    if (processingPayment) return;

    setUpgradingPlan(planId);
    setProcessingPayment(true);
    try {
      const res = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ planId, billingInterval: billingCycle })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.order?.orderId || !data.order?.keyId) {
        throw new Error(data.error || 'Razorpay checkout is not configured. Please try again later.');
      }

      const loadRazorpay = () => new Promise<boolean>((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(Boolean((window as any).Razorpay));
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!(await loadRazorpay())) {
        throw new Error('Could not load Razorpay checkout. Check your connection and retry.');
      }

      const checkout = new (window as any).Razorpay({
        key: data.order.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'BizMate AI',
        description: `${planId} ${billingCycle === 'year' ? 'annual' : 'monthly'} subscription`,
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
              throw new Error(verification.error || 'Payment verification failed.');
            }
            addToast(`Payment verified! Your ${planId} plan is now active with refreshed credits.`, 'success');
            await refreshUserData();
            navigate('/dashboard');
          } catch (error: any) {
            addToast(error?.message || 'Payment verification failed. Contact support with your payment ID.', 'error');
          } finally {
            setProcessingPayment(false);
            setUpgradingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            setUpgradingPlan(null);
          }
        }
      });
      checkout.on('payment.failed', (response: any) => {
        setProcessingPayment(false);
        setUpgradingPlan(null);
        addToast(response?.error?.description || 'Payment was not completed. You have not been charged for an unsuccessful payment.', 'error');
      });
      checkout.open();
    } catch (error: any) {
      setProcessingPayment(false);
      setUpgradingPlan(null);
      addToast(error?.message || 'Unable to start Razorpay checkout.', 'error');
    }
  };

  return (
    <div className="premium-pricing min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Fair Credit Accounting & Zero Hidden Costs</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white premium-gradient-text">Simple, Transparent Pricing</h1>
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
                {billingCycle === 'year' && <span className="text-[10px] text-emerald-400 ml-2">billed yearly</span>}
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
                {billingCycle === 'year' && <span className="text-[10px] text-emerald-400 ml-2">billed yearly</span>}
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
                <span className="text-3xl font-extrabold text-white">₹{billingCycle === 'year' ? '7,999' : '9,999'}</span>
                <span className="text-xs text-neutral-400">/mo</span>
                {billingCycle === 'year' && <span className="text-[10px] text-emerald-400 ml-2">billed yearly</span>}
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
              onClick={() => handleSelectPlan('ENTERPRISE')}
              disabled={subscription?.planId === 'ENTERPRISE' || processingPayment}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition disabled:opacity-50"
            >
              {subscription?.planId === 'ENTERPRISE' ? 'Current Plan' : processingPayment ? 'Opening Checkout…' : 'Upgrade to Enterprise'}
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


    </div>
  );
};
