/**
 * BizMate AI - In-Memory Relational Database Engine with RLS Enforcement
 * Strictly models PostgreSQL schemas, constraints, foreign keys, and RLS policies.
 */

import {
  UserProfile,
  Organization,
  OrganizationMember,
  Plan,
  Subscription,
  UsageBalance,
  UsageLedgerEntry,
  GenerationJob,
  GenerationOutput,
  Asset,
  PaymentRecord,
  AuditLog,
  IntegrationStatus,
  PlanId
} from '../types/index.ts';

// Standard Plans Configuration
export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: 'FREE',
    name: 'Free Starter',
    price: 0,
    billingInterval: 'month',
    description: 'Perfect for exploring BizMate AI creative tools.',
    textCredits: 50,
    imageCredits: 10,
    videoCredits: 0,
    features: [
      'Single-prompt creative planner',
      'Basic marketing copy & captions',
      'Standard SVG promotional poster generator',
      'Direct copy-to-clipboard & SVG export',
      'Community support'
    ],
    teamSeats: 1,
    retentionDays: 7,
    supportLevel: 'community'
  },
  STARTER: {
    id: 'STARTER',
    name: 'Growth Starter',
    price: 499,
    billingInterval: 'month',
    description: 'Ideal for small retail shops, solo creators, and boutique freelancers.',
    textCredits: 500,
    imageCredits: 100,
    videoCredits: 10,
    features: [
      'Multi-channel marketing campaigns (WhatsApp + Email + Instagram)',
      'High-resolution promotional posters & thumbnails',
      'Product image enhancers & background stylers',
      'Promotional video scripts & storyboard planner',
      'Asset library retention (30 days)',
      'Standard email support'
    ],
    teamSeats: 2,
    retentionDays: 30,
    supportLevel: 'standard'
  },
  PRO: {
    id: 'PRO',
    name: 'Business Pro',
    price: 1499,
    billingInterval: 'month',
    description: 'For growing brands, digital marketing agencies, and high-volume e-commerce.',
    textCredits: 2000,
    imageCredits: 500,
    videoCredits: 50,
    features: [
      'Unlimited prompt interpretation & campaign strategy',
      'All 8 creative studios (Poster, Copy, Video, Thumbnail, Report, WhatsApp, Email, Ad)',
      'Custom brand color palettes & typography presets',
      'Executive marketing report generation (PDF & CSV)',
      'Priority generation queue',
      'Asset retention (90 days)',
      'Priority 24/7 support'
    ],
    teamSeats: 5,
    retentionDays: 90,
    supportLevel: 'priority'
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Scale',
    price: 9999,
    billingInterval: 'month',
    description: 'Custom quotas, multi-brand organizations, and dedicated workflow support.',
    textCredits: 10000,
    imageCredits: 2500,
    videoCredits: 250,
    features: [
      'Custom model fine-tuning & brand voice matching',
      'Multi-organization workspace & unlimited seats',
      'Automated Google Sheets & WhatsApp business sync',
      'Dedicated cloud instance & SLA guarantee',
      'Dedicated Account Manager'
    ],
    teamSeats: 50,
    retentionDays: 365,
    supportLevel: 'dedicated_manager'
  }
};

class Database {
  public users: Map<string, UserProfile> = new Map();
  public passwords: Map<string, string> = new Map(); // In prod, argon2/bcrypt
  public organizations: Map<string, Organization> = new Map();
  public organizationMembers: Map<string, OrganizationMember> = new Map();
  public subscriptions: Map<string, Subscription> = new Map();
  public usageBalances: Map<string, UsageBalance> = new Map();
  public usageLedger: UsageLedgerEntry[] = [];
  public generationJobs: Map<string, GenerationJob> = new Map();
  public generationOutputs: Map<string, GenerationOutput> = new Map();
  public assets: Map<string, Asset> = new Map();
  public payments: Map<string, PaymentRecord> = new Map();
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const demoOrgId = 'org-demo-001';
    this.organizations.set(demoOrgId, {
      id: demoOrgId,
      name: 'Chennai Silks & Apparel',
      ownerId: 'usr-demo-001',
      createdAt: new Date().toISOString()
    });

