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
  reset(key: string): void
}

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

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
 * Payload format: `${companyId}:${tier}:${ts}`
 */
export function hmacSignature(
  secret: string,
  companyId: string,
  tier: string,
  ts: number | string
): string {
  const payload = `${companyId}:${tier}:${ts}`
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
        return { allowed: false, retryAfterSec }
      }

      timestamps.push(now)
      storage.set(key, timestamps)
      return { allowed: true, retryAfterSec: 0 }
    },

    reset(key: string): void {
      storage.delete(key)
    },
  }
}

const VALID_TIERS = new Set(['free', 'pro', 'enterprise'])

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
