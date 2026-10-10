/**
 * Vercel serverless entrypoint for BizMate AI Express API.
 * The Vercel platform serves static Vite assets from dist/ and routes /api/* here.
 */
import express from 'express';
import { apiRouter } from '../src/server/routes/api.routes.ts';
import { RedisRateLimitService } from '../src/server/services/redis-rate-limit.service.ts';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Same-origin requests do not require permissive CORS. Only set an explicit
  // trusted app origin if APP_URL is configured.
  const origin = process.env.APP_URL?.trim();
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'bizmate-ai-api',
    timestamp: new Date().toISOString()
  });
});

// Shared Redis limiter must run before API handlers so every Vercel instance uses the same counters.
app.use('/api/v1', RedisRateLimitService.middleware());
app.use('/api/v1', apiRouter);

export default app;
