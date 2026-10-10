/**
 * BizMate AI - Shared Types & Interfaces
 */

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '1.91:1';

export type PlanId = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // in INR
  billingInterval: 'month' | 'year';
  description: string;
  textCredits: number;
  imageCredits: number;
  videoCredits: number;
  features: string[];
  teamSeats: number;
  retentionDays: number;
  supportLevel: 'community' | 'standard' | 'priority' | 'dedicated_manager';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  emailVerified: boolean;
  businessName?: string;
  industry?: string;
  brandColors?: string[];
  targetAudience?: string;
  logoUrl?: string;
  productImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId: string;
  planId: PlanId;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  razorpaySubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageBalance {
  userId: string;
  totalCredits: number;
  usedCredits: number;
  reservedCredits: number;
  remainingCredits: number;
  updatedAt: string;
}

export interface UsageLedgerEntry {
  id: string;
  userId: string;
  amount: number; // positive = added/refunded, negative = reserved/consumed
  type: 'CREDIT_INITIAL' | 'PLAN_ALLOCATION' | 'RESERVATION' | 'CONSUMPTION' | 'REFUND_FAILED_JOB' | 'ADMIN_OVERRIDE';
  jobId?: string;
  description: string;
  timestamp: string;
}

export type ConceptStyle =
  | 'festive_heritage'
  | 'neon_cyber'
  | 'minimalist_bauhaus'
  | 'luxury_royale'
  | 'retail_impact'
  | 'artisan_organic'
  | 'tech_minimal'
  | 'streetwear_bold';

export type GenerationType =
  | 'marketing_copy'
  | 'promotional_poster'
  | 'product_image'
  | 'instagram_creative'
  | 'facebook_creative'
  | 'youtube_thumbnail'
  | 'promotional_video'
  | 'whatsapp_creative'
  | 'email_content'
  | 'business_report';

export type JobStatus =
  | 'REQUESTED'
  | 'VALIDATING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface GenerationJob {
  id: string;
  userId: string;
  type: GenerationType;
  prompt: string;
  businessRequirement?: string;
  options: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5' | '1.91:1';
    language?: string;
    tone?: 'professional' | 'festive' | 'urgent' | 'friendly' | 'luxury';
    targetPlatform?: string;
    brandColors?: string[];
    includeOffer?: boolean;
    offerText?: string;
    conceptStyle?: ConceptStyle;
    logoUrl?: string;
    productImageUrl?: string;
  };
  creditsCost: number;
  creditsReserved: boolean;
  status: JobStatus;
  provider: 'gemini-3.8-flash' | 'nano-banana' | 'veo-stub' | 'higgsfield-adapter';
  providerClassification: 'FREE_PROVIDER' | 'PAID_PROVIDER';
  result?: GenerationOutput;
  error?: string;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationOutput {
  id: string;
  jobId: string;
  userId: string;
  type: GenerationType;
  title: string;
  content: {
    text?: string;
    headlines?: string[];
    bodyCopy?: string;
    callToAction?: string;
    hashtags?: string[];
    layoutConfig?: {
      headline: string;
      subhead: string;
      body: string;
      cta: string;
      badgeText?: string;
      badgeColor?: string;
      backgroundColor: string;
      textColor: string;
      accentColor: string;
      aspectRatio: string;
      conceptStyle?: ConceptStyle;
      logoUrl?: string;
      productImageUrl?: string;
      svgTemplate?: string;
    };
    imageUrl?: string;
    videoScript?: {
      scenes: Array<{
        sceneNumber: number;
        durationSeconds: number;
        visualDescription: string;
        voiceoverText: string;
        onScreenText: string;
      }>;
      totalDurationSeconds: number;
      suggestedBgm: string;
    };
    reportData?: {
      summary: string;
      targetAudienceAnalysis: string;
      campaignBudgetRecommendation: string;
      channelBreakdown: Array<{ channel: string; recommendedBudgetPercent: number; expectedRoi: string }>;
      kpis: Array<{ metric: string; target: string }>;
    };
  };
  assetId?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  userId: string;
  jobId?: string;
  name: string;
  type: GenerationType;
  mimeType: string;
  sizeBytes: number;
  storagePath: string; // e.g. users/{userId}/posters/{id}.png
  downloadUrl: string; // Authenticated download endpoint
  previewUrl: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number; // in INR
  currency: string;
  planId: PlanId;
  billingInterval?: 'month' | 'year';
  status: 'CREATED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  verified: boolean;
  createdAt: string;
  receiptUrl?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  timestamp: string;
}

export interface IntegrationStatus {
  name: string;
  category: 'DATABASE' | 'AI_PROVIDER' | 'PAYMENT' | 'EMAIL' | 'WHATSAPP' | 'PUBLISHING' | 'REPORTING';
  configured: boolean;
  statusText: 'CONFIGURED & ACTIVE' | 'NOT CONFIGURED / NOT TESTED' | 'OPERATIONAL_FALLBACK' | 'NOT CONFIGURED / SIMULATED' | 'NOT CONFIGURED';
  details: string;
  testedAt?: string;
}
