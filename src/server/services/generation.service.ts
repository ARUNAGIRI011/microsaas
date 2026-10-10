/**
 * BizMate AI - Generation Service
 * Orchestrates job creation, idempotency, atomic credit lock, Gemini processing, and asset generation.
 */

import { db } from '../db/database.ts';
import { GenerationJob, GenerationOutput, GenerationType, Asset } from '../types/index.ts';
import { CreditService } from './credit.service.ts';
import { GeminiService } from './gemini.service.ts';

// In-memory idempotency cache to prevent concurrent duplicate submissions
const processedIdempotencyKeys = new Map<string, string>();

export class GenerationService {
  /**
   * Process a generation request
   */
  public static async executeGeneration(
    userId: string,
    params: {
      type: GenerationType;
      prompt: string;
      businessRequirement?: string;
      options?: any;
      idempotencyKey?: string;
    }
  ): Promise<{ success: boolean; job: GenerationJob; output?: GenerationOutput; error?: string; errorCode?: string }> {
    // 1. Idempotency Check
    if (params.idempotencyKey) {
      if (processedIdempotencyKeys.has(params.idempotencyKey)) {
        const existingJobId = processedIdempotencyKeys.get(params.idempotencyKey)!;
        const existingJob = db.generationJobs.get(existingJobId);
        if (existingJob) {
          const existingOutput = Array.from(db.generationOutputs.values()).find((o) => o.jobId === existingJobId);
          return {
            success: existingJob.status === 'COMPLETED',
            job: existingJob,
            output: existingOutput
          };
        }
      }
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cost = CreditService.getCost(params.type);

    // 2. Atomic Credit Reservation
    const reservation = CreditService.reserve(userId, cost, jobId);
    if (!reservation.success) {
      db.logAudit({
        userId,
        action: 'CREDIT_RESERVATION_FAILED',
        resource: `jobs/${jobId}`,
        details: `Insufficient credits for ${params.type}. Required: ${cost}`,
        status: 'BLOCKED'
      });
      return {
        success: false,
        job: {
          id: jobId,
          userId,
          type: params.type,
          prompt: params.prompt,
          options: params.options || {},
          creditsCost: cost,
          creditsReserved: false,
          status: 'FAILED',
          provider: 'gemini-3.8-flash',
          providerClassification: 'FREE_PROVIDER',
          error: reservation.error,
          errorCode: 'QUOTA_EXCEEDED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        error: reservation.error,
        errorCode: 'QUOTA_EXCEEDED'
      };
    }

    if (params.idempotencyKey) {
      processedIdempotencyKeys.set(params.idempotencyKey, jobId);
    }

    // 3. Create Job in QUEUED state
    const job: GenerationJob = {
      id: jobId,
      userId,
      type: params.type,
      prompt: params.prompt,
      businessRequirement: params.businessRequirement,
      options: params.options || {},
      creditsCost: cost,
      creditsReserved: true,
      status: 'PROCESSING',
      provider: 'gemini-3.8-flash',
      providerClassification: 'FREE_PROVIDER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.generationJobs.set(jobId, job);

    try {
      // 4. Invoke AI Generation via GeminiService
      const content = await GeminiService.generateCreativeAsset(
        params.type,
        params.prompt || params.businessRequirement || '',
        params.options || {}
      );

      // 5. Create Asset & Output Records
      const user = db.users.get(userId);
      if (content.layoutConfig) {
        content.layoutConfig.logoUrl = params.options?.logoUrl || user?.logoUrl;
        content.layoutConfig.productImageUrl = params.options?.productImageUrl || user?.productImageUrl;
        const businessAddress = typeof params.options?.businessAddress === 'string'
          ? params.options.businessAddress.replace(/\\s+/g, ' ').trim().slice(0, 80)
          : '';
        if (businessAddress && !String(content.layoutConfig.body || '').includes(businessAddress)) {
          // The SVG templates display at most 130 body characters across two lines.
          // Reserve space for the address so the contact detail is not silently clipped.
          const addressSuffix = ` | ${businessAddress}`;
          const availableBodyChars = Math.max(0, 128 - addressSuffix.length);
          const bodyText = String(content.layoutConfig.body || '').replace(/\\s+/g, ' ').trim().slice(0, availableBodyChars);
          content.layoutConfig.body = `${bodyText}${addressSuffix}`;
        }
        if (params.options?.conceptStyle) {
          content.layoutConfig.conceptStyle = params.options.conceptStyle;
        }
      }

      const outputId = `out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const assetId = `ast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const output: GenerationOutput = {
        id: outputId,
        jobId,
        userId,
        type: params.type,
        title: content.headlines?.[0] || content.layoutConfig?.headline || `${params.type.replace('_', ' ').toUpperCase()} Asset`,
        content,
        assetId,
        createdAt: new Date().toISOString()
      };

      const asset: Asset = {
        id: assetId,
        userId,
        jobId,
        name: `${params.type}_${Date.now()}.png`,
        type: params.type,
        mimeType: params.type === 'marketing_copy' ? 'text/plain' : 'image/png',
        sizeBytes: 256000,
        storagePath: `users/${userId}/${params.type}/${assetId}.png`,
        downloadUrl: `/api/v1/assets/${assetId}/download`,
        previewUrl: `/api/v1/assets/${assetId}/preview`,
        createdAt: new Date().toISOString()
      };

      db.generationOutputs.set(outputId, output);
      db.assets.set(assetId, asset);

      // 6. Update Job Status & Reconcile Credits
      job.status = 'COMPLETED';
      job.result = output;
      job.updatedAt = new Date().toISOString();
      CreditService.finalize(userId, cost, jobId, true);

      db.logAudit({
        userId,
        action: 'GENERATION_COMPLETED',
        resource: `jobs/${jobId}`,
        details: `Generated ${params.type} using ${cost} credits. Asset: ${assetId}`,
        status: 'SUCCESS'
      });

      return {
        success: true,
        job,
        output
      };
    } catch (error: any) {
      job.status = 'FAILED';
      job.error = error?.message || 'AI Generation process error';
      job.errorCode = 'GENERATION_FAILED';
      job.updatedAt = new Date().toISOString();

      // Refund reserved credits
      CreditService.finalize(userId, cost, jobId, false);

      db.logAudit({
        userId,
        action: 'GENERATION_FAILED',
        resource: `jobs/${jobId}`,
        details: `Generation failed: ${error?.message}. Credits refunded.`,
        status: 'FAILURE'
      });

      return {
        success: false,
        job,
        error: job.error,
        errorCode: 'GENERATION_FAILED'
      };
    }
  }

  public static listJobs(userId: string): GenerationJob[] {
    return Array.from(db.generationJobs.values())
      .filter((j) => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static getJob(userId: string, jobId: string): GenerationJob | null {
    const job = db.generationJobs.get(jobId);
    if (!job) return null;
    if (job.userId !== userId && !db.enforceRLS(userId, job.userId)) {
      return null;
    }
    return job;
  }
}
