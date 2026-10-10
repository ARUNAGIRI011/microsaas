/**
 * BizMate AI - Gemini AI Service
 * Powered by Google Gemini 3.8 Flash SDK via server-side execution.
 */

import { GoogleGenAI } from '@google/genai';
import { GenerationType, GenerationOutput, ConceptStyle } from '../types/index.ts';
import { CostTrackingService } from './cost-tracking.service.ts';

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

export interface CreativePlan {
  businessObjective: string;
  targetAudience: string;
  recommendedCreatives: GenerationType[];
  brandTone: string;
  suggestedOffers: string[];
  keySellingPoints: string[];
  campaignName: string;
  conceptStyle?: ConceptStyle;
}

export class GeminiService {
  public static isConfigured(): boolean {
    return Boolean(apiKey && apiKey.length > 5);
  }

  public static inferConceptStyle(requirement: string): ConceptStyle {
    const req = requirement.toLowerCase();
    if (/diwali|deepavali|pongal|eid|festiv|saree|silk|traditional|ethnic|temple|puja|wedding/i.test(req)) {
      return 'festive_heritage';
    }
    if (/tech|electron|gadget|cyber|laptop|night|gaming|bootcamp|code|crypto/i.test(req)) {
      return 'neon_cyber';
    }
    if (/minimal|modern|architect|studio|clean|monochrome|design/i.test(req)) {
      return 'minimalist_bauhaus';
    }
    if (/luxury|gold|diamond|jewel|watch|perfume|couture|elite|premium|royal/i.test(req)) {
      return 'luxury_royale';
    }
    if (/flash sale|mega sale|supermarket|clearance|discount|50%|save|deal|flat/i.test(req)) {
      return 'retail_impact';
    }
    if (/cafe|coffee|bakery|organic|sourdough|earth|nature|vegan|wellness|green|farm/i.test(req)) {
      return 'artisan_organic';
    }
    return 'festive_heritage';
  }

