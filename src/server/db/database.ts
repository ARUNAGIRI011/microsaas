/**
 * BizMate AI - In-Memory Relational Database Engine with RLS Enforcement
 * Strictly models PostgreSQL schemas, constraints, foreign keys, and RLS policies.
 */

import crypto from 'crypto';
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
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const demoUser: UserProfile = {
      id: 'usr-demo-retailer',
      email: 'demo@bizmate.ai',
      name: 'Arunagiri (Store Owner)',
      role: 'USER',
      organizationId: 'org-demo-retailer',
      emailVerified: true,
      businessName: 'BizMate Retail Boutique',
      industry: 'Retail & E-commerce',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(demoUser.id, demoUser);
    this.subscriptions.set(demoUser.id, {
      id: 'sub-demo-retailer',
      userId: demoUser.id,
      organizationId: 'org-demo-retailer',
      planId: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false
    });
    this.usageBalances.set(demoUser.id, {
      userId: demoUser.id,
      totalCredits: 50,
      usedCredits: 0,
      reservedCredits: 0,
      remainingCredits: 50,
      updatedAt: new Date().toISOString()
    });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = `${salt}:${crypto.scryptSync('DemoPassword2026!', salt, 64).toString('hex')}`;
    this.passwords.set(demoUser.email.toLowerCase(), hash);
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
        totalCredits: 0,
        usedCredits: 0,
        reservedCredits: 0,
        remainingCredits: 0,
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
