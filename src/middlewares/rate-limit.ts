import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../constants/http-status";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
  now?: () => number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export const createRateLimiter = (options: RateLimitOptions) => {
  const store = new Map<string, RateLimitEntry>();
  const now = options.now ?? Date.now;
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

  const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const currentTime = now();
    const key = `${options.keyPrefix ?? "global"}:${keyGenerator(req)}`;
    const existing = store.get(key);

    if (!existing || existing.resetAt <= currentTime) {
      store.set(key, {
        count: 1,
        resetAt: currentTime + options.windowMs,
      });
      setHeaders(res, options.maxRequests, options.maxRequests - 1, currentTime + options.windowMs);
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - currentTime) / 1_000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      setHeaders(res, options.maxRequests, 0, existing.resetAt);
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: options.message,
      });
      return;
    }

    existing.count += 1;
    store.set(key, existing);
    setHeaders(res, options.maxRequests, options.maxRequests - existing.count, existing.resetAt);
    next();
  };

  middleware.reset = (): void => {
    store.clear();
  };

  return middleware;
};

const defaultKeyGenerator = (req: Request): string =>
  req.ip || req.socket.remoteAddress || "unknown";

const setHeaders = (res: Response, limit: number, remaining: number, resetAt: number): void => {
  res.setHeader("RateLimit-Limit", String(limit));
  res.setHeader("RateLimit-Remaining", String(Math.max(remaining, 0)));
  res.setHeader("RateLimit-Reset", String(Math.ceil(resetAt / 1_000)));
};
