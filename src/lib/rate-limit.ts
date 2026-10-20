interface RateLimitEntry {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-window rate limiter keyed by client identifier and route bucket.
 */
export function checkRateLimit(
  clientKey: string,
  bucketName: string,
  config: RateLimitConfig
): RateLimitCheckResult {
  const now = Date.now();
  const compositeKey = `${bucketName}:${clientKey}`;
  const cutoff = now - config.windowMs;

  const existing = buckets.get(compositeKey);
  const validTimestamps = existing
    ? existing.timestamps.filter((ts) => ts > cutoff)
    : [];

  if (validTimestamps.length >= config.maxRequests) {
    const oldestInWindow = validTimestamps[0] ?? now;
    const retryAfterMs = Math.max(1000, oldestInWindow + config.windowMs - now);
    buckets.set(compositeKey, { timestamps: validTimestamps });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  validTimestamps.push(now);
  buckets.set(compositeKey, { timestamps: validTimestamps });

  // Periodic cleanup of stale buckets
  if (buckets.size > 1000) {
    for (const [k, entry] of buckets.entries()) {
      const active = entry.timestamps.filter((ts) => ts > cutoff);
      if (active.length === 0) {
        buckets.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - validTimestamps.length),
    retryAfterSeconds: 0,
  };
}

export function extractClientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "local-client";
}

export function resetRateLimitBucketsForTest(): void {
  buckets.clear();
}
