import type { RequestHandler } from "express";

type RateLimitOptions = {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function getClientIp(request: Parameters<RequestHandler>[0]) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

export function rateLimit({ keyPrefix, windowMs, maxRequests }: RateLimitOptions): RequestHandler {
  return (request, response, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientIp(request)}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({ message: "Bạn thao tác quá nhanh. Hãy thử lại sau." });
      return;
    }

    existing.count += 1;
    next();
  };
}