  /**
   * Interprets a raw business requirement and produces a strategic creative campaign plan
   */
  public static async analyzeRequirement(requirement: string, userId = 'unknown'): Promise<CreativePlan> {
    if (!this.isConfigured()) {
      return this.fallbackCreativePlan(requirement);
    }

    const startedAt = Date.now();
    let providerCallRecorded = false;
    try {
      const prompt = `You are a world-class CMO and senior marketing strategist at BizMate AI.
Analyze the following business requirement and extract a comprehensive marketing campaign plan:
"${requirement}"

Respond strictly with valid JSON conforming to this structure:
{
  "businessObjective": "clear marketing objective",
  "targetAudience": "demographics and customer persona",
  "recommendedCreatives": ["promotional_poster", "marketing_copy", "whatsapp_creative", "instagram_creative", "youtube_thumbnail"],
  "brandTone": "festive / professional / urgent / luxury",
  "suggestedOffers": ["offer 1", "offer 2"],
  "keySellingPoints": ["point 1", "point 2", "point 3"],
  "campaignName": "Catchy Campaign Title"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const usage = (response as any).usageMetadata || {};
      await CostTrackingService.record({
        userId, provider: 'gemini', model: 'gemini-3.8-flash', operation: 'analyze-requirement',
        status: 'succeeded', inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount, durationMs: Date.now() - startedAt
      });
      providerCallRecorded = true;
      const text = response.text || '';
      return JSON.parse(text);
    } catch (error) {
      if (!providerCallRecorded) {
        await CostTrackingService.record({
          userId, provider: 'gemini', model: 'gemini-3.8-flash', operation: 'analyze-requirement',
          status: 'failed', durationMs: Date.now() - startedAt
        });
      }
      console.warn('Gemini analyzeRequirement failed, falling back to heuristic plan:', error);
      return this.fallbackCreativePlan(requirement);
    }
  }

  /**
   * Generates production marketing assets based on requirement, creative type, and options
   */
  public static async generateCreativeAsset(
    type: GenerationType,
    requirement: string,
    options: {
      aspectRatio?: string;
      tone?: string;
      language?: string;
      brandColors?: string[];
      offerText?: string;
    },
    userId = 'unknown'
  ): Promise<GenerationOutput['content']> {
    if (!this.isConfigured()) {
      return this.fallbackAssetGeneration(type, requirement, options);
    }

    const startedAt = Date.now();
    let providerCallRecorded = false;
    try {
      let promptInstruction = '';
      if (type === 'marketing_copy' || type === 'whatsapp_creative' || type === 'email_content') {
        promptInstruction = `Generate high-converting, omnichannel marketing copy for this requirement: "${requirement}".
Tone: ${options.tone || 'engaging'}. Offer: ${options.offerText || 'Special Festive Deal'}.
Provide:
- An array of punchy headlines
- Full body copy formatted with line breaks
- High CTR call to action
- 6-10 trending relevant hashtags
Return JSON:
{
  "headlines": ["Headline 1", "Headline 2", "Headline 3"],
  "bodyCopy": "Full compelling copy with emojis and urgency",
  "callToAction": "Actionable CTA",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;
      } else if (type === 'promotional_poster' || type === 'instagram_creative' || type === 'facebook_creative' || type === 'youtube_thumbnail') {
        promptInstruction = `Design a visually striking poster / thumbnail layout configuration for: "${requirement}".
Aspect Ratio: ${options.aspectRatio || '1:1'}. Tone: ${options.tone || 'festive'}. Offer: ${options.offerText || 'Exclusive Deal'}.
Language: ${options.language || 'English'}. All visible poster/thumbnail copy must be in this language. Preserve business names, addresses, phone numbers and URLs exactly.
Provide aesthetic color schemes and copy elements.
Return JSON:
{
  "headline": "BOLD MAIN HEADLINE (Max 5 words)",
  "subhead": "Supporting value proposition (Max 8 words)",
  "body": "Clear offer details and location or contact hook",
  "cta": "POWERFUL BUTTON / ACTION TEXT",
  "badgeText": "${options.offerText || 'SPECIAL OFFER'}",
  "badgeColor": "#F59E0B",
  "backgroundColor": "#881337",
  "textColor": "#FFFBEB",
  "accentColor": "#FBBF24",
  "aspectRatio": "${options.aspectRatio || '1:1'}"
}`;
      } else if (type === 'promotional_video') {
        promptInstruction = `Write a commercial promo video script and scene-by-scene storyboard for: "${requirement}".
Total duration ~30 seconds. Write all spoken voiceover and on-screen text in ${options.language || 'English'}. Preserve business names, addresses, phone numbers and URLs exactly.
Return JSON:
{
  "videoScript": {
    "totalDurationSeconds": 30,
    "suggestedBgm": "Upbeat Indian festive classical fusion with dhol beats",
    "scenes": [
      {
        "sceneNumber": 1,
        "durationSeconds": 5,
        "visualDescription": "Cinematic slow-motion shot of festive lights and customers entering showroom",
        "voiceoverText": "This festive season, celebrate in timeless elegance.",
        "onScreenText": "Chennai's Most Loved Silk Destination"
      },
      {
        "sceneNumber": 2,
        "durationSeconds": 10,
        "visualDescription": "Close up of vibrant handwoven Kanchipuram silk sarees with shimmering gold zari",
        "voiceoverText": "Discover pure Kanchipuram silks, festive dhotis, and designer wear crafted for royalty.",
        "onScreenText": "FLAT 40% OFF Festive Collection"
      },
      {
        "sceneNumber": 3,
        "durationSeconds": 8,
        "visualDescription": "Happy family trying matching ethnic outfits with smiling faces",
        "voiceoverText": "Special festive discounts for the entire family under one roof.",
        "onScreenText": "Exclusive Wedding & Festive Sets"
      },
      {
        "sceneNumber": 4,
        "durationSeconds": 7,
        "visualDescription": "Store exterior, contact phone, and Diwali fireworks overlay",
        "voiceoverText": "Visit Chennai Silks today or order directly on WhatsApp. Limited festive period offer!",
        "onScreenText": "Visit Us Today | WhatsApp: +91 98765 43210"
      }
    ]
  }
}`;
      } else if (type === 'business_report') {
        promptInstruction = `Create an executive marketing and campaign strategy report for: "${requirement}".
Return JSON:
{
  "reportData": {
    "summary": "Executive summary of the marketing opportunity and tactical campaign plan",
    "targetAudienceAnalysis": "In-depth buyer persona, purchasing triggers, and geographic targeting",
    "campaignBudgetRecommendation": "Suggested allocation model across Digital, Social, and Local activations",
    "channelBreakdown": [
      {"channel": "Meta & Instagram Ads", "recommendedBudgetPercent": 40, "expectedRoi": "4.2x ROAS"},
      {"channel": "WhatsApp Business Campaigns", "recommendedBudgetPercent": 25, "expectedRoi": "6.8x ROAS"},
      {"channel": "Local Outdoor & Store Activations", "recommendedBudgetPercent": 20, "expectedRoi": "3.5x footfall"},
      {"channel": "Google Search & Maps SEO", "recommendedBudgetPercent": 15, "expectedRoi": "5.0x intent conversion"}
    ],
    "kpis": [
      {"metric": "Customer Acquisition Cost (CAC)", "target": "< ₹250 per qualified store visitor"},
      {"metric": "Estimated Footfall Lift", "target": "+45% week-over-week during festival"},
      {"metric": "WhatsApp Catalog Inquiries", "target": "> 850 direct chat starts"}
    ]
  }
}`;
      } else {
        promptInstruction = `Generate creative marketing copy and promotional layout for: "${requirement}".
Return JSON:
{
  "headlines": ["Special Announcement", "Exclusive Deal"],
  "bodyCopy": "Discover unmatched quality and premium offerings for all your needs.",
  "callToAction": "Order Now"
}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptInstruction,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const usage = (response as any).usageMetadata || {};
      await CostTrackingService.record({
        userId, provider: 'gemini', model: 'gemini-3.8-flash', operation: `generate-creative-${type}`,
        status: 'succeeded', inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount, durationMs: Date.now() - startedAt
      });
      providerCallRecorded = true;
      const text = response.text || '';
      const parsed = JSON.parse(text);

      if (type === 'promotional_poster' || type === 'instagram_creative' || type === 'facebook_creative' || type === 'youtube_thumbnail') {
        const conceptStyle: ConceptStyle = (options as any).conceptStyle || this.inferConceptStyle(requirement);
        return {
          text: `${parsed.headline} - ${parsed.subhead}\n${parsed.body}\nCTA: ${parsed.cta}`,
          headlines: [parsed.headline, parsed.subhead],
          bodyCopy: parsed.body,
          callToAction: parsed.cta,
          layoutConfig: {
            ...parsed,
            conceptStyle
          }
        };
      } else if (type === 'promotional_video') {
        return {
          text: `30-Second Commercial Promo Script: ${requirement}`,
          videoScript: parsed.videoScript
        };
      } else if (type === 'business_report') {
        return {
          text: parsed.reportData?.summary || 'Executive Marketing Report',
          reportData: parsed.reportData
        };
      } else {
        return {
          text: parsed.bodyCopy,
          headlines: parsed.headlines || [],
          bodyCopy: parsed.bodyCopy,
          callToAction: parsed.callToAction,
          hashtags: parsed.hashtags || []
        };
      }
    } catch (err) {
      if (!providerCallRecorded) {
        await CostTrackingService.record({
          userId, provider: 'gemini', model: 'gemini-3.8-flash', operation: `generate-creative-${type}`,
          status: 'failed', durationMs: Date.now() - startedAt
        });
      }
      console.warn('Gemini generateCreativeAsset error, falling back:', err);
      return this.fallbackAssetGeneration(type, requirement, options);
    }
  }

  /**
   * Interactive Chat Assistant for Business & Marketing Guidance
   */
  public static async chatAssistant(message: string, history: Array<{ role: 'user' | 'model'; text: string }>, userId = 'unknown'): Promise<string> {
    if (!this.isConfigured()) {
      return `BizMate AI Assistant (Offline Simulation Mode): I can help you craft high-converting campaigns! For "${message}", I recommend pairing a 1:1 Instagram poster with an urgent WhatsApp broadcast copy. Upgrade or configure GEMINI_API_KEY for live streaming generation.`;
    }

    const startedAt = Date.now();
    try {
      const contents = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents as any,
        config: {
          systemInstruction: `You are the BizMate AI Senior Growth & Marketing Strategist. 
You provide concrete, revenue-driving marketing recommendations, copy variants, campaign schedules, and creative ideas.
Keep replies structured, concise, and focused on business ROI. If the user asks to generate posters or campaigns, advise them on the best creative type in BizMate AI's Creative Studio.`,
          temperature: 0.7
        }
      });

