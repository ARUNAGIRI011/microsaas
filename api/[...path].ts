/**
 * Vercel serverless entrypoint for BizMate AI's Express API.
 * Vercel serves the Vite build from dist/ and routes /api/* requests here.
 */
import express from 'express';
import { apiRouter } from '../src/server/routes/api.routes.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
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

app.use('/api/v1', apiRouter);

export default app;
