/**
 * BizMate AI - Public & Dashboard Footer
 */

import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';
import { AppRoute } from '../types/client.ts';

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 text-neutral-400 text-xs py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-xs">
              B
            </div>
            <span className="font-bold text-white text-base">BizMate AI</span>
          </div>
          <p className="text-neutral-400 leading-relaxed text-xs">
            Autonomous marketing & creative generation SaaS for retail businesses, agencies, and entrepreneurs.
            Generate omnichannel posters, copy, video scripts, and strategic reports from a single requirement.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Gemini 3.8 Flash Engine</span>
          </div>
        </div>

        {/* Product Links */}
        <div>
          <h4 className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Product</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => navigate('/dashboard/creative-studio')} className="hover:text-amber-400 transition">
                AI Creative Studio
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/features')} className="hover:text-amber-400 transition">
                Features & Supported Formats
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/pricing')} className="hover:text-amber-400 transition">
                Pricing & Credit Tiers
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/dashboard/chat')} className="hover:text-amber-400 transition">
                AI Marketing Assistant
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div>
          <h4 className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Compliance & Trust</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => navigate('/privacy')} className="hover:text-amber-400 transition">
                Privacy Policy & RLS Data Isolation
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/terms')} className="hover:text-amber-400 transition">
                Terms of Commercial Use
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/refund-policy')} className="hover:text-amber-400 transition">
                Credit Refund & Cancellation Policy
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/documentation')} className="hover:text-amber-400 transition">
                Developer API & Webhooks
              </button>
            </li>
          </ul>
        </div>

        {/* Company & Support */}
        <div>
          <h4 className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Support & Security</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => navigate('/about')} className="hover:text-amber-400 transition">
                About Architecture & Security
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/contact')} className="hover:text-amber-400 transition">
                Contact Enterprise Sales
              </button>
            </li>
            <li className="pt-2">
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>DevSecOps Certified</span>
                </div>
                <p className="text-neutral-400">Atomic credit reservation & zero unauthenticated API exposure.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-4">
        <div>© {new Date().getFullYear()} BizMate AI Technologies. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Server Port: 3000</span>
          <span>•</span>
          <span>Runtime: Vite + Node.js Express Full-Stack</span>
        </div>
      </div>
    </footer>
  );
};
