/**
 * BizMate AI - Full-Stack Express Server Entry Point
 * Mounts REST APIs (/api/v1) and Vite SPA middlewares on port 3000.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './src/server/routes/api.routes.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logging & Security Headers (Permissive for iframe preview environment)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Avoid X-Frame-Options: SAMEORIGIN so AI Studio can render preview in iframe
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// REST API Routes
app.use('/api/v1', apiRouter);

// Health Check Endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (isProduction && hasDist) {
    console.log('[BizMate AI] Running in PRODUCTION mode, serving dist static assets.');
    app.use(express.static(distPath));
    app.use('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[BizMate AI] Running in DEVELOPMENT mode with Vite middleware.');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Critical SPA Fallback: Transforms and serves index.html for all client routes (/, /dashboard, /pricing, etc.)
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BizMate AI] Server actively listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BizMate AI] Failed to start server:', err);
  process.exit(1);
});
