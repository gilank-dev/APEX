import { kv } from "@vercel/kv";

export interface RateLimiterOptions {
  /** Max requests allowed in the window. Default: 5. */
  maxAttempts?: number;
  /** Window duration in milliseconds. Default: 15 * 60 * 1000 (15 min). */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

export interface RateLimiter {
  check(key: string, now?: number): Promise<RateLimitResult>;
  reset(key: string): void;
}

/**
 * Redis-backed sliding-window rate limiter using Vercel KV.
 *
 * Each `key` gets its own sorted set where members are request timestamps.
 * On `check()`, expired entries are pruned, the count evaluated, and—if
 * allowed—the current timestamp is added in a single pipeline.
 */
export function createRedisRateLimiter(
  options: RateLimiterOptions = {},
): RateLimiter {
  const { maxAttempts = 5, windowMs = 15 * 60 * 1000 } = options;

  return {
    async check(
      key: string,
      now = Date.now(),
    ): Promise<RateLimitResult> {
      const windowStart = now - windowMs;
      const redisKey = `rl:${key}`;

      // Pipeline: prune expired entries → count remaining → optionally add new entry
      const pipeline = kv.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zcard(redisKey);
      pipeline.zadd(redisKey, { score: now, member: `${now}:${crypto.randomUUID()}` });
      pipeline.expire(redisKey, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec<
        [number, number, { ok: boolean }, { ok: boolean }]
      >();

      const count = results[1] as number;

      if (count > maxAttempts) {
        // Over limit — remove the entry we just added and compute retry-after
        await kv.zrem(redisKey, `${now}:${crypto.randomUUID()}`);
        const oldest = await kv.zrange(redisKey, 0, 0, { withScores: true });
        const oldestScore =
          Array.isArray(oldest) && oldest.length >= 2
            ? (oldest[1] as unknown as number)
            : now;
        const retryAfterSec = Math.max(
          0,
          Math.ceil((oldestScore + windowMs - now) / 1000),
        );
        return { allowed: false, retryAfterSec };
      }

      return { allowed: true, retryAfterSec: 0 };
    },

    async reset(key: string): Promise<void> {
      await kv.del(`rl:${key}`);
    },
  };
}

/** Singleton for common usage. */
export const rateLimiter = createRedisRateLimiter();
