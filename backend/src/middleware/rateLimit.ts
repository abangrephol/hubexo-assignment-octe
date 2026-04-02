import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const WINDOW_MS = 60000;
const MAX_REQUESTS = 100;

const rateLimitStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, WINDOW_MS);

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || 'unknown';
  const now = Date.now();

  let entry = rateLimitStore.get(clientIp);

  if (!entry || entry.resetTime <= now) {
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
    rateLimitStore.set(clientIp, entry);
  } else {
    entry.count++;
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Try again later.'
    });
  }

  next();
}