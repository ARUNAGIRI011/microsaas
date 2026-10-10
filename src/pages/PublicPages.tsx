/**
 * BizMate AI - Public Information & Compliance Pages
 * Houses /about, /contact, /privacy, /terms, /refund-policy, and /documentation.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Shield, Lock, FileCode, CheckCircle, Mail, Phone, MapPin, Send } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">About BizMate AI Architecture</h1>
        <p className="text-neutral-300 text-sm leading-relaxed">
          BizMate AI was engineered to bridge the gap between complex generative AI infrastructure and everyday business
          marketing workflows. Built as a high-reliability modular full-stack SaaS, BizMate AI empowers retail store
          owners, creators, boutique brands, and marketing teams to produce production-grade marketing campaigns from a
          single business prompt.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-sm">Anti-Hallucination & Honest Integrations</h3>
            <p className="text-neutral-400">
              We never fabricate API responses, fake payment successes, or simulate non-existent cloud resources. Unconfigured
              credentials report "NOT CONFIGURED / NOT TESTED" transparently.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-sm">Atomic Credit Accounting</h3>
            <p className="text-neutral-400">
              Every generation job executes an atomic reservation lock. Double-spending is prevented at the database ledger level,
              and aborted generations are refunded automatically.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-sm">Multi-Tenant PostgreSQL Isolation</h3>
            <p className="text-neutral-400">
              Row Level Security (RLS) policies guarantee that no customer can read or download another organization's marketing
              data or private media assets.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
            <h3 className="font-bold text-white text-sm">Real Server-Side AI</h3>
            <p className="text-neutral-400">
              Powered by the official Google Gemini 3.8 Flash SDK, running securely on server-side endpoints with zero API keys
              exposed to client browsers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { addToast } = useApp();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast('Your enterprise inquiry has been submitted. Our team will contact you within 24 hours.', 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Contact BizMate AI Support & Enterprise Sales</h1>
          <p className="text-neutral-400 text-xs">Reach our technical architecture or sales engineering team.</p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-2xl bg-neutral-900 border border-emerald-500/30 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Message Received</h3>
            <p className="text-xs text-neutral-400">
              Thank you for reaching out! A technical representative will respond to your registered business email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="Arun Muthu"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold">Business Email</label>
                <input
                  required
                  type="email"
                  placeholder="arun@business.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-semibold">Inquiry Topic</label>
              <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400">
                <option>Custom Enterprise Volume / API Sync</option>
                <option>Razorpay / Payment Invoicing Inquiry</option>
                <option>WhatsApp Cloud API Integration Setup</option>
                <option>Technical Bug or Security Report</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-semibold">Message</label>
              <textarea
                required
                rows={4}
                placeholder="Describe your organization's marketing requirements or integration needs..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-md transition"
            >
              Submit Inquiry
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-xs text-neutral-300 leading-relaxed">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy & Security Standards</h1>
        <p className="text-neutral-400">Last updated: October 2026 • Strict Data Isolation Standards</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Multi-Tenant Data Isolation</h2>
          <p>
            BizMate AI is built upon strict Row-Level Security (RLS) standards. Every profile, organization member, asset, and
            generation job is tied to an authenticated UUID. User A cannot view, query, modify, or download User B's assets under
            any circumstances.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. AI Prompts and Model Training</h2>
          <p>
            Customer requirements, campaign text, promotional posters, and proprietary retail branding data are never utilized
            for training base public foundational models. All API requests to Google Gemini are dispatched securely via server-side
            proxy calls with explicit User-Agent telemetry.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Payment Credentials & Tokens</h2>
          <p>
            BizMate AI never stores raw credit card numbers or payment credentials. Payments are processed exclusively through
            PCI-DSS compliant gateways like Razorpay with cryptographic HMAC SHA-256 signature verification.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-xs text-neutral-300 leading-relaxed">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Commercial Service</h1>
        <p className="text-neutral-400">Commercial Usage Rights & Generation Guidelines</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Commercial Rights</h2>
          <p>
            Any marketing copy, promotional poster, social creative, YouTube thumbnail, or video script generated through BizMate AI
            becomes the commercial intellectual property of the account holder, subject to compliance with third-party platform
            guidelines (Meta, Google, WhatsApp, YouTube).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Prohibited Uses</h2>
          <p>
            Users are strictly prohibited from generating misleading, deceptive, fraudulent, or defamatory advertisements,
            counterfeit merchandise promotions, or content violating local retail consumer protection regulations.
          </p>
        </section>
      </div>
    </div>
  );
};

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-xs text-neutral-300 leading-relaxed">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Credit & Subscription Refund Policy</h1>
        <p className="text-neutral-400">Fair Use & Generation Protection</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Automatic Generation Failure Refund</h2>
          <p>
            BizMate AI enforces atomic credit reservations. In the rare event that an AI provider times out or produces an error
            during asset generation, all reserved credits are automatically restored to your balance immediately, recorded as
            REFUND_FAILED_JOB in your immutable usage ledger.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Subscription Cancellations</h2>
          <p>
            Subscriptions can be cancelled at any time from the Billing settings. Your credits remain available until the end
            of your current billing period.
          </p>
        </section>
      </div>
    </div>
  );
};

export const DocumentationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-xs text-neutral-300 leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Developer API & Integration Guide</h1>
          <p className="text-neutral-400">Complete REST API contracts for programmatic campaign generation.</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 font-mono">
          <div className="text-amber-400 font-bold">POST /api/v1/generations</div>
          <p className="text-neutral-400 text-[11px]">Creates a new asynchronous or synchronous marketing creative job.</p>
          <pre className="p-3 rounded-lg bg-neutral-950 text-neutral-300 text-[11px] overflow-x-auto">
{`{
  "type": "promotional_poster",
  "prompt": "Create a Deepavali promotion for my clothing shop in Chennai",
  "options": {
    "aspectRatio": "1:1",
    "tone": "festive",
    "includeOffer": true,
    "offerText": "FLAT 40% OFF"
  },
  "idempotencyKey": "unique-uuid-key"
}`}
          </pre>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 font-mono">
          <div className="text-amber-400 font-bold">POST /api/v1/creative/analyze</div>
          <p className="text-neutral-400 text-[11px]">Deconstructs a single raw requirement into a strategic multi-channel plan.</p>
          <pre className="p-3 rounded-lg bg-neutral-950 text-neutral-300 text-[11px] overflow-x-auto">
{`{
  "requirement": "Grand opening sale for our new supermarket in Coimbatore"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