      const usage = (response as any).usageMetadata || {};
      await CostTrackingService.record({
        userId, provider: 'gemini', model: 'gemini-3.8-flash', operation: 'chat-assistant',
        status: 'succeeded', inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount, durationMs: Date.now() - startedAt
      });
      return response.text || 'I am ready to help optimize your business marketing strategy.';
    } catch (err: any) {
      await CostTrackingService.record({
        userId, provider: 'gemini', model: 'gemini-3.8-flash', operation: 'chat-assistant',
        status: 'failed', durationMs: Date.now() - startedAt
      });
      return `BizMate Assistant: Could not reach AI service (${err?.message || 'Network error'}). Please try again or check your API key configuration.`;
    }
  }

  // Heuristic Fallbacks when API key is missing or offline
  private static fallbackCreativePlan(requirement: string): CreativePlan {
    const isFestive = /deepavali|diwali|pongal|eid|christmas|new year|festival/i.test(requirement);
    return {
      businessObjective: `Drive footfall and revenue conversion for: ${requirement.slice(0, 40)}`,
      targetAudience: isFestive
        ? 'Festive shoppers, family decision makers, and local community buyers'
        : 'High-intent retail consumers looking for quality and verified discounts',
      recommendedCreatives: [
        'promotional_poster',
        'marketing_copy',
        'whatsapp_creative',
        'instagram_creative',
        'youtube_thumbnail',
        'promotional_video'
      ],
      brandTone: isFestive ? 'festive' : 'professional',
      suggestedOffers: ['FLAT 40% OFF Special Festive Discount', 'Buy 2 Get 1 Free on Select Stock', 'Complimentary Festive Gift Box'],
      keySellingPoints: [
        'Premium Quality Guaranteed',
        'Authentic Heritage Craftsmanship',
        'Limited-Time Showroom & WhatsApp Offer'
      ],
      campaignName: isFestive ? 'Grand Festive Celebration 2026' : 'Strategic Business Growth Campaign'
    };
  }

  private static fallbackAssetGeneration(
    type: GenerationType,
    requirement: string,
    options: any
  ): GenerationOutput['content'] {
    const isFestive = /deepavali|diwali|pongal|eid|christmas|festival/i.test(requirement);
    const headline = isFestive ? 'GRAND FESTIVE EXTRAVAGANZA' : 'PREMIUM BUSINESS SPECIAL';
    const subhead = 'Exclusive Festive Discounts & Heritage Collection';
    const body = `Celebrate in style! ${requirement}. Get authentic quality, festive cashback, and special member benefits.`;
    const cta = 'VISIT SHOWROOM OR SHOP ON WHATSAPP';

    if (type === 'promotional_poster' || type === 'instagram_creative' || type === 'facebook_creative' || type === 'youtube_thumbnail') {
      const conceptStyle: ConceptStyle = options.conceptStyle || this.inferConceptStyle(requirement);
      return {
        text: `${headline}\n${subhead}\n${body}\n${cta}`,
        headlines: [headline, subhead],
        bodyCopy: body,
        callToAction: cta,
        layoutConfig: {
          headline,
          subhead,
          body,
          cta,
          badgeText: options.offerText || 'FLAT 40% OFF',
          badgeColor: '#F59E0B',
          backgroundColor: '#881337',
          textColor: '#FFFBEB',
          accentColor: '#FBBF24',
          aspectRatio: options.aspectRatio || '1:1',
          conceptStyle
        }
      };
    } else if (type === 'promotional_video') {
      return {
        text: `Promotional Video Storyboard for: ${requirement}`,
        videoScript: {
          totalDurationSeconds: 30,
          suggestedBgm: 'Upbeat festive acoustic and percussive rhythm',
          scenes: [
            {
              sceneNumber: 1,
              durationSeconds: 6,
              visualDescription: 'Vibrant storefront display with festive decor and welcoming entrance',
              voiceoverText: 'This festive season, bring elegance and joy to your celebrations.',
              onScreenText: 'Grand Festive Celebration'
            },
            {
              sceneNumber: 2,
              durationSeconds: 12,
              visualDescription: 'Detailed showcases of prime collection items with high quality lighting',
              voiceoverText: 'Explore hand-selected collections curated exclusively for you and your loved ones.',
              onScreenText: 'FLAT 40% OFF Selected Styles'
            },
            {
              sceneNumber: 3,
              durationSeconds: 12,
              visualDescription: 'Call to action card with store address, contact number, and website',
              voiceoverText: 'Hurry! Limited stock available. Visit our store or order today on WhatsApp.',
              onScreenText: 'Shop Now | WhatsApp Order Available'
            }
          ]
        }
      };
    } else if (type === 'business_report') {
      return {
        text: 'Executive Campaign Strategy Report',
        reportData: {
          summary: `Comprehensive marketing blueprint for "${requirement}". Expected blended ROAS of 4.5x across social and messaging channels.`,
          targetAudienceAnalysis: 'Demographics: 25-50 years, festive shoppers, family heads, regional cultural affinity.',
          campaignBudgetRecommendation: 'Recommend ₹50,000 budget split: 40% Meta Ads, 30% WhatsApp Direct, 20% In-store banners, 10% Local influencer collabs.',
          channelBreakdown: [
            { channel: 'Meta & Instagram Ads', recommendedBudgetPercent: 40, expectedRoi: '4.2x ROAS' },
            { channel: 'WhatsApp Broadcast Catalog', recommendedBudgetPercent: 30, expectedRoi: '6.5x ROAS' },
            { channel: 'In-Store Physical Posters', recommendedBudgetPercent: 20, expectedRoi: 'High footfall lift' },
            { channel: 'Google Local & Maps SEO', recommendedBudgetPercent: 10, expectedRoi: 'High local intent' }
          ],
          kpis: [
            { metric: 'Footfall Conversion', target: '25% of showroom visitors' },
            { metric: 'WhatsApp Catalog Inquiries', target: '500+ chats' },
            { metric: 'Blended Cost Per Acquisition', target: '< ₹180' }
          ]
        }
      };
    } else {
      return {
        headlines: [headline, 'Limited Time Festive Celebration'],
        bodyCopy: `🪔 Celebrate the festival of lights with unmatched elegance!\n\n${requirement}\n\n✨ Pure Quality Guaranteed\n✨ Exclusive Handpicked Designs\n✨ Instant Home Delivery & Store Pickup\n\nDon't miss out on our limited-time offer!`,
        callToAction: cta,
        hashtags: ['#FestiveSale', '#DiwaliShopping', '#ChennaiFashion', '#FestiveVibes', '#SpecialOffer']
      };
    }
  }
}
