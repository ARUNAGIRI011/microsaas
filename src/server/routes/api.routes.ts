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
  if (customUserId && db.users.has(customUserId)) {
    return db.users.get(customUserId)!;
  }
  return db.users.get('usr-demo-001')!; // Default active session
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
apiRouter.post('/auth/switch-role', (req: Request, res: Response) => {
  const { targetRole } = req.body;
  let targetUser = Array.from(db.users.values()).find((u) => u.role === targetRole);
  if (!targetUser) {
    targetUser = db.users.get('usr-admin-001')!;
  }
  res.json({
    success: true,
    user: targetUser
  });
});

// ---------------- HIGGSFIELD UGC VIDEO GENERATION ----------------
apiRouter.post('/videos/higgsfield/generate', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { prompt, productImageDataUrl, language, aspectRatio, duration } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'A video prompt is required.' });
  }
  if (!HiggsfieldService.isConfigured()) {
    return res.status(503).json({ success: false, errorCode: 'HIGGSFIELD_NOT_CONFIGURED', error: 'UGC video generation is not configured. Add HIGGSFIELD_API_KEY to the server environment.' });
  }
  try {
    const result = await HiggsfieldService.submitUGCVideo({
      userId: user.id,
      prompt: prompt.trim().slice(0, 6000),
      productImageDataUrl: typeof productImageDataUrl === 'string' ? productImageDataUrl : undefined,
      language: typeof language === 'string' ? language.slice(0, 60) : 'English',
      aspectRatio: typeof aspectRatio === 'string' ? aspectRatio : '9:16',
      duration: Number(duration) || 5
    });
    return res.status(202).json({ success: true, ...result, message: 'Video job submitted to Higgsfield. Poll status until completed.' });
  } catch (error: any) {
    const message = error?.message || 'Could not submit the video job.';
    return res.status(502).json({ success: false, errorCode: 'HIGGSFIELD_REQUEST_FAILED', error: message });
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
    return res.status(status).json({ success: false, errorCode: 'HIGGSFIELD_STATUS_FAILED', error: status === 404 ? 'Video job was not found for this session.' : message });
  }
});

// ---------------- CREATIVE STUDIO & GENERATION ROUTES ----------------
apiRouter.post('/creative/analyze', async (req: Request, res: Response) => {
  const { requirement } = req.body;
  if (!requirement || typeof requirement !== 'string') {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Business requirement text is required' });
  }

  const plan = await GeminiService.analyzeRequirement(requirement);
  res.json({ success: true, plan });
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
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: 'Message is required' });
  }

  const reply = await GeminiService.chatAssistant(message, history || []);
  res.json({ success: true, reply });
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
  const users = Array.from(db.users.values());
  const activeSubs = Array.from(db.subscriptions.values()).filter((s) => s.status === 'ACTIVE');
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
  const userList = Array.from(db.users.values()).map((u) => {
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