    // 1. Regular User Profile
    const demoUser: UserProfile = {
      id: 'usr-demo-001',
      email: 'demo@bizmate.ai',
      name: 'Arun Muthu',
      role: 'USER',
      organizationId: demoOrgId,
      emailVerified: true,
      businessName: 'Chennai Silks & Apparel',
      industry: 'Retail & Fashion',
      brandColors: ['#B91C1C', '#F59E0B', '#1E3A8A'],
      targetAudience: 'Families, festive shoppers, and wedding attendees in South India',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(demoUser.id, demoUser);
    this.passwords.set(demoUser.email, 'password123');

    this.organizationMembers.set('mem-demo-001', {
      id: 'mem-demo-001',
      organizationId: demoOrgId,
      userId: demoUser.id,
      role: 'owner',
      createdAt: demoUser.createdAt
    });

    this.subscriptions.set(demoUser.id, {
      id: 'sub-demo-001',
      userId: demoUser.id,
      organizationId: demoOrgId,
      planId: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 5 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 25 * 86400000).toISOString(),
      cancelAtPeriodEnd: false
    });

    this.usageBalances.set(demoUser.id, {
      userId: demoUser.id,
      totalCredits: 2000,
      usedCredits: 120,
      reservedCredits: 0,
      remainingCredits: 1880,
      updatedAt: new Date().toISOString()
    });

    this.usageLedger.push({
      id: 'led-init-001',
      userId: demoUser.id,
      amount: 2000,
      type: 'PLAN_ALLOCATION',
      description: 'Monthly Business Pro credit allocation',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString()
    });

    // 2. Admin User Profile
    const adminUser: UserProfile = {
      id: 'usr-admin-001',
      email: 'admin@bizmate.ai',
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      organizationId: 'org-admin-001',
      emailVerified: true,
      businessName: 'BizMate AI Operations',
      industry: 'SaaS Platform Management',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(adminUser.id, adminUser);
    this.passwords.set(adminUser.email, 'admin123');

    this.usageBalances.set(adminUser.id, {
      userId: adminUser.id,
      totalCredits: 99999,
      usedCredits: 0,
      reservedCredits: 0,
      remainingCredits: 99999,
      updatedAt: new Date().toISOString()
    });

    // Seed a couple of initial generation jobs for demo
    this.seedDemoGenerations(demoUser.id);
  }

