/**
 * BizMate AI - Features Deep Dive Page
 */

import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Palette,
  FileText,
  Video,
  Share2,
  BarChart3,
  Mail,
  MessageSquare,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const { navigate } = useApp();

  const features = [
    {
      id: 'promotional_poster',
      title: 'Promotional Poster Generator',
      badge: 'Visual Graphic',
      cost: '20 Credits',
      description:
        'Craft stunning retail and festive event posters with bold typography, customizable discount badges, festive ornaments, and high-impact layout presets.',
      aspectRatios: ['1:1 (Square)', '4:5 (Portrait Feed)', '9:16 (Story)'],
      formats: ['SVG Vector', 'PNG High-Res', 'Editable Canvas'],
      idealFor: 'Showroom grand sales, Diwali/Pongal offers, restaurant menus, conference flyers'
    },
    {
      id: 'marketing_copy',
      title: 'Omnichannel Marketing Copy',
      badge: 'High Conversion Text',
      cost: '5 Credits',
      description:
        'AI copywriter generating psychological hooks, compelling value propositions, persuasive body text, emojis, and platform-tailored hashtags.',
      aspectRatios: ['Instagram Post', 'Facebook Ad', 'Google Search Headline'],
      formats: ['Direct Clipboard', 'Markdown', 'Text file'],
      idealFor: 'Product launches, social media managers, paid ad campaigns'
    },
    {
      id: 'youtube_thumbnail',
      title: 'YouTube Thumbnail Designer',
      badge: 'High CTR Graphic',
      cost: '20 Credits',
      description:
        'Create readable 16:9 thumbnails engineered for maximum Click-Through-Rate (CTR) across mobile and desktop feeds.',
      aspectRatios: ['16:9 (Landscape)'],
      formats: ['SVG Vector', 'PNG Export'],
      idealFor: 'Video creators, tutorial publishers, product demo channels'
    },
    {
      id: 'promotional_video',
      title: 'Promotional Video Storyboarder',
      badge: 'Commercial Director',
      cost: '30 Credits',
      description:
        'Detailed 30-second multi-scene commercial scripts, complete with director visual cues, voiceover timing, and background music suggestions.',
      aspectRatios: ['16:9 Landscape', '9:16 Reel / TikTok'],
      formats: ['Storyboard PDF', 'Scene JSON', 'Voiceover Script'],
      idealFor: 'Video production teams, influencer agencies, e-commerce ads'
    },
    {
      id: 'whatsapp_creative',
      title: 'WhatsApp Business Broadcasts',
      badge: 'Direct Messaging',
      cost: '5 Credits',
      description:
        'Formatted messages adhering to WhatsApp guidelines with bold highlights, bullet points, CTA links, and polite opt-out footer phrases.',
      aspectRatios: ['Instant Chat Format'],
      formats: ['One-Click WhatsApp Share', 'Template Copy'],
      idealFor: 'VIP customer broadcasts, local customer retention, flash sales'
    },
    {
      id: 'email_content',
      title: 'Email Newsletters & Campaigns',
      badge: 'Inbox Delivery',
      cost: '5 Credits',
      description:
        'Captivating subject lines, preview text snippets, and modular newsletter layouts designed for high open rates and click-throughs.',
      aspectRatios: ['Responsive HTML', 'Plain Text'],
      formats: ['HTML Template', 'Subject Variants'],
      idealFor: 'Weekly subscriber digests, seasonal announcements, abandoned cart recovery'
    },
    {
      id: 'business_report',
      title: 'Executive Marketing & Strategy Report',
      badge: 'Strategic Analytics',
      cost: '25 Credits',
      description:
        'Comprehensive marketing blueprint with customer persona analysis, multi-channel budget allocations, estimated ROAS, and key performance indicators.',
      aspectRatios: ['Executive Document'],
      formats: ['Printable PDF View', 'CSV Matrix', 'Structured JSON'],
      idealFor: 'Business planning, investor presentations, CMO strategy meetings'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Modern Business Growth</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Full Creative Studio Specifications</h1>
          <p className="text-neutral-400 text-sm max-w-2xl mx-auto">
            Discover the exact parameters, outputs, aspect ratios, and credit costs for each creative generation engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat) => (
            <div
              key={feat.id}
              className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    {feat.badge}
                  </span>
                  <span className="text-xs font-mono font-semibold text-neutral-400">{feat.cost}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{feat.description}</p>

                <div className="space-y-2 pt-2 text-xs border-t border-neutral-800/80">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-neutral-300 shrink-0">Aspect Ratios:</span>
                    <span className="text-neutral-400">{feat.aspectRatios.join(', ')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-neutral-300 shrink-0">Export Formats:</span>
                    <span className="text-neutral-400">{feat.formats.join(', ')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-neutral-300 shrink-0">Ideal For:</span>
                    <span className="text-neutral-400">{feat.idealFor}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard/creative-studio')}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition"
              >
                <span>Launch in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Call to action card */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Experience All Engines in One Unified Studio</h2>
          <p className="text-xs text-neutral-400 max-w-xl mx-auto">
            Try the single-requirement pipeline today and generate multi-format campaigns with zero design learning curve.
          </p>
          <button
            onClick={() => navigate('/dashboard/creative-studio')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs shadow-lg hover:brightness-110 transition"
          >
            Open Creative Studio Now
          </button>
        </div>
      </div>
    </div>
  );
};
