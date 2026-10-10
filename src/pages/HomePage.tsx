/**
 * BizMate AI - Public Landing Page
 * Features Hero, interactive prompt preview, studio capabilities, workflow, pricing, and FAQ.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Sparkles,
  ArrowRight,
  Palette,
  FileText,
  Video,
  Share2,
  BarChart3,
  Mail,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, user } = useApp();
  const [sampleRequirement, setSampleRequirement] = useState(
    'Create a Deepavali promotion for my clothing shop in Chennai with 40% discount on silk sarees.'
  );

  const handleStartWithPrompt = () => {
    sessionStorage.setItem('bizmate_initial_prompt', sampleRequirement);
    navigate(user ? '/dashboard/creative-studio' : '/register');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Autonomous AI Marketing SaaS MVP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Turn One Business Idea Into a{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              Complete Marketing Campaign
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 leading-relaxed font-normal">
            For retail shops, creators, freelancers, and growing brands. Enter a single requirement and BizMate AI
            instantly designs promotional posters, multi-channel copy, YouTube thumbnails, video scripts, and executive reports.
          </p>

          {/* Interactive Requirement Box */}
          <div className="max-w-3xl mx-auto mt-8 bg-neutral-900/90 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={sampleRequirement}
                onChange={(e) => setSampleRequirement(e.target.value)}
                placeholder="e.g. Create a Deepavali promotion for my clothing shop in Chennai..."
                className="flex-1 bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 px-4 py-3.5 rounded-xl focus:outline-hidden focus:border-amber-400 transition"
              />
              <button
                onClick={handleStartWithPrompt}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm rounded-xl shadow-lg transition transform hover:scale-[1.02] cursor-pointer shrink-0"
              >
                <span>Generate Campaign</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Prompts */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 text-left">
              <span className="font-semibold text-neutral-300">Try examples:</span>
              <button
                onClick={() => setSampleRequirement('Create a Deepavali promotion for my clothing shop in Chennai with 40% discount')}
                className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              >
                🪔 Deepavali Clothing Promotion
              </button>
              <button
                onClick={() => setSampleRequirement('Grand launch weekend for my organic sourdough cafe in Bengaluru with free coffee')}
                className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              >
                ☕ Bengaluru Cafe Launch
              </button>
              <button
                onClick={() => setSampleRequirement('Summer clearance flash sale for my online electronics store with 3-day countdown')}
                className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              >
                ⚡ Electronics Flash Sale
              </button>
            </div>
          </div>

          {/* Social Proof & Integrity Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PostgreSQL Multi-Tenant RLS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Atomic Credit Ledger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Google Gemini 3.8 Flash SDK</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Pipeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-900 bg-neutral-950/60">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">The Autonomous Creative Workflow</h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            From raw idea to omnichannel distribution in under 60 seconds.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-10 text-xs">
            {[
              { step: '01', title: 'Requirement', desc: 'Single prompt input' },
              { step: '02', title: 'AI Breakdown', desc: 'Audience & mood intent' },
              { step: '03', title: 'Creative Plan', desc: 'Multi-format blueprint' },
              { step: '04', title: 'Atomic Queue', desc: 'Credit reservation' },
              { step: '05', title: 'Live Preview', desc: 'Customizable layout' },
              { step: '06', title: 'Export & Share', desc: 'PNG, SVG, WhatsApp, Mail' }
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col items-center text-center space-y-1 relative"
              >
                <span className="font-mono text-amber-400 font-black text-sm">{s.step}</span>
                <span className="font-bold text-neutral-100 text-xs">{s.title}</span>
                <span className="text-[11px] text-neutral-400">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Creative Formats Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="text-amber-400 font-mono text-xs uppercase tracking-widest font-semibold">
              Comprehensive Studio Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Every Asset Your Brand Needs, Fully Generated
            </h2>
            <p className="text-neutral-400 text-sm max-w-2xl mx-auto">
              Never pay separately for copywriters, graphic designers, video scriptwriters, and media planners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Palette,
                title: 'Promotional Poster',
                desc: 'Striking visual layouts with festive ornaments, badges, and high-contrast typography in SVG & PNG.',
                cost: '20 credits'
              },
              {
                icon: FileText,
                title: 'Marketing Copy',
                desc: 'Conversion-engineered captions, ad headlines, and high-CTR hooks for Instagram, Facebook, and WhatsApp.',
                cost: '5 credits'
              },
              {
                icon: Share2,
                title: 'Social Creatives',
                desc: 'Platform-optimized 1:1, 4:5, and 1.91:1 formats styled for high engagement feeds and stories.',
                cost: '15 credits'
              },
              {
                icon: Sparkles,
                title: 'YouTube Thumbnail',
                desc: '16:9 click-worthy thumbnails with bold readable typography and vibrant color balance.',
                cost: '20 credits'
              },
              {
                icon: Video,
                title: 'Promotional Video',
                desc: 'Commercial 30s multi-scene scripts, voiceover transcripts, and visual storyboard director cues.',
                cost: '30 credits'
              },
              {
                icon: MessageSquare,
                title: 'WhatsApp Broadcast',
                desc: 'Ready-to-send WhatsApp messages with emojis, bullet points, CTA links, and opt-out formatting.',
                cost: '5 credits'
              },
              {
                icon: Mail,
                title: 'Email Newsletter',
                desc: 'Subject lines, preview text, and responsive promotional newsletters ready for email platforms.',
                cost: '5 credits'
              },
              {
                icon: BarChart3,
                title: 'Business Strategy Report',
                desc: 'Audience demographics, budget allocation breakdown, expected ROAS, and key tracking KPIs.',
                cost: '25 credits'
              }
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition hover:bg-neutral-900/80 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">{f.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-amber-400/90 font-semibold">{f.cost}</span>
                  <span className="text-neutral-400 group-hover:text-neutral-200 transition">Instant Generation →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-900 bg-neutral-950/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Transparent Pricing for Any Scale</h2>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">
              No hidden fees. Every generation costs exact transparent credits with automatic refund protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Free Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹0</span>
                  <span className="text-xs text-neutral-400">/month</span>
                </div>
                <p className="text-xs text-neutral-400">50 Monthly Credits for testing and basic social posts.</p>
                <ul className="space-y-2 text-xs text-neutral-300 pt-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Single-prompt creative planner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard SVG promotional posters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Social copy & WhatsApp messages</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
              >
                Get Started Free
              </button>
            </div>

            {/* Growth Starter Plan */}
            <div className="p-6 rounded-2xl bg-neutral-900 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/10 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] uppercase tracking-wider shadow">
                Most Popular for Retailers
              </div>
              <div className="space-y-3">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">Growth Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹499</span>
                  <span className="text-xs text-neutral-400">/month</span>
                </div>
                <p className="text-xs text-neutral-400">500 Credits / month. Ideal for active shop owners and boutique brands.</p>
                <ul className="space-y-2 text-xs text-neutral-300 pt-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Multi-channel campaigns (WhatsApp + Email)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>High-resolution promotional posters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Commercial promo video scripts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>30-day asset retention</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs transition shadow-md"
              >
                Upgrade to Growth
              </button>
            </div>

            {/* Business Pro Plan */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Business Pro</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹1,499</span>
                  <span className="text-xs text-neutral-400">/month</span>
                </div>
                <p className="text-xs text-neutral-400">2,000 Credits / month for growing agencies and high-volume brands.</p>
                <ul className="space-y-2 text-xs text-neutral-300 pt-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All 8 Creative Studios Unlocked</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Executive marketing reports (PDF & CSV)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority background generation queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>90-day private asset retention</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
              >
                View Pro Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-900">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-neutral-400 text-xs">Everything you need to know about BizMate AI's architecture and credits.</p>
          </div>

          <div className="space-y-4 text-xs">
            {[
              {
                q: 'How does atomic credit reservation work?',
                a: 'Whenever you initiate a generation job, our backend checks your credit balance and locks the required credits in a pending reservation state. If the generation succeeds, the credits are consumed and recorded in the immutable usage ledger. If any failure occurs, the reservation is automatically refunded back to your balance immediately.'
              },
              {
                q: 'Can other users see my generated marketing assets?',
                a: 'No. BizMate AI enforces multi-tenant Row Level Security (RLS). Every media asset is stored under isolated paths (e.g. users/{userId}/...) and served exclusively through authenticated verification endpoints.'
              },
              {
                q: 'Which AI model powers the creative studio?',
                a: 'BizMate AI utilizes server-side Google Gemini 3.8 Flash SDK for real-time requirement deconstruction, multi-lingual marketing copy generation, visual design layout planning, and strategic marketing reports.'
              },
              {
                q: 'What happens if a third-party integration is not configured?',
                a: 'In accordance with our strict DevSecOps standards, BizMate AI never fabricates API success. Unconfigured external integrations (such as live Razorpay keys, WhatsApp Cloud tokens, or YouTube OAuth) are transparently reported as "NOT CONFIGURED / NOT TESTED" in both user and admin consoles.'
              }
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-white text-sm">{faq.q}</h4>
                <p className="text-neutral-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-neutral-950 to-neutral-900">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Supercharge Your Business Marketing?
          </h2>
          <p className="text-neutral-400 text-sm">
            Join thousands of modern retail entrepreneurs and creators generating high-converting campaigns in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-xl transition transform hover:scale-105"
            >
              Get Started with 50 Free Credits
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition"
            >
              Explore Pricing Plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
