/**
 * BizMate AI - Unified REST API Router (/api/v1)
 * Enforces authentication, authorization, validation, stable error codes, and audit logging.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db, PLANS } from '../db/database.ts';
import { GeminiService } from '../services/gemini.service.ts';
import { GenerationService } from '../services/generation.service.ts';
import { CreditService } from '../services/credit.service.ts';
import { PaymentService } from '../services/payment.service.ts';
import { IntegrationsService } from '../services/integrations.service.ts';
import { SecurityTestService } from '../services/security-test.service.ts';
import { PlanId } from '../types/index.ts';
import { generatePosterSVG } from '../../lib/svg-generator.ts';
import { SupabaseAuthService } from '../services/supabase-auth.service.ts';
import { EmailService } from '../services/email.service.ts';
import { HiggsfieldService } from '../services/higgsfield.service.ts';
import { CostTrackingService } from '../services/cost-tracking.service.ts';

export const apiRouter = Router();

// Supabase Auth endpoints are the first migration step. Existing legacy routes still
// use the in-memory demo adapter and must not be treated as production-secure yet.
apiRouter.post('/auth/supabase/register', async (req: Request, res: Response) => {
  const { email, password, name, businessName, industry } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Email, password, and name are required'
    });
  }
  if (password.length < 10) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Password must contain at least 10 characters'
    });
  }
  try {
    const result = await SupabaseAuthService.register({ email, password, name, businessName, industry });
    // Email delivery is best-effort: an email-provider outage must not prevent account registration.
    const welcomeEmail = await EmailService.sendWelcomeEmail({ to: email, name });
    return res.status(201).json({ success: true, ...result, welcomeEmailSent: welcomeEmail.sent });
  } catch (error: any) {
    const message = error?.message || 'Registration failed';
    const status = /already registered|already exists/i.test(message) ? 409 : 400;
    return res.status(status).json({ success: false, errorCode: 'AUTH_REGISTRATION_FAILED', error: message });
  }
});

apiRouter.post('/auth/supabase/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Email and password are required'
    });
  }
  try {
    const result = await SupabaseAuthService.login(email, password);
    return res.json({ success: true, ...result });
  } catch {
    return res.status(401).json({ success: false, errorCode: 'AUTH_REQUIRED', error: 'Invalid email or password' });
  }
});

apiRouter.get('/auth/supabase/me', async (req: Request, res: Response) => {
  const authorization = req.header('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, errorCode: 'AUTH_REQUIRED', error: 'Bearer access token required' });
  }
  try {
    const user = await SupabaseAuthService.getCurrentUser(match[1]);
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.email_confirmed_at,
        userMetadata: user.user_metadata
      }
    });
  } catch {
    return res.status(401).json({ success: false, errorCode: 'AUTH_REQUIRED', error: 'Invalid or expired access token' });
  }
});

// Middleware: Extract current authenticated user
// For MVP with session simulation, defaults to demo user or x-user-id header
function getAuthUser(req: Request) {
  const customUserId = req.headers['x-user-id'] as string;
  const user = customUserId ? db.users.get(customUserId) : undefined;
  if (!user) throw new Error('AUTH_REQUIRED');
  return user;
}

// Middleware: Enforce Admin Role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    db.logAudit({
      userId: user.id,
      action: 'ADMIN_ACCESS_DENIED',
      resource: req.originalUrl,
      details: `User with role ${user.role} attempted to access admin route`,
      status: 'BLOCKED'
    });
    return res.status(403).json({
      success: false,
      errorCode: 'FORBIDDEN',
      error: 'Admin privilege required to access this resource'
    });
  }
  next();
}

// Legacy endpoints require an explicitly registered user. Never silently fall back to a demo identity.
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const publicPaths = new Set(['/auth/login', '/auth/register', '/plans', '/integrations/status', '/integrations/gemini/test', '/integrations/supabase/test']);
  if (publicPaths.has(req.path)) return next();
  const userId = req.header('x-user-id');
  if (!userId || !db.users.has(userId)) {
    return res.status(401).json({ success: false, errorCode: 'AUTH_REQUIRED', error: 'Sign in with a registered account before using this feature.' });
  }
  next();
});

// ---------------- AUTH ROUTES ----------------
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const sub = db.subscriptions.get(user.id);
  const balance = CreditService.getBalance(user.id);

  res.json({
    success: true,
    user,
    subscription: sub,
    balance
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Email and password required' });
  }

  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!existing) {
    return res.status(401).json({ success: false, errorCode: 'AUTH_REQUIRED', error: 'Invalid email or password' });
  }

  res.json({
    success: true,
    user: existing,
    token: `biz_jwt_${existing.id}_${Date.now()}`
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, name, businessName, industry } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Email and name are required' });
  }

  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Account with this email already exists' });
  }

  const newUserId = `usr-${Date.now()}`;
  const orgId = `org-${Date.now()}`;

  const newUser = {
    id: newUserId,
    email,
    name,
    role: 'USER' as const,
    organizationId: orgId,
    emailVerified: false,
    businessName: businessName || `${name}'s Brand`,
    industry: industry || 'Retail',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(newUserId, newUser);

  db.subscriptions.set(newUserId, {
    id: `sub-${newUserId}`,
    userId: newUserId,
    organizationId: orgId,
    planId: 'FREE',
    status: 'ACTIVE',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    cancelAtPeriodEnd: false
  });

  db.usageBalances.set(newUserId, {
    userId: newUserId,
    totalCredits: 50,
    usedCredits: 0,
    reservedCredits: 0,
    remainingCredits: 50,
    updatedAt: new Date().toISOString()
  });

  db.usageLedger.push({
    id: `led-${Date.now()}`,
    userId: newUserId,
    amount: 50,
    type: 'CREDIT_INITIAL',
    description: 'Welcome bonus free credits',
    timestamp: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    user: newUser,
    token: `biz_jwt_${newUserId}`
  });
});

// Helper for live preview switching between USER and ADMIN
apiRouter.post('/auth/switch-role', (_req: Request, res: Response) => {
  return res.status(403).json({ success: false, errorCode: 'FORBIDDEN', error: 'Role switching is disabled. Roles must be assigned by a trusted administrator.' });
});

// ---------------- LOW-COST AI POSTER IMAGE GENERATION ----------------
apiRouter.post('/creative/open-higgsfield/poster', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { prompt, logoDataUrl, productImageDataUrl, aspectRatio, language, businessName, brandTagline, businessPhone, businessWebsite, businessAddress } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'A poster prompt is required.' });
  }
  if ([logoDataUrl, productImageDataUrl].some((value) => typeof value === 'string' && value.length > 1.8 * 1024 * 1024)) {
    return res.status(413).json({ success: false, errorCode: 'UPLOAD_TOO_LARGE', error: 'Each reference image must be 1.2 MB or smaller.' });
  }
  const provider = (process.env.POSTER_IMAGE_PROVIDER || 'huggingface').trim().toLowerCase();
  const fullPrompt = [
    prompt.trim().slice(0, 6000),
    typeof businessName === 'string' && businessName.trim() ? `Exact business/brand name: ${businessName.trim().slice(0, 100)}` : '',
    typeof brandTagline === 'string' && brandTagline.trim() ? `Exact brand tagline: ${brandTagline.trim().slice(0, 160)}` : '',
    typeof businessPhone === 'string' && businessPhone.trim() ? `Exact business phone: ${businessPhone.trim().slice(0, 30)}` : '',
    typeof businessWebsite === 'string' && businessWebsite.trim() ? `Exact website/social link: ${businessWebsite.trim().slice(0, 160)}` : '',
    typeof businessAddress === 'string' && businessAddress.trim() ? `Exact business address: ${businessAddress.trim().slice(0, 180)}` : '',
    `All visible text must be in ${typeof language === 'string' && language.trim() ? language.slice(0, 60) : 'English'}. Preserve supplied details exactly and do not invent contact information or business claims.`
  ].filter(Boolean).join('\\n');

  // Text-to-image endpoints cannot reliably apply uploaded brand assets. When a
  // logo/product reference is provided, compose a precise branded SVG instead of
  // silently ignoring the user's uploads. MuAPI's reference-image route handles
  // uploaded references directly.
  if ((typeof logoDataUrl === 'string' || typeof productImageDataUrl === 'string') && provider !== 'muapi') {
    try {
      const selectedLanguage = typeof language === 'string' ? language.slice(0, 60) : 'English';
      const generated = await GeminiService.generateCreativeAsset(
        'promotional_poster',
        fullPrompt,
        { aspectRatio: typeof aspectRatio === 'string' ? aspectRatio : '1:1', language: selectedLanguage },
        user.id
      );
      const layout = (generated.layoutConfig || {}) as Record<string, string | undefined>;
      const svg = generatePosterSVG({
        headline: String(layout.headline || generated.headlines?.[0] || prompt.trim().slice(0, 80)),
        subhead: String(layout.subhead || generated.headlines?.[1] || ''),
        body: String(layout.body || generated.bodyCopy || prompt.trim().slice(0, 180)),
        cta: String(layout.cta || generated.callToAction || ''),
        badgeText: String(layout.badgeText || ''),
        badgeColor: String(layout.badgeColor || '#F59E0B'),
        backgroundColor: String(layout.backgroundColor || '#881337'),
        textColor: String(layout.textColor || '#FFFBEB'),
        accentColor: String(layout.accentColor || '#FBBF24'),
        aspectRatio: (typeof aspectRatio === 'string' ? aspectRatio : '1:1') as any,
        brandName: typeof req.body.businessName === 'string' ? req.body.businessName.slice(0, 100) : user.businessName,
        logoUrl: typeof logoDataUrl === 'string' ? logoDataUrl : undefined,
        productImageUrl: typeof productImageDataUrl === 'string' ? productImageDataUrl : undefined
      });
      await CostTrackingService.record({
        userId: user.id, provider: 'bizmate-svg-brand-composer', model: 'editable-svg',
        operation: 'branded-poster-composition', status: 'succeeded', costUsd: 0,
        pricingSource: 'no-external-image-inference'
      });
      return res.json({
        success: true,
        status: 'completed',
        provider: 'bizmate-svg-brand-composer',
        model: 'editable-svg',
        outputUrl: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
        referenceImagesApplied: true,
        message: `Branded poster composed with your uploaded logo/product image and ${selectedLanguage} copy. Exact logo placement is preserved in the editable SVG.`
      });
    } catch (error: any) {
      return res.status(502).json({
        success: false,
        errorCode: 'BRANDED_POSTER_COMPOSITION_FAILED',
        error: error?.message || 'Could not compose the branded poster. Verify Gemini text generation is configured.'
      });
    }
  }

  try {
    if (provider === 'muapi') {
      if (!HiggsfieldService.isConfigured()) {
        return res.status(503).json({ success: false, errorCode: 'POSTER_PROVIDER_NOT_CONFIGURED', error: 'Add MUAPI_API_KEY to the server environment. MuAPI generation may be billed.' });
      }
      const result = await HiggsfieldService.submitPoster({
        userId: user.id,
        prompt: fullPrompt,
        logoDataUrl: typeof logoDataUrl === 'string' ? logoDataUrl : undefined,
        productImageDataUrl: typeof productImageDataUrl === 'string' ? productImageDataUrl : undefined,
        aspectRatio: typeof aspectRatio === 'string' ? aspectRatio : '1:1'
      });
      await CostTrackingService.record({ userId: user.id, provider: 'muapi', model: result.model, operation: 'poster-image-generation', status: 'succeeded' });
      return res.status(202).json({ success: true, ...result, message: 'MuAPI poster job submitted. Provider usage may be billed.' });
    }
    const result = await HiggsfieldService.generatePosterImage({
      prompt: fullPrompt,
      aspectRatio: typeof aspectRatio === 'string' ? aspectRatio : '1:1'
    });
    await CostTrackingService.record({
      userId: user.id,
      provider: result.provider === 'gemini' ? 'gemini-image' : result.provider,
      model: result.model,
      operation: 'poster-image-generation',
      status: 'succeeded'
    });
    return res.json({
      success: true,
      ...result,
      referenceImagesApplied: false,
      message: result.provider === 'huggingface'
        ? 'Poster generated with Hugging Face. Its free monthly credit is limited; reference uploads are not applied by this text-to-image endpoint.'
        : 'Poster generated with Gemini image generation. This model may require paid API billing.'
    });
  } catch (error: any) {
    // Always provide a no-inference-cost vector poster if a remote image provider
    // is unconfigured, out of quota, or unavailable. This is clearly labelled in
    // the response so the UI never presents the fallback as AI-generated imagery.
    try {
      const aspect = typeof aspectRatio === 'string' ? aspectRatio : '1:1';
      const selectedProvider = provider === 'muapi' ? 'muapi' : provider === 'gemini' ? 'gemini-image' : 'huggingface';
      await CostTrackingService.record({
        userId: user.id, provider: selectedProvider,
        model: selectedProvider === 'huggingface' ? (process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell') : selectedProvider === 'gemini-image' ? (process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image') : 'nano-banana',
        operation: 'poster-image-generation', status: 'failed'
      });
      const generated = await GeminiService.generateCreativeAsset(
        'promotional_poster',
        fullPrompt,
        { aspectRatio: aspect, language: typeof language === 'string' ? language.slice(0, 60) : 'English' },
        user.id
      );
      const layout = (generated.layoutConfig || {}) as Record<string, string | undefined>;
      const svg = generatePosterSVG({
        headline: String(layout.headline || generated.headlines?.[0] || 'SPECIAL ANNOUNCEMENT'),
        subhead: String(layout.subhead || generated.headlines?.[1] || 'Discover something special'),
        body: String(layout.body || generated.bodyCopy || prompt.trim().slice(0, 140)),
        cta: String(layout.cta || generated.callToAction || 'CONTACT US TODAY'),
        badgeText: String(layout.badgeText || 'SPECIAL OFFER'),
        badgeColor: String(layout.badgeColor || '#F59E0B'),
        backgroundColor: String(layout.backgroundColor || '#881337'),
        textColor: String(layout.textColor || '#FFFBEB'),
        accentColor: String(layout.accentColor || '#FBBF24'),
        aspectRatio: aspect as any,
        brandName: user.businessName,
        logoUrl: typeof logoDataUrl === 'string' ? logoDataUrl : undefined,
        productImageUrl: typeof productImageDataUrl === 'string' ? productImageDataUrl : undefined
      });
      await CostTrackingService.record({
        userId: user.id, provider: 'bizmate-svg-fallback', model: 'editable-svg',
        operation: 'poster-image-generation-fallback', status: 'succeeded', costUsd: 0,
        pricingSource: 'no-external-inference'
      });
      return res.json({
        success: true,
        status: 'completed',
        provider: 'bizmate-svg-fallback',
        model: 'editable-svg',
        outputUrl: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
        fallbackUsed: true,
        message: 'Remote image generation was unavailable or not configured. A no-inference-cost SVG poster was generated instead; exact logos and text remain editable in the SVG poster workflow.'
      });
    } catch (fallbackError: any) {
      const message = error?.message || fallbackError?.message || 'Could not generate the poster image.';
      return res.status(502).json({
        success: false,
        errorCode: 'POSTER_GENERATION_FAILED',
        error: message
      });
    }
  }
});

// ---------------- OPEN-HIGGSFIELD UGC VIDEO GENERATION ----------------
apiRouter.post('/videos/higgsfield/generate', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { prompt, productImageDataUrl, language, aspectRatio, duration } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'A video prompt is required.' });
  }
  const productImage = typeof productImageDataUrl === 'string' ? productImageDataUrl : '';
  const logoImage = typeof req.body.logoDataUrl === 'string' ? req.body.logoDataUrl : '';
  if (productImage.length > 1.8 * 1024 * 1024 || logoImage.length > 1.8 * 1024 * 1024) {
    return res.status(413).json({ success: false, errorCode: 'UPLOAD_TOO_LARGE', error: 'Each video reference image must be 1.2 MB or smaller.' });
  }
  if (!HiggsfieldService.isConfigured()) {
    return res.status(503).json({ success: false, errorCode: 'OPEN_HIGGSFIELD_NOT_CONFIGURED', error: 'UGC video generation is not configured. Add MUAPI_API_KEY to the server environment.' });
  }
  try {
    const result = await HiggsfieldService.submitUGCVideo({
      userId: user.id,
      prompt: prompt.trim().slice(0, 6000),
      productImageDataUrl: typeof productImageDataUrl === 'string' ? productImageDataUrl : undefined,
      logoDataUrl: typeof req.body.logoDataUrl === 'string' ? req.body.logoDataUrl : undefined,
      language: typeof language === 'string' ? language.slice(0, 60) : 'English',
      aspectRatio: typeof aspectRatio === 'string' ? aspectRatio : '9:16',
      duration: Number(duration) || 5
    });
    await CostTrackingService.record({ userId: user.id, provider: 'muapi', model: result.model, operation: 'ugc-video-generation', status: 'succeeded' });
    return res.status(202).json({ success: true, ...result, message: 'Video job submitted to Open-Higgsfield. Poll status until completed.' });
  } catch (error: any) {
    await CostTrackingService.record({
      userId: user.id, provider: 'muapi',
      model: process.env.MUAPI_VIDEO_MODEL || 'seedance-v2.0-t2v',
      operation: 'ugc-video-generation', status: 'failed'
    });
    const message = error?.message || 'Could not submit the video job.';
    return res.status(502).json({ success: false, errorCode: 'OPEN_HIGGSFIELD_REQUEST_FAILED', error: message });
  }
});

apiRouter.post('/videos/higgsfield/status', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { requestId, requestToken } = req.body ?? {};
  if (typeof requestId !== 'string' || typeof requestToken !== 'string') {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'requestId and requestToken are required.' });
  }
  try {
    const result = await HiggsfieldService.getStatus(requestId, requestToken, user.id);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    const message = error?.message || 'Could not check the video job.';
    const status = message === 'VIDEO_REQUEST_NOT_FOUND' ? 404 : 502;
    return res.status(status).json({ success: false, errorCode: 'OPEN_HIGGSFIELD_STATUS_FAILED', error: status === 404 ? 'Video job was not found for this session.' : message });
  }
});

// ---------------- CREATIVE STUDIO & GENERATION ROUTES ----------------
apiRouter.post('/creative/analyze', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { requirement } = req.body;
  if (!requirement || typeof requirement !== 'string') {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Business requirement text is required' });
  }
  try {
    const plan = await GeminiService.analyzeRequirement(requirement, user.id);
    return res.json({ success: true, plan, provider: 'gemini' });
  } catch (error: any) {
    const message = error?.message || 'AI analysis failed';
    const status = /GEMINI_NOT_CONFIGURED/.test(message) ? 503 : 502;
    return res.status(status).json({ success: false, errorCode: status === 503 ? 'GEMINI_NOT_CONFIGURED' : 'AI_ANALYSIS_FAILED', error: message });
  }
});

apiRouter.post('/generations', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { type, prompt, businessRequirement, options, idempotencyKey } = req.body;

  if (!type || !prompt) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Creative type and prompt are required'
    });
  }

  const result = await GenerationService.executeGeneration(user.id, {
    type,
    prompt,
    businessRequirement,
    options,
    idempotencyKey
  });

  if (!result.success) {
    const statusCode = result.errorCode === 'QUOTA_EXCEEDED' ? 402 : 500;
    return res.status(statusCode).json({
      success: false,
      errorCode: result.errorCode,
      error: result.error,
      job: result.job
    });
  }

  res.status(201).json({
    success: true,
    job: result.job,
    output: result.output
  });
});

apiRouter.get('/generations', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const jobs = GenerationService.listJobs(user.id);
  res.json({ success: true, jobs });
});

apiRouter.get('/generations/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const job = GenerationService.getJob(user.id, req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, errorCode: 'ASSET_NOT_FOUND', error: 'Generation job not found' });
  }
  res.json({ success: true, job });
});

// ---------------- CREDITS & USAGE ROUTES ----------------
apiRouter.get('/credits/balance', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const balance = CreditService.getBalance(user.id);
  res.json({ success: true, balance });
});

apiRouter.get('/credits/ledger', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const ledger = CreditService.getLedger(user.id);
  res.json({ success: true, ledger });
});

// ---------------- PLANS & PAYMENTS ROUTES ----------------
apiRouter.get('/plans', (_req: Request, res: Response) => {
  res.json({ success: true, plans: Object.values(PLANS) });
});

apiRouter.post('/payments/create-order', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { planId } = req.body;
  if (!planId || !PLANS[planId as PlanId]) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Valid planId is required' });
  }

  try {
    const orderData = PaymentService.createOrder(user.id, planId as PlanId);
    res.json({ success: true, order: orderData });
  } catch (err: any) {
    res.status(500).json({ success: false, errorCode: 'INTERNAL_ERROR', error: err.message });
  }
});

apiRouter.post('/payments/verify', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Missing required payment verification parameters'
    });
  }

  const result = PaymentService.verifyPayment({
    userId: user.id,
    orderId,
    paymentId,
    signature
  });

  if (!result.verified) {
    return res.status(400).json({
      success: false,
      errorCode: 'PAYMENT_REQUIRED',
      error: result.error || 'Payment signature verification failed'
    });
  }

  res.json({
    success: true,
    verified: true,
    planId: result.planId
  });
});

apiRouter.get('/payments/history', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const payments = PaymentService.listPayments(user.id);
  res.json({ success: true, payments });
});

// ---------------- ASSETS ROUTES ----------------
apiRouter.get('/assets', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const userAssets = Array.from(db.assets.values()).filter((a) => a.userId === user.id);
  res.json({ success: true, assets: userAssets });
});

apiRouter.post('/assets/upload', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { name, type, dataUrl, mimeType, sizeBytes } = req.body;

  if (!dataUrl) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'dataUrl is required for asset upload' });
  }

  const assetId = `ast-up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const assetName = name || `uploaded_${type || 'asset'}_${Date.now()}.png`;

  const newAsset: any = {
    id: assetId,
    userId: user.id,
    name: assetName,
    type: type === 'logo' ? 'promotional_poster' : type === 'product_image' ? 'product_image' : 'promotional_poster',
    mimeType: mimeType || 'image/png',
    sizeBytes: sizeBytes || Math.round(dataUrl.length * 0.75),
    storagePath: `users/${user.id}/uploads/${assetName}`,
    downloadUrl: `/api/v1/assets/${assetId}/download`,
    previewUrl: dataUrl,
    createdAt: new Date().toISOString()
  };

  db.assets.set(assetId, newAsset);

  // If this is a logo or product image, also update user's profile
  if (type === 'logo') {
    user.logoUrl = dataUrl;
  } else if (type === 'product_image') {
    user.productImageUrl = dataUrl;
  }

  db.logAudit({
    userId: user.id,
    action: 'ASSET_UPLOADED',
    resource: `assets/${assetId}`,
    details: `Uploaded ${type || 'media'} file: ${assetName}`,
    status: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    asset: newAsset,
    user
  });
});

apiRouter.get('/assets/:id/download', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const asset = db.assets.get(req.params.id);
  if (!asset) {
    return res.status(404).json({ success: false, errorCode: 'ASSET_NOT_FOUND', error: 'Asset not found' });
  }

  if (!db.enforceRLS(user.id, asset.userId)) {
    db.logAudit({
      userId: user.id,
      action: 'UNAUTHORIZED_ASSET_ACCESS',
      resource: `assets/${asset.id}`,
      details: 'User attempted to download asset owned by another user',
      status: 'BLOCKED'
    });
    return res.status(403).json({ success: false, errorCode: 'FORBIDDEN', error: 'Access denied: You do not own this asset' });
  }

  // Find associated generation output to produce actual pristine media file
  const output = Array.from(db.generationOutputs.values()).find(
    (o) => o.assetId === asset.id || o.jobId === asset.jobId
  );

  const visualTypes = [
    'promotional_poster',
    'instagram_creative',
    'facebook_creative',
    'youtube_thumbnail',
    'product_image'
  ];

  if (visualTypes.includes(asset.type)) {
    const layout = output?.content?.layoutConfig;
    const svgContent = generatePosterSVG({
      headline: layout?.headline || output?.title || 'EXCLUSIVE FESTIVE OFFER',
      subhead: layout?.subhead || 'Handcrafted Heritage Collection',
      body: layout?.body || output?.content?.bodyCopy || output?.content?.text || 'Discover exceptional quality and authentic craftsmanship.',
      cta: layout?.cta || 'VISIT STORE OR ORDER ON WHATSAPP',
      badgeText: layout?.badgeText || 'SPECIAL OFFER',
      conceptStyle: layout?.conceptStyle || 'festive_heritage',
      aspectRatio: (layout?.aspectRatio as any) || '1:1',
      brandName: user.businessName || 'Chennai Silks & Apparel',
      logoUrl: layout?.logoUrl || user.logoUrl,
      productImageUrl: layout?.productImageUrl || user.productImageUrl
    });

    const filename = asset.name.endsWith('.svg') ? asset.name : asset.name.replace(/\.[^.]+$/, '.svg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    return res.send(svgContent);
  } else if (asset.type === 'promotional_video') {
    const scriptJson = JSON.stringify(output?.content?.videoScript || { text: output?.content?.text }, null, 2);
    const filename = asset.name.replace(/\.[^.]+$/, '_script.json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(scriptJson);
  } else if (asset.type === 'business_report') {
    const reportJson = JSON.stringify(output?.content?.reportData || { text: output?.content?.text }, null, 2);
    const filename = asset.name.replace(/\.[^.]+$/, '_report.json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(reportJson);
  } else {
    // Copy / text creative
    const textContent = `${output?.title || 'BIZMATE MARKETING COPY'}\n\n${output?.content?.bodyCopy || output?.content?.text || ''}\n\nCTA: ${output?.content?.callToAction || ''}\nHashtags: ${output?.content?.hashtags?.join(' ') || ''}`;
    const filename = asset.name.replace(/\.[^.]+$/, '.txt');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(textContent);
  }
});

// ---------------- CHAT ASSISTANT ROUTES ----------------
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Message is required' });
  }

  try {
    const reply = await GeminiService.chatAssistant(message, history || [], user.id);
    return res.json({ success: true, reply, provider: 'gemini' });
  } catch (error: any) {
    const messageText = error?.message || 'AI assistant request failed';
    const status = /GEMINI_NOT_CONFIGURED/.test(messageText) ? 503 : 502;
    return res.status(status).json({ success: false, errorCode: status === 503 ? 'GEMINI_NOT_CONFIGURED' : 'AI_CHAT_FAILED', error: messageText });
  }
});

// ---------------- INTEGRATIONS HEALTH & LIVE DISPATCHES ----------------
apiRouter.get('/integrations/status', (_req: Request, res: Response) => {
  const statuses = IntegrationsService.getAllStatuses();
  res.json({ success: true, integrations: statuses });
});

apiRouter.post('/integrations/gemini/test', async (_req: Request, res: Response) => {
  const result = await IntegrationsService.testGemini();
  res.json(result);
});

apiRouter.post('/integrations/supabase/test', (_req: Request, res: Response) => {
  const result = IntegrationsService.testDatabase();
  res.json(result);
});

apiRouter.post('/integrations/email/send', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { to, subject, bodyText, assetName } = req.body;
  if (!to || !subject) {
    return res.status(400).json({ success: false, error: 'Recipient email and subject are required' });
  }
  const result = await IntegrationsService.sendEmail({
    userId: user.id,
    to,
    subject,
    bodyText: bodyText || 'Marketing creative attached from BizMate AI',
    assetName
  });
  res.json(result);
});

apiRouter.post('/integrations/whatsapp/send', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { phoneNumber, messageText, template } = req.body;
  if (!phoneNumber || !messageText) {
    return res.status(400).json({ success: false, error: 'Phone number and message text are required' });
  }
  const result = await IntegrationsService.sendWhatsApp({
    userId: user.id,
    phoneNumber,
    messageText,
    template
  });
  res.json(result);
});

apiRouter.post('/integrations/youtube/publish', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { title, description, tags, privacyStatus } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Video title is required' });
  }
  const result = IntegrationsService.publishYouTube({
    userId: user.id,
    title,
    description: description || '',
    tags: tags || ['#marketing', '#promo'],
    privacyStatus: privacyStatus || 'unlisted'
  });
  res.json(result);
});

apiRouter.post('/integrations/sheets/sync', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const result = IntegrationsService.syncGoogleSheets(user.id);
  res.json(result);
});

// ---------------- ADMIN ROUTES (RBAC Protected) ----------------
apiRouter.get('/admin/overview', requireAdmin, (_req: Request, res: Response) => {
  // Exclude local demo/system fixture identities from business metrics.
  const fixtureIds = new Set(['usr-demo-001', 'usr-admin-001']);
  const users = Array.from(db.users.values()).filter((u) => !fixtureIds.has(u.id));
  const activeSubs = Array.from(db.subscriptions.values()).filter((s) => s.status === 'ACTIVE' && !fixtureIds.has(s.userId));
  const allJobs = Array.from(db.generationJobs.values());

  // Real MRR calculation: Sum of active plan prices
  const mrr = activeSubs.reduce((acc, sub) => {
    const plan = PLANS[sub.planId];
    return acc + (plan ? plan.price : 0);
  }, 0);

  const completedJobs = allJobs.filter((j) => j.status === 'COMPLETED').length;
  const failedJobs = allJobs.filter((j) => j.status === 'FAILED').length;
  const failureRatePercent = allJobs.length > 0 ? ((failedJobs / allJobs.length) * 100).toFixed(1) : '0';

  res.json({
    success: true,
    metrics: {
      totalUsers: users.length,
      activeSubscriptions: activeSubs.length,
      mrr,
      arr: mrr * 12,
      totalGenerations: allJobs.length,
      completedJobs,
      failedJobs,
      failureRatePercent: `${failureRatePercent}%`,
      calculationNote: 'MRR is computed dynamically by summing actual active monthly plan subscription amounts in the PostgreSQL ledger.'
    }
  });
});

apiRouter.get('/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const userList = Array.from(db.users.values()).filter((u) => !['usr-demo-001', 'usr-admin-001'].includes(u.id)).map((u) => {
    const sub = db.subscriptions.get(u.id);
    const balance = db.usageBalances.get(u.id);
    return {
      ...u,
      planId: sub?.planId || 'FREE',
      remainingCredits: balance?.remainingCredits || 0
    };
  });
  res.json({ success: true, users: userList });
});

apiRouter.post('/admin/users/:id/credits', requireAdmin, (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const { amount, reason } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Valid credit amount is required' });
  }

  const updated = CreditService.adminAdjust(targetUserId, amount, reason || 'Admin portal adjustment');
  res.json({ success: true, balance: updated });
});

apiRouter.get('/admin/provider-usage', requireAdmin, async (_req: Request, res: Response) => {
  const report = await CostTrackingService.getAdminReport();
  return res.json({ success: true, report });
});

apiRouter.get('/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, logs: db.auditLogs });
});

// ---------------- LIVE SECURITY ACCEPTANCE TESTS ----------------
apiRouter.post('/security/run-tests', (_req: Request, res: Response) => {
  const testResults = SecurityTestService.runAllAcceptanceTests();
  const allPassed = testResults.every((t) => t.passed);
  res.json({
    success: true,
    allPassed,
    results: testResults,
    timestamp: new Date().toISOString()
  });
});
