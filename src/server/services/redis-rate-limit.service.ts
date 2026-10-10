/**
 * Distributed fixed-window rate limiter using Upstash Redis REST.
 * The Lua script keeps INCR + expiry atomic across serverless instances.
 */
import type { NextFunction, Request, Response } from 'express';

const LUA_FIXED_WINDOW = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return {count, ttl}
`;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

export class RedisRateLimitService {
  static isConfigured(): boolean { return Boolean(redisConfig()); }

  static async consume(key: string, limit: number, windowSeconds: number) {
    const config = redisConfig();
    if (!config) throw new Error('REDIS_RATE_LIMIT_NOT_CONFIGURED');
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', LUA_FIXED_WINDOW, '1', key, String(windowSeconds)]),
      signal: AbortSignal.timeout(1500)
    });
    if (!response.ok) throw new Error(`REDIS_RATE_LIMIT_UPSTREAM_${response.status}`);
    const payload = await response.json() as { result?: [number, number]; error?: string };
    if (payload.error || !Array.isArray(payload.result)) throw new Error('REDIS_RATE_LIMIT_INVALID_RESPONSE');
    const count = Number(payload.result[0]);
    const ttl = Math.max(1, Number(payload.result[1]));
    return { allowed: count <= limit, limit, remaining: Math.max(0, limit - count), resetAt: Math.floor(Date.now() / 1000) + ttl };
  }

  static middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const mode = (process.env.RATE_LIMIT_MODE || 'required').trim().toLowerCase();
      if (!redisConfig()) {
        if (mode === 'local' && process.env.NODE_ENV !== 'production') return next();
        return res.status(503).json({ success: false, errorCode: 'RATE_LIMIT_UNAVAILABLE', error: 'Request protection is temporarily unavailable. Please retry shortly.' });
      }
      const path = req.path || '/';
      const isAuth = /^\/auth\/(supabase\/)?(login|register)$/.test(path);
      const isGeneration = /generation|creative|videos\/higgsfield/i.test(path);
      const limit = isAuth ? 10 : isGeneration ? 20 : 120;
      const bearer = req.header('authorization') || '';
      const identity = `${req.ip || 'unknown'}:${req.header('x-user-id') || (bearer ? bearer.slice(-32) : 'anonymous')}`;
      const group = isAuth ? 'auth' : isGeneration ? 'generation' : 'api';
      try {
        const result = await RedisRateLimitService.consume(`bizmate:rl:v1:${group}:${identity}`, limit, 60);
        res.setHeader('RateLimit-Limit', String(result.limit));
        res.setHeader('RateLimit-Remaining', String(result.remaining));
        res.setHeader('RateLimit-Reset', String(result.resetAt));
        if (!result.allowed) {
          res.setHeader('Retry-After', String(Math.max(1, result.resetAt - Math.floor(Date.now() / 1000))));
          return res.status(429).json({ success: false, errorCode: 'RATE_LIMIT_EXCEEDED', error: 'Too many requests. Please wait before trying again.' });
        }
        return next();
      } catch (error) {
        if (mode === 'local' && process.env.NODE_ENV !== 'production') return next();
        console.error('Redis rate limiter unavailable', error instanceof Error ? error.message : 'unknown error');
        return res.status(503).json({ success: false, errorCode: 'RATE_LIMIT_UNAVAILABLE', error: 'Request protection is temporarily unavailable. Please retry shortly.' });
      }
    };
  }
}
