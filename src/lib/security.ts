import crypto from 'node:crypto'

export interface RateLimiterOptions {
  maxAttempts?: number
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSec: number
}

export interface RateLimiter {
  check(key: string, now?: number): Promise<RateLimitResult>
  reset(key: string): Promise<void>
}

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Minimal Upstash Redis REST client (fetch-based, zero-dependency).
 * Implements only the commands the persistent rate limiter needs.
 */
function createUpstashRestClient(url: string, token: string) {
  const request = async (command: (string | number)[]): Promise<unknown> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Upstash REST error: ${res.status}`)
    }
    const body = (await res.json()) as { result?: unknown }
    return body.result
  }

  return {
    zrangebyscore: (key: string, min: number, max: string): Promise<unknown[]> =>
      request(['ZRANGEBYSCORE', key, min, max]) as Promise<unknown[]>,
    zremrangebyscore: (key: string, min: string, max: number): Promise<unknown> =>
      request(['ZREMRANGEBYSCORE', key, min, max]),
    zadd: (key: string, ...members: [number, number][]): Promise<unknown> =>
      request(['ZADD', key, ...members.flatMap(([score, member]) => [score, member])]),
    expire: (key: string, seconds: number): Promise<unknown> => request(['EXPIRE', key, seconds]),
    del: (key: string): Promise<unknown> => request(['DEL', key]),
  }
}

/**
 * Generates a standardized request code: APX-XXXX-YYYYYY
 * - XXXX: 4 sanitized uppercase alphanumeric characters derived from the company slug
 * - YYYYYY: 6 cryptographically random alphanumeric characters
 */
export function generateRequestCode(slug: string): string {
  const normalized = (slug || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()

  const cleanPrefix = (normalized.padEnd(4, 'X')).slice(0, 4)

  // Rejection sampling: 256 % 36 != 0, so plain modulo biases toward the first
  // 4 characters. Redraw any byte >= 252 (the largest multiple of 36) instead.
  let randomPart = ''
  while (randomPart.length < 6) {
    const buf = crypto.randomBytes(1)
    if (buf[0] < 252) {
      randomPart += ALPHANUMERIC_CHARS[buf[0] % 36]
    }
  }

  return `APX-${cleanPrefix}-${randomPart}`
}

/**
 * Computes HMAC-SHA256 hex digest for WhatsApp webhook verification
 * Payload format: colon-separated concatenation of all parts
 * Examples:
 *   hmacSignature(secret, companyId, tier, ts)
 *   → `${companyId}:${tier}:${ts}`
 *   hmacSignature(secret, companyId, employeeId, payslipMonth, ts)
 *   → `${companyId}:${employeeId}:${payslipMonth}:${ts}`
 */
export function hmacSignature(
  secret: string,
  ...parts: (string | number)[]
): string {
  const payload = parts.join(':')
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verifies webhook HMAC signature using timing-safe comparison
 */
export function verifyHmacSignature(
  signature: string,
  secret: string,
  companyId: string,
  tier: string,
  ts: number | string
): boolean {
  if (!signature || !secret) return false
  const expected = hmacSignature(secret, companyId, tier, ts)
  const sigBuf = Buffer.from(signature, 'utf8')
  const expBuf = Buffer.from(expected, 'utf8')
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

/**
 * Verifies that a unix second timestamp is within the allowed window (default: 300 seconds)
 */
export function verifyTimestamp(
  ts: number | string,
  now: number = Math.floor(Date.now() / 1000),
  windowMsOrSec: number = 300
): boolean {
  const tsNum = typeof ts === 'number' ? ts : Number(ts)
  if (isNaN(tsNum) || !isFinite(tsNum)) return false

  // Allow window to be specified in seconds or milliseconds
  const windowSec = windowMsOrSec > 1000 ? windowMsOrSec / 1000 : windowMsOrSec
  return Math.abs(now - tsNum) <= windowSec
}

/**
 * Creates an in-memory sliding-window rate limiter
 */
export function createRateLimiter(options?: RateLimiterOptions): RateLimiter {
  const maxAttempts = options?.maxAttempts ?? 10
  const windowMs = options?.windowMs ?? 10 * 60 * 1000
  const storage = new Map<string, number[]>()

  return {
    async check(key: string, explicitNow?: number): Promise<RateLimitResult> {
      const now = explicitNow ?? Date.now()
      let timestamps = storage.get(key) || []

      // Prune timestamps older than window
      timestamps = timestamps.filter((t) => now - t < windowMs)

      if (timestamps.length >= maxAttempts) {
        const oldest = timestamps[0]
        const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
        storage.set(key, timestamps)
        return Promise.resolve({ allowed: false, retryAfterSec })
      }

      timestamps.push(now)
      storage.set(key, timestamps)
      return Promise.resolve({ allowed: true, retryAfterSec: 0 })
    },

    reset(key: string): Promise<void> {
      storage.delete(key)
      return Promise.resolve()
    },
  }
}

const VALID_TIERS = new Set(['free', 'pro', 'enterprise'])

/**
 * Creates a distributed sliding-window rate limiter using Upstash Redis.
 * Requirements: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars set.
 * Falls back gracefully to an in-memory limiter if Upstash is unavailable.
 */
export function createRateLimiterPersistent(options?: RateLimiterOptions): RateLimiter {
  const maxAttempts = options?.maxAttempts ?? 10
  const windowMs = options?.windowMs ?? 10 * 60 * 1000

  // Attempt to load Upstash client lazily; if unavailable, fall back.
  let redisClient: { zrangebyscore: (k: string, min: number, max: string) => Promise<unknown[]>; zremrangebyscore: (k: string, min: string, max: number) => Promise<unknown>; zadd: (k: string, ...m: [number, number][]) => Promise<unknown>; expire: (k: string, s: number) => Promise<unknown>; del: (k: string) => Promise<unknown> } | null = null
  try {
    // Dynamic import via eval-free lazy require replacement: use global fetch-based
    // Upstash REST only when configured. Avoids require() (ESM-forbidden) and
    // keeps the dependency optional at runtime.
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (upstashUrl && upstashToken) {
      redisClient = createUpstashRestClient(upstashUrl, upstashToken)
    }
  } catch {
    // Upstash not configured -> in-memory fallback
    redisClient = null
  }

  // In-memory fallback (as before) – same implementation as createRateLimiter
  const storage = new Map<string, number[]>()

  const check = async (key: string, explicitNow?: number): Promise<RateLimitResult> => {
    const now = explicitNow ?? Date.now()
    let timestamps: number[] = []

    if (redisClient) {
      try {
        const stored = await redisClient.zrangebyscore(key, now - windowMs, '+inf')
        timestamps = Array.isArray(stored) ? stored.map(Number) : []
      } catch {
        // On any Redis error, fall back to in-memory for this key
        timestamps = storage.get(key) || []
      }
    } else {
      timestamps = storage.get(key) || []
    }

    // Prune timestamps older than window
    const recent = timestamps.filter((t) => now - t < windowMs)

    if (recent.length >= maxAttempts) {
      const oldest = recent[0]
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
      if (redisClient) {
        try {
          await redisClient.zremrangebyscore(key, '-inf', oldest)
        } catch {}
      } else {
        storage.set(key, recent)
      }
      return { allowed: false, retryAfterSec }
    }

    const newTimestamps = [...recent, now]
    if (redisClient) {
      try {
        const members = newTimestamps.map((t) => [t, t] as [number, number])
        await redisClient.zadd(key, ...members)
        await redisClient.expire(key, Math.ceil(windowMs / 1000))
      } catch {
        storage.set(key, newTimestamps)
      }
    } else {
      storage.set(key, newTimestamps)
    }
    return { allowed: true, retryAfterSec: 0 }
  }

  const reset = async (key: string): Promise<void> => {
    if (redisClient) {
      try {
        await redisClient.del(key)
      } catch {
        storage.delete(key)
      }
    } else {
      storage.delete(key)
    }
  }

  return { check, reset }
}

/**
 * Validates company tier state transitions.
 * Suspended tier is disallowed unless explicitly allowed (super-admin only).
 */
export function validateTierTransition(
  current: string,
  next: string,
  options?: { allowSuspend?: boolean }
): boolean {
  if (typeof current !== 'string' || typeof next !== 'string') return false
  if (current === next) return false
  if (current === 'suspended') return false
  if (!VALID_TIERS.has(current)) return false

  if (next === 'suspended') {
    return Boolean(options?.allowSuspend)
  }

  if (!VALID_TIERS.has(next)) return false

  return true
}

/**
 * Validates bootstrap password complexity:
 * - Minimum 12 characters
 * - At least one uppercase character
 * - At least one lowercase character
 * - At least one digit
 */
export function validateBootstrapPassword(password: string | null | undefined): boolean {
  if (!password || typeof password !== 'string') return false
  if (password.length < 12) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  return true
}