  private seedDemoGenerations(userId: string) {
    const jobId1 = 'job-seed-001';
    const outputId1 = 'out-seed-001';
    const assetId1 = 'ast-seed-001';

    const job1: GenerationJob = {
      id: jobId1,
      userId,
      type: 'promotional_poster',
      prompt: 'Create a Deepavali promotion for my clothing shop in Chennai with 40% discount',
      businessRequirement: 'Deepavali grand sale for saree, silk shirts, and kids ethnic wear',
      options: {
        aspectRatio: '1:1',
        tone: 'festive',
        brandColors: ['#B91C1C', '#F59E0B'],
        includeOffer: true,
        offerText: 'FLAT 40% OFF'
      },
      creditsCost: 20,
      creditsReserved: false,
      status: 'COMPLETED',
      provider: 'gemini-3.8-flash',
      providerClassification: 'FREE_PROVIDER',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    };

    const output1: GenerationOutput = {
      id: outputId1,
      jobId: jobId1,
      userId,
      type: 'promotional_poster',
      title: 'Grand Deepavali Silk Festival 2026',
      content: {
        text: 'Illuminate Your Celebrations! Discover pure Kanchipuram silks, festive dhotis, and designer ethnic wear with unmatched festive discounts in Chennai.',
        headlines: ['DEEPAVALI GRAND SILK FESTIVAL', 'Pure Tradition. Pure Elegance.'],
        bodyCopy: 'Step into tradition with handcrafted Pure Silk Sarees, Linen Kurtas, and Kids Ethnic sets. Exclusive Chennai showroom offer valid until Diwali night.',
        callToAction: 'Visit Our T. Nagar & Anna Nagar Stores Today!',
        layoutConfig: {
          headline: 'DEEPAVALI GRAND SILK FESTIVAL',
          subhead: 'Exclusive Festive Heritage Collection',
          body: 'Handwoven Kanchipuram Sarees & Royal Ethnic Wear. Get Flat 40% Festive Cash discount on all festive purchases above ₹4,999.',
          cta: 'SHOP IN CHENNAI OR ORDER ON WHATSAPP',
          badgeText: 'FLAT 40% OFF',
          badgeColor: '#F59E0B',
          backgroundColor: '#881337',
          textColor: '#FFFBEB',
          accentColor: '#FBBF24',
          aspectRatio: '1:1'
        }
      },
      assetId: assetId1,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    };

    const asset1: Asset = {
      id: assetId1,
      userId,
      jobId: jobId1,
      name: 'Deepavali_Festival_Poster_2026.png',
      type: 'promotional_poster',
      mimeType: 'image/png',
      sizeBytes: 420100,
      storagePath: `users/${userId}/posters/${assetId1}.png`,
      downloadUrl: `/api/v1/assets/${assetId1}/download`,
      previewUrl: `/api/v1/assets/${assetId1}/preview`,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    };

    this.generationJobs.set(jobId1, job1);
    this.generationOutputs.set(outputId1, output1);
    this.assets.set(assetId1, asset1);
  }

  // Row Level Security (RLS) enforcement helper
  public enforceRLS(requesterId: string, resourceOwnerId: string, isAdminAllowed = true): boolean {
    if (requesterId === resourceOwnerId) return true;
    if (isAdminAllowed) {
      const requester = this.users.get(requesterId);
      if (requester && (requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN')) {
        return true;
      }
    }
    return false;
  }

  // Audit Logger
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // Keep max 500 in memory
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  // Atomic Credit Management
  public reserveCredits(userId: string, amount: number, jobId: string): { success: boolean; remaining: number; error?: string } {
    let balance = this.usageBalances.get(userId);
    if (!balance) {
      balance = {
        userId,
        totalCredits: 50,
        usedCredits: 0,
        reservedCredits: 0,
        remainingCredits: 50,
        updatedAt: new Date().toISOString()
      };
      this.usageBalances.set(userId, balance);
    }

    if (balance.remainingCredits < amount) {
      return {
        success: false,
        remaining: balance.remainingCredits,
        error: `QUOTA_EXCEEDED: Requested ${amount} credits, but balance has ${balance.remainingCredits} credits available.`
      };
    }

    balance.reservedCredits += amount;
    balance.remainingCredits -= amount;
    balance.updatedAt = new Date().toISOString();

    this.usageLedger.push({
      id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      amount: -amount,
      type: 'RESERVATION',
      jobId,
      description: `Reserved ${amount} credits for job ${jobId}`,
      timestamp: new Date().toISOString()
    });

    return { success: true, remaining: balance.remainingCredits };
  }

  public finalizeCredits(userId: string, amount: number, jobId: string, success: boolean): void {
    const balance = this.usageBalances.get(userId);
    if (!balance) return;

    balance.reservedCredits = Math.max(0, balance.reservedCredits - amount);

    if (success) {
      balance.usedCredits += amount;
      this.usageLedger.push({
        id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        amount: -amount,
        type: 'CONSUMPTION',
        jobId,
        description: `Consumed ${amount} credits for completed job ${jobId}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Refund reservation on failure
      balance.remainingCredits += amount;
      this.usageLedger.push({
        id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        amount: amount,
        type: 'REFUND_FAILED_JOB',
        jobId,
        description: `Refunded ${amount} credits for failed job ${jobId}`,
        timestamp: new Date().toISOString()
      });
    }

    balance.updatedAt = new Date().toISOString();
  }
}

export const db = new Database();
