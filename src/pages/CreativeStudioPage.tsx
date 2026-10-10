/**
 * BizMate AI - AI Creative Studio (/dashboard/creative-studio)
 * Central powerhouse: single requirement -> AI analysis -> creative type -> atomic generation -> live preview & export.
 * Supports end-user logo and product image uploads, 8 unique concept themes, and live integration dispatches.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Sparkles,
  Palette,
  FileText,
  Video,
  Share2,
  BarChart3,
  Mail,
  MessageSquare,
  Zap,
  ArrowRight,
  Check,
  Copy,
  Download,
  Send,
  Youtube,
  RefreshCw,
  ExternalLink,
  Upload,
  Image,
  Table,
  X
} from 'lucide-react';
import { GenerationType, GenerationJob, GenerationOutput, ConceptStyle } from '../server/types/index.ts';
import { PosterCanvas } from '../components/PosterCanvas.tsx';

// Sample Brand Assets for immediate 1-click preview
const SAMPLE_LOGO_GOLD = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 160 50"><text x="80" y="32" font-family="serif" font-size="20" font-weight="900" fill="%23fbbf24" text-anchor="middle" letter-spacing="4">CHENNAI</text></svg>`;
const SAMPLE_PRODUCT_SAREE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="190" viewBox="0 0 340 190"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23881337"/><stop offset="100%" stop-color="%23fbbf24"/></linearGradient></defs><rect width="340" height="190" fill="url(%23g)"/><text x="170" y="95" font-family="serif" font-size="22" font-weight="900" fill="%23ffffff" text-anchor="middle">Kanchipuram Pure Silk</text><text x="170" y="125" font-family="sans-serif" font-size="14" fill="%23fef3c7" text-anchor="middle">Handwoven Zari Showcase</text></svg>`;

export const CreativeStudioPage: React.FC = () => {
  const { user, balance, refreshUserData, addToast } = useApp();

  const [requirement, setRequirement] = useState(
    'Create a Deepavali promotion for my clothing shop in Chennai with 40% discount on silk sarees'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [creativePlan, setCreativePlan] = useState<any>(null);

  const [selectedType, setSelectedType] = useState<GenerationType>('promotional_poster');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5' | '1.91:1'>('1:1');
  const [tone, setTone] = useState<'festive' | 'professional' | 'urgent' | 'luxury' | 'friendly'>('festive');
  const [offerText, setOfferText] = useState('FLAT 40% OFF');
  const [conceptStyle, setConceptStyle] = useState<ConceptStyle>('festive_heritage');
  const [businessAddress, setBusinessAddress] = useState('');
  const [posterLanguage, setPosterLanguage] = useState('Tamil');
  const [thumbnailLanguage, setThumbnailLanguage] = useState('English');
  const [videoLanguage, setVideoLanguage] = useState('Tamil');
  const [videoJob, setVideoJob] = useState<{ requestId: string; requestToken: string } | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterJob, setPosterJob] = useState<{ requestId: string; requestToken: string } | null>(null);
  const [posterStatus, setPosterStatus] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  const contentLanguages = [
    'English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Bengali',
    'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Odia', 'Assamese',
    'Spanish', 'French', 'Arabic'
  ];

  // User Uploads State
  const [logoUrl, setLogoUrl] = useState<string>(user?.logoUrl || '');
  const [productImageUrl, setProductImageUrl] = useState<string>(user?.productImageUrl || '');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const [generating, setGenerating] = useState(false);
  const [activeOutput, setActiveOutput] = useState<GenerationOutput | null>(null);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);

  // Email / WhatsApp Modal states
  const [emailModal, setEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState(user?.email || 'arunagirinathan6@gmail.com');
  const [emailSending, setEmailSending] = useState(false);

  const [waModal, setWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState('+919876543210');
  const [waSending, setWaSending] = useState(false);

  // Poll the asynchronous Higgsfield render without blocking the page.
  useEffect(() => {
    if (!videoJob || ['completed', 'failed', 'canceled', 'cancelled', 'nsfw'].includes(videoStatus.toLowerCase())) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/v1/videos/higgsfield/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
          body: JSON.stringify(videoJob)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setVideoStatus('failed');
          addToast(data.error || 'Could not check video render status.', 'error');
          return;
        }
        setVideoStatus(String(data.status || 'processing'));
        if (data.videoUrl) setVideoUrl(data.videoUrl);
        if (String(data.status).toLowerCase() === 'completed' && data.videoUrl) {
          addToast('UGC video render completed.', 'success');
        } else if (['failed', 'canceled', 'cancelled', 'nsfw'].includes(String(data.status).toLowerCase())) {
          addToast(data.error || 'UGC video render did not complete.', 'error');
        }
      } catch {
        // Keep polling through temporary network errors.
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [videoJob, videoStatus, user?.id, addToast]);

  useEffect(() => {
    if (!posterJob || ['completed', 'failed', 'error', 'canceled', 'cancelled'].includes(posterStatus.toLowerCase())) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/v1/videos/higgsfield/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
          body: JSON.stringify(posterJob)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setPosterStatus('failed');
          addToast(data.error || 'Could not check poster generation status.', 'error');
          return;
        }
        setPosterStatus(String(data.status || 'processing'));
        if (data.outputUrl) setPosterUrl(data.outputUrl);
        if (String(data.status).toLowerCase() === 'completed' && data.outputUrl) {
          addToast('AI poster image is ready.', 'success');
        } else if (['failed', 'error', 'canceled', 'cancelled'].includes(String(data.status).toLowerCase())) {
          addToast(data.error || 'Poster generation failed.', 'error');
        }
      } catch {
        // Continue polling through temporary network errors.
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [posterJob, posterStatus, user?.id, addToast]);

  // Check if initial prompt was passed from landing page
  useEffect(() => {
    const saved = sessionStorage.getItem('bizmate_initial_prompt');
    if (saved) {
      setRequirement(saved);
      sessionStorage.removeItem('bizmate_initial_prompt');
      handleAnalyzeRequirement(saved);
    }
  }, []);

  const handleAnalyzeRequirement = async (textToAnalyze?: string) => {
    const targetText = textToAnalyze || requirement;
    if (!targetText.trim()) {
      addToast('Please enter a business requirement first', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/v1/creative/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement: targetText })
      });
      const data = await res.json();
      if (data.success) {
        setCreativePlan(data.plan);
        if (data.plan.brandTone) {
          if (['festive', 'professional', 'urgent', 'luxury'].includes(data.plan.brandTone.toLowerCase())) {
            setTone(data.plan.brandTone.toLowerCase() as any);
          }
        }
        if (data.plan.suggestedOffers?.[0]) {
          setOfferText(data.plan.suggestedOffers[0]);
        }
        addToast('AI strategic plan generated!', 'success');
      }
    } catch (err) {
      addToast('Error analyzing requirement', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.2 * 1024 * 1024) {
      addToast('Logo must be 1.2 MB or smaller for reliable upload.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      addToast('Brand logo attached!', 'success');
      // Sync to asset library in background
      fetch('/api/v1/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ name: file.name, type: 'logo', dataUrl, mimeType: file.type })
      }).catch(console.error);
    };
    reader.readAsDataURL(file);
  };

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.2 * 1024 * 1024) {
      addToast('Product photo must be 1.2 MB or smaller for reliable upload.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setProductImageUrl(dataUrl);
      addToast('Product photo attached!', 'success');
      // Sync to asset library in background
      fetch('/api/v1/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ name: file.name, type: 'product_image', dataUrl, mimeType: file.type })
      }).catch(console.error);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!requirement.trim()) {
      addToast('Please provide a business requirement', 'error');
      return;
    }

    setGenerating(true);
    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const selectedLanguage = selectedType === 'youtube_thumbnail'
      ? thumbnailLanguage
      : selectedType === 'promotional_video' ? videoLanguage : posterLanguage;
    const businessContext = [
      requirement.trim(),
      user?.businessName ? `Business/brand name: ${user.businessName}` : '',
      businessAddress.trim() ? `Business address/contact to include: ${businessAddress.trim()}` : '',
      `Write all poster/thumbnail text and any video dialogue in ${selectedLanguage}. Preserve the business name, address, phone numbers and URLs exactly.`
    ].filter(Boolean).join('\n');

    try {
      // Generate a real AI image for poster, social creative, and thumbnail formats.
      if (['promotional_poster', 'instagram_creative', 'youtube_thumbnail'].includes(selectedType)) {
        setPosterJob(null);
        setPosterUrl('');
        setPosterStatus('submitting');
        const posterRes = await fetch('/api/v1/creative/open-higgsfield/poster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
          body: JSON.stringify({
            prompt: businessContext,
            logoDataUrl: logoUrl || undefined,
            productImageDataUrl: productImageUrl || undefined,
            aspectRatio: selectedType === 'youtube_thumbnail' ? '16:9' : aspectRatio === '4:5' ? '4:5' : '1:1'
          })
        });
        const posterData = await posterRes.json();
        if (!posterRes.ok || !posterData.success) {
          setPosterStatus('failed');
          addToast(posterData.error || 'Open-Higgsfield image generation is not configured.', 'error');
          return;
        }
        setPosterJob({ requestId: posterData.requestId, requestToken: posterData.requestToken });
        setPosterStatus(posterData.status || 'queued');
        addToast('AI poster image queued. It will appear when the provider finishes.', 'info');
      }

      // Submit the paid video render first. If the provider is not configured, do not consume app credits.
      if (selectedType === 'promotional_video') {
        setVideoJob(null);
        setVideoUrl('');
        setVideoStatus('submitting');
        const videoRes = await fetch('/api/v1/videos/higgsfield/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
          body: JSON.stringify({
            prompt: businessContext,
            productImageDataUrl: productImageUrl || undefined,
            logoDataUrl: logoUrl || undefined,
            language: videoLanguage,
            aspectRatio: aspectRatio === '1:1' || aspectRatio === '16:9' || aspectRatio === '9:16' ? aspectRatio : '9:16',
            duration: 5
          })
        });
        const videoData = await videoRes.json();
        if (!videoRes.ok || !videoData.success) {
          setVideoStatus('failed');
          addToast(videoData.error || 'Higgsfield video generation is not configured.', 'error');
          return;
        }
        setVideoJob({ requestId: videoData.requestId, requestToken: videoData.requestToken });
        setVideoStatus(videoData.status || 'queued');
        addToast('UGC video queued with Higgsfield. Rendering may take a few minutes.', 'info');
      }

      const res = await fetch('/api/v1/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          type: selectedType,
          prompt: businessContext,
          businessRequirement: businessContext,
          options: {
            aspectRatio,
            language: selectedLanguage,
            businessAddress,
            tone,
            offerText,
            conceptStyle,
            logoUrl: logoUrl || undefined,
            productImageUrl: productImageUrl || undefined,
            brandColors: user?.brandColors || ['#881337', '#F59E0B']
          },
          idempotencyKey
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveJob(data.job);
        setActiveOutput(data.output);
        addToast(`Asset generated successfully! Consumed ${data.job.creditsCost} credits.`, 'success');
        await refreshUserData();
      } else {
        addToast(`Generation failed: ${data.error || 'Server error'}`, 'error');
      }
    } catch (err) {
      addToast('Generation network error', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmailDispatch = async () => {
    if (!emailTo) return;
    setEmailSending(true);
    try {
      const res = await fetch('/api/v1/integrations/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({
          to: emailTo,
          subject: activeOutput?.title || 'Your BizMate AI Marketing Campaign',
          bodyText: activeOutput?.content?.bodyCopy || activeOutput?.content?.text || requirement
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Email delivered to ${data.recipient}!`, 'success');
        setEmailModal(false);
      }
    } catch (err) {
      addToast('Email dispatch error', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendWhatsAppDispatch = async () => {
    if (!waPhone) return;
    setWaSending(true);
    try {
      const messageText = `${activeOutput?.title || 'Special Promotion'}\n\n${activeOutput?.content?.bodyCopy || activeOutput?.content?.text || requirement}\n\nOffer: ${offerText}`;
      const res = await fetch('/api/v1/integrations/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({
          phoneNumber: waPhone,
          messageText
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Dispatched to WhatsApp (+${waPhone.replace(/[^0-9]/g, '')})!`, 'success');
        setWaModal(false);
        if (data.directUrl) {
          window.open(data.directUrl, '_blank');
        }
      }
    } catch (err) {
      addToast('WhatsApp dispatch error', 'error');
    } finally {
      setWaSending(false);
    }
  };

  const handleSyncSheets = async () => {
    try {
      const res = await fetch('/api/v1/integrations/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Synced campaign data to Google Sheets (${data.syncedRows} rows)!`, 'success');
      }
    } catch (err) {
      addToast('Sheets sync error', 'error');
    }
  };

  const getCreditCost = (type: GenerationType) => {
    switch (type) {
      case 'promotional_video':
        return 30;
      case 'business_report':
        return 25;
      case 'promotional_poster':
      case 'youtube_thumbnail':
        return 20;
      case 'instagram_creative':
      case 'facebook_creative':
      case 'product_image':
        return 15;
      default:
        return 5;
    }
  };

  const currentCost = getCreditCost(selectedType);
  const hasEnoughCredits = (balance?.remainingCredits ?? 0) >= currentCost;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            AI Creative Studio
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Transform a single prompt into promotional posters, multi-channel copy, video scripts, and marketing reports.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-neutral-300">Remaining Balance:</span>
          <span className="font-bold text-amber-400">{balance?.remainingCredits ?? 0}</span>
        </div>
      </div>

      {/* STEP 1: Single Business Requirement Input */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Step 1: Enter Business Requirement
          </span>
          <button
            onClick={() => handleAnalyzeRequirement()}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
            <span>{analyzing ? 'Deconstructing...' : 'AI Strategic Analysis'}</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="e.g. Create a Deepavali promotion for my clothing shop in Chennai with 40% discount on pure Kanchipuram silk sarees..."
            className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 p-4 rounded-xl focus:outline-hidden focus:border-amber-400 transition"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
          <span className="font-semibold text-neutral-300">Sample Campaigns:</span>
          <button
            onClick={() => {
              setRequirement('Create a Deepavali promotion for my clothing shop in Chennai with 40% discount on pure Kanchipuram silk sarees');
              setSelectedType('promotional_poster');
              setTone('festive');
              setOfferText('FLAT 40% OFF');
              setConceptStyle('festive_heritage');
              setLogoUrl(SAMPLE_LOGO_GOLD);
              setProductImageUrl(SAMPLE_PRODUCT_SAREE);
            }}
            className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            🪔 Chennai Silk Festival
          </button>
          <button
            onClick={() => {
              setRequirement('Weekend brunch grand opening for artisanal sourdough bakery & cafe in Indiranagar Bengaluru');
              setSelectedType('instagram_creative');
              setTone('friendly');
              setOfferText('FREE ARTISAN COFFEE');
              setConceptStyle('artisan_organic');
            }}
            className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            ☕ Bengaluru Cafe Launch
          </button>
          <button
            onClick={() => {
              setRequirement('Year-end IT certification bootcamp flash sale for tech professionals in Hyderabad');
              setSelectedType('youtube_thumbnail');
              setTone('urgent');
              setOfferText('EARLY BIRD ₹4,999');
              setConceptStyle('neon_cyber');
            }}
            className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            💻 Tech Bootcamp Thumbnail
          </button>
          <button
            onClick={() => {
              setRequirement('Grand bridal diamond jewellery exhibition and luxury royal solitaire preview in Mumbai');
              setSelectedType('promotional_poster');
              setTone('luxury');
              setOfferText('ROYAL BRIDAL PREVIEW');
              setConceptStyle('luxury_royale');
            }}
            className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            👑 Luxury Bridal Solitaire
          </button>
          <button
            onClick={() => {
              setRequirement('Midnight warehouse clearance mega liquidation sale with flat 50% discount on all apparel');
              setSelectedType('promotional_poster');
              setTone('urgent');
              setOfferText('FLAT 50% CLEARANCE');
              setConceptStyle('retail_impact');
            }}
            className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            💥 Flash Clearance Sale
          </button>
        </div>
      </div>

      {/* AI Strategic Blueprint Card (if analyzed) */}
      {creativePlan && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-amber-300 text-sm">{creativePlan.campaignName || 'Campaign Blueprint'}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-neutral-300">
            <div>
              <span className="text-neutral-400 text-[10px] uppercase font-bold">Objective:</span>
              <p className="font-medium mt-0.5">{creativePlan.businessObjective}</p>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] uppercase font-bold">Audience Persona:</span>
              <p className="font-medium mt-0.5">{creativePlan.targetAudience}</p>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] uppercase font-bold">Key Selling Angles:</span>
              <p className="font-medium mt-0.5">{creativePlan.keySellingPoints?.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Creative Format Selection */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono block">
          Step 2: Choose Creative Output Format
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { id: 'promotional_poster', name: 'Promotional Poster', icon: Palette, cost: 20 },
            { id: 'marketing_copy', name: 'Omnichannel Copy', icon: FileText, cost: 5 },
            { id: 'instagram_creative', name: 'Instagram Creative', icon: Share2, cost: 15 },
            { id: 'youtube_thumbnail', name: 'YouTube Thumbnail', icon: Sparkles, cost: 20 },
            { id: 'promotional_video', name: 'UGC Promo Video', icon: Video, cost: 30 },
            { id: 'whatsapp_creative', name: 'WhatsApp Broadcast', icon: MessageSquare, cost: 5 },
            { id: 'email_content', name: 'Email Newsletter', icon: Mail, cost: 5 },
            { id: 'business_report', name: 'Executive Report', icon: BarChart3, cost: 25 }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedType(item.id as GenerationType);
                if (item.id === 'youtube_thumbnail') setAspectRatio('16:9');
                if (item.id === 'promotional_poster' || item.id === 'instagram_creative') setAspectRatio('1:1');
                if (item.id === 'promotional_video') setAspectRatio('9:16');
              }}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                selectedType === item.id
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <item.icon className={`w-4 h-4 ${selectedType === item.id ? 'text-amber-400' : 'text-neutral-400'}`} />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 font-bold text-neutral-400">
                  {item.cost} credits
                </span>
              </div>
              <span className="font-bold text-xs">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: Creative Options & User Asset Uploads */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Step 3: Configuration & Brand Assets
          </span>
        </div>

        {/* Upload Brand Logo & Product Photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          {/* Logo Upload Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Brand Logo</span>
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*,.svg"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Image className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Logo File</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoUrl(SAMPLE_LOGO_GOLD)}
                className="px-2.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-400 hover:text-white transition"
              >
                Sample Gold Monogram
              </button>
            </div>

            {logoUrl && (
              <div className="h-12 w-32 rounded-lg bg-neutral-900 border border-neutral-800 p-1 flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>

          {/* Product Photo Upload Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Product Image</span>
              </label>
              {productImageUrl && (
                <button
                  type="button"
                  onClick={() => setProductImageUrl('')}
                  className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <input
              type="file"
              ref={productInputRef}
              onChange={handleProductUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => productInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Image className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Product Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setProductImageUrl(SAMPLE_PRODUCT_SAREE)}
                className="px-2.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-400 hover:text-white transition"
              >
                Sample Silk Saree
              </button>
            </div>

            {productImageUrl && (
              <div className="h-12 w-32 rounded-lg bg-neutral-900 border border-neutral-800 p-1 flex items-center justify-center">
                <img src={productImageUrl} alt="Product" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Business contact and per-asset language settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-200">Business address / contact details</label>
            <textarea
              rows={2}
              maxLength={80}
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Shop address, city, phone or website to include in the creative"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />
            <p className="text-[10px] text-neutral-500">Only include contact details you want shown publicly in the ad.</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">Poster language</label>
              <select value={posterLanguage} onChange={(e) => setPosterLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100">
                {contentLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">YouTube thumbnail language</label>
              <select value={thumbnailLanguage} onChange={(e) => setThumbnailLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100">
                {contentLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">UGC video language</label>
              <select value={videoLanguage} onChange={(e) => setVideoLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100">
                {contentLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Layout Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            >
              <option value="1:1">1:1 (Square - Instagram/Facebook)</option>
              <option value="16:9">16:9 (Landscape - YouTube/Web)</option>
              <option value="9:16">9:16 (Portrait - Reels/TikTok/Stories)</option>
              <option value="4:5">4:5 (Portrait Feed)</option>
              <option value="1.91:1">1.91:1 (Landscape Ads)</option>
            </select>
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold">Marketing Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            >
              <option value="festive">Festive & Celebratory</option>
              <option value="urgent">Urgent & Flash Sale</option>
              <option value="friendly">Friendly & Warm</option>
              <option value="professional">Professional & Authoritative</option>
              <option value="luxury">Luxury & Premium</option>
            </select>
          </div>

          {/* Offer text */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold">Highlight Badge Offer</label>
            <input
              type="text"
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder="e.g. FLAT 40% OFF"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* 8 Unique Branding Concepts */}
          <div className="space-y-1.5 sm:col-span-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-semibold text-xs">
                Unique Branding Concept & Aesthetic Theme (8 Unique Layouts)
              </label>
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">
                {conceptStyle.replace('_', ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-1">
              {[
                { id: 'festive_heritage', name: 'Festive Heritage', emoji: '🪔' },
                { id: 'neon_cyber', name: 'Neon Cyber', emoji: '⚡' },
                { id: 'minimalist_bauhaus', name: 'Bauhaus Minimal', emoji: '📐' },
                { id: 'luxury_royale', name: 'Luxury Royale', emoji: '👑' },
                { id: 'retail_impact', name: 'Retail Impact', emoji: '💥' },
                { id: 'artisan_organic', name: 'Artisan Organic', emoji: '🌿' },
                { id: 'tech_minimal', name: 'Tech Obsidian', emoji: '💻' },
                { id: 'streetwear_bold', name: 'Streetwear ★', emoji: '★' }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConceptStyle(c.id as ConceptStyle)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    conceptStyle === c.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-[10px] leading-tight font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedType === 'promotional_video' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
            UGC video generation uses the external Higgsfield API and may incur separate provider charges. For video references, upload PNG, JPEG, or WebP product photos/logos; SVG logos remain supported for posters but are not sent as video references. Video models can alter logo lettering and contact details, so use the poster export for exact brand/address placement.
          </div>
        )}

        {/* Action Trigger Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Operation Cost:</span>
              <span className="font-mono font-bold text-amber-400">{currentCost} credits</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Atomic reservation: Credits are held during generation and refunded automatically if unfulfilled.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !hasEnoughCredits}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-xl transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>{selectedType === 'promotional_video' ? 'Submitting UGC video...' : 'Running Gemini Model Engine...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {selectedType.replace('_', ' ').toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {!hasEnoughCredits && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            Insufficient credits. You need {currentCost} credits, but your current balance is {balance?.remainingCredits ?? 0}.
            Please upgrade your plan in the Billing tab.
          </div>
        )}
      </div>

      {/* STEP 4: Live Generation Preview & Interactive Actions */}
      {activeOutput && (
        <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Generation Completed
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{activeOutput.title}</h2>
            </div>

            {/* Cross-Integration Dispatch Hub */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setEmailModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Campaign</span>
              </button>

              <button
                onClick={() => setWaModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Broadcast</span>
              </button>

              <button
                onClick={handleSyncSheets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-semibold transition cursor-pointer"
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync to Sheets</span>
              </button>
            </div>
          </div>

          {/* Display Output Based on Type */}
          {(activeOutput.type === 'promotional_poster' ||
            activeOutput.type === 'instagram_creative' ||
            activeOutput.type === 'facebook_creative' ||
            activeOutput.type === 'youtube_thumbnail' ||
            activeOutput.type === 'product_image') &&
            activeOutput.content.layoutConfig && (
              <div className="flex flex-col items-center">
                <PosterCanvas
                  layout={{
                    ...activeOutput.content.layoutConfig,
                    conceptStyle,
                    logoUrl: logoUrl || activeOutput.content.layoutConfig.logoUrl,
                    productImageUrl: productImageUrl || activeOutput.content.layoutConfig.productImageUrl
                  }}
                  brandName={user?.businessName || 'Chennai Silks & Apparel'}
                  aspectRatio={aspectRatio}
                  logoUrl={logoUrl || activeOutput.content.layoutConfig.logoUrl}
                  productImageUrl={productImageUrl || activeOutput.content.layoutConfig.productImageUrl}
                  onConceptChange={(newConcept) => setConceptStyle(newConcept)}
                  onCopyText={() => addToast('Poster text copied to clipboard', 'info')}
                />
              </div>
            )}

          {/* Marketing Copy View */}
          {(activeOutput.type === 'marketing_copy' ||
            activeOutput.type === 'whatsapp_creative' ||
            activeOutput.type === 'email_content') && (
            <div className="space-y-4 text-xs">
              {activeOutput.content.headlines && activeOutput.content.headlines.length > 0 && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                    High CTR Headlines
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-neutral-200">
                    {activeOutput.content.headlines.map((h, i) => (
                      <li key={i} className="font-semibold">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                  Campaign Body Copy
                </span>
                <p className="whitespace-pre-line text-neutral-200 leading-relaxed font-sans">
                  {activeOutput.content.bodyCopy || activeOutput.content.text}
                </p>
              </div>

              {activeOutput.content.callToAction && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400">Call to Action:</span>
                  <span className="font-bold text-amber-400">{activeOutput.content.callToAction}</span>
                </div>
              )}
            </div>
          )}

          {/* Open-Higgsfield AI-generated poster image */}
          {['promotional_poster', 'instagram_creative', 'youtube_thumbnail'].includes(activeOutput.type) && (
            <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">Open-Higgsfield AI image</p>
                  <p className="mt-1 text-[11px] text-neutral-400">Status: {posterStatus || 'not submitted'}</p>
                </div>
                {posterUrl && <a href={posterUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-300 underline">Open image</a>}
              </div>
              {posterUrl ? (
                <img src={posterUrl} alt="AI-generated business poster" className="max-h-[720px] w-full rounded-lg object-contain" />
              ) : ['queued', 'processing', 'submitting'].includes(posterStatus.toLowerCase()) ? (
                <p className="text-xs text-neutral-400">Rendering your AI image. This panel updates automatically.</p>
              ) : null}
            </div>
          )}

          {/* Actual Higgsfield UGC video result */}
          {activeOutput.type === 'promotional_video' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">Higgsfield UGC video</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Status: {videoStatus || 'not submitted'}</p>
                </div>
                {videoUrl && <a href={videoUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-300 underline">Open video</a>}
              </div>
              {videoUrl ? (
                <video controls playsInline src={videoUrl} className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-black" />
              ) : ['queued', 'processing', 'in_progress', 'submitting'].includes(videoStatus.toLowerCase()) ? (
                <p className="text-xs text-neutral-400">The provider is rendering your video. This panel updates automatically.</p>
              ) : null}
            </div>
          )}

          {/* Promotional Video Storyboard View */}
          {activeOutput.type === 'promotional_video' && activeOutput.content.videoScript && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400">Duration:</span>
                  <span className="font-bold text-white ml-2">
                    {activeOutput.content.videoScript.totalDurationSeconds} Seconds
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Suggested Music:</span>
                  <span className="font-bold text-amber-400 ml-2">
                    {activeOutput.content.videoScript.suggestedBgm}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {activeOutput.content.videoScript.scenes.map((scene) => (
                  <div key={scene.sceneNumber} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-mono">Scene {scene.sceneNumber}</span>
                      <span className="text-neutral-400 font-mono">{scene.durationSeconds}s</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold">Director Visual Cue:</span>
                      <p className="text-neutral-200 mt-0.5">{scene.visualDescription}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold">Voiceover:</span>
                      <p className="text-amber-300 italic mt-0.5">"{scene.voiceoverText}"</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold">On-Screen Text:</span>
                      <span className="font-mono text-neutral-300 ml-2 font-bold">{scene.onScreenText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business & Strategy Report View */}
          {activeOutput.type === 'business_report' && activeOutput.content.reportData && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Executive Summary</span>
                <p className="text-neutral-200 leading-relaxed">{activeOutput.content.reportData.summary}</p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Recommended Budget Allocation</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {activeOutput.content.reportData.channelBreakdown.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>{item.channel}</span>
                        <span className="text-amber-400">{item.recommendedBudgetPercent}%</span>
                      </div>
                      <div className="text-neutral-400 text-[11px]">Expected ROI: {item.expectedRoi}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                Send Marketing Creative via Email
              </h3>
              <button onClick={() => setEmailModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Dispatches high-converting campaign headlines, body copy, and poster graphics directly to your subscriber inbox.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEmailModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmailDispatch}
                disabled={emailSending}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {emailSending ? 'Dispatching...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {waModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                WhatsApp Broadcast Dispatch
              </h3>
              <button onClick={() => setWaModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Phone Number (with Country Code)</label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Dispatches marketing campaign text and links via the WhatsApp Business Cloud API and opens WhatsApp Web.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setWaModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsAppDispatch}
                disabled={waSending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {waSending ? 'Dispatching...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
