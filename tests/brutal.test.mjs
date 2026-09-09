import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  generateRequestCode,
  hmacSignature,
  verifyHmacSignature,
  verifyTimestamp,
  createRateLimiter,
  validateTierTransition,
  validateBootstrapPassword,
} from '../src/lib/security.ts'

describe('APEX Brutal Security Test Suite', () => {
  describe('1. Request Code Generation', () => {
    it('matches exact format regex APX-XXXX-YYYYYY', () => {
      const code = generateRequestCode('acme')
      assert.match(code, /^APX-[A-Z0-9]{4}-[A-Z0-9]{6}$/)
    })

    it('guarantees uniqueness over 10,000 iterations', () => {
      const iterations = 10000
      const seen = new Set()
      for (let i = 0; i < iterations; i++) {
        const code = generateRequestCode('tenant-corp')
        assert.match(code, /^APX-[A-Z0-9]{4}-[A-Z0-9]{6}$/)
        seen.add(code)
      }
      assert.strictEqual(seen.size, iterations, 'All 10,000 request codes must be unique')
    })

    it('properly sanitizes accents, unicode, symbols, and spaces', () => {
      const code = generateRequestCode(' café-Şöld!!')
      // café -> CAFE (accent stripped), Şöld -> SOLD
      assert.match(code, /^APX-CAFE-[A-Z0-9]{6}$/)
    })

    it('falls back to APX-XXXX- on empty, null, or symbol-only slugs', () => {
      const codeEmpty = generateRequestCode('')
      assert.match(codeEmpty, /^APX-XXXX-[A-Z0-9]{6}$/)

      const codeNull = generateRequestCode(null)
      assert.match(codeNull, /^APX-XXXX-[A-Z0-9]{6}$/)

      const codeSymbols = generateRequestCode('!@#$%^&*()')
      assert.match(codeSymbols, /^APX-XXXX-[A-Z0-9]{6}$/)

      const codeShort = generateRequestCode('ab')
      assert.match(codeShort, /^APX-ABXX-[A-Z0-9]{6}$/)
    })
  })

  describe('2. Webhook HMAC-SHA256 Authentication', () => {
    const secret = 'webhook-secret-production-token-99'
    const companyId = '550e8400-e29b-41d4-a716-446655440000'
    const tier = 'pro'
    const ts = 1717000000

    it('computes known-vector HMAC and verifies against manually computed crypto digest', () => {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${companyId}:${tier}:${ts}`)
        .digest('hex')

      const signature = hmacSignature(secret, companyId, tier, ts)
      assert.strictEqual(signature, expected)
      assert.strictEqual(verifyHmacSignature(signature, secret, companyId, tier, ts), true)
    })

    it('rejects tampered payloads and wrong secrets', () => {
      const validSig = hmacSignature(secret, companyId, tier, ts)

      // Tampered secret
      assert.strictEqual(
        verifyHmacSignature(validSig, 'wrong-secret', companyId, tier, ts),
        false
      )

      // Tampered company ID
      assert.strictEqual(
        verifyHmacSignature(validSig, secret, '550e8400-e29b-41d4-a716-446655440001', tier, ts),
        false
      )

      // Tampered tier
      assert.strictEqual(
        verifyHmacSignature(validSig, secret, companyId, 'enterprise', ts),
        false
      )

      // Tampered timestamp
      assert.strictEqual(
        verifyHmacSignature(validSig, secret, companyId, tier, ts + 1),
        false
      )

      // Tampered signature string
      const tamperedSig = validSig.slice(0, -1) + (validSig.endsWith('0') ? '1' : '0')
      assert.strictEqual(
        verifyHmacSignature(tamperedSig, secret, companyId, tier, ts),
        false
      )

      // Invalid length signature (timing-safe check length guard)
      assert.strictEqual(
        verifyHmacSignature('short-sig', secret, companyId, tier, ts),
        false
      )

      // Empty / null inputs
      assert.strictEqual(verifyHmacSignature('', secret, companyId, tier, ts), false)
      assert.strictEqual(verifyHmacSignature(validSig, '', companyId, tier, ts), false)
    })
  })

  describe('3. Timestamp Window Verification', () => {
    const baseNow = 1700000000
    const windowSec = 300

    it('accepts timestamps within +/- 300s window', () => {
      // Exactly current
      assert.strictEqual(verifyTimestamp(baseNow, baseNow, windowSec), true)
      // Exactly +299s
      assert.strictEqual(verifyTimestamp(baseNow + 299, baseNow, windowSec), true)
      // Exactly +300s
      assert.strictEqual(verifyTimestamp(baseNow + 300, baseNow, windowSec), true)
      // Exactly -299s
      assert.strictEqual(verifyTimestamp(baseNow - 299, baseNow, windowSec), true)
      // Exactly -300s
      assert.strictEqual(verifyTimestamp(baseNow - 300, baseNow, windowSec), true)
      // Supports window passed as milliseconds (300,000 ms)
      assert.strictEqual(verifyTimestamp(baseNow + 299, baseNow, 300000), true)
    })

    it('rejects timestamps outside +/- 300s window', () => {
      // +301s rejected
      assert.strictEqual(verifyTimestamp(baseNow + 301, baseNow, windowSec), false)
      // -301s rejected
      assert.strictEqual(verifyTimestamp(baseNow - 301, baseNow, windowSec), false)
    })

    it('rejects garbage, non-numeric, or infinite timestamps', () => {
      assert.strictEqual(verifyTimestamp('not-a-number', baseNow, windowSec), false)
      assert.strictEqual(verifyTimestamp(NaN, baseNow, windowSec), false)
      assert.strictEqual(verifyTimestamp(Infinity, baseNow, windowSec), false)
      assert.strictEqual(verifyTimestamp(-Infinity, baseNow, windowSec), false)
      assert.strictEqual(verifyTimestamp(null, baseNow, windowSec), false)
      assert.strictEqual(verifyTimestamp(undefined, baseNow, windowSec), false)
    })
  })

  describe('4. In-Memory Rate Limiter', () => {
    it('allows 10 attempts, then blocks with retryAfterSec > 0', () => {
      const limiter = createRateLimiter({ maxAttempts: 10, windowMs: 600000 })
      const key = 'test-ip-1'
      const now = 100000

      // Attempts 1 to 10 must succeed
      for (let i = 1; i <= 10; i++) {
        const res = limiter.check(key, now)
        assert.strictEqual(res.allowed, true, `Attempt ${i} should be allowed`)
        assert.strictEqual(res.retryAfterSec, 0)
      }

      // 11th attempt must be blocked
      const blocked = limiter.check(key, now)
      assert.strictEqual(blocked.allowed, false)
      assert.ok(blocked.retryAfterSec > 0, 'retryAfterSec must be greater than 0')
    })

    it('maintains independent rate-limit buckets per key', () => {
      const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60000 })
      limiter.check('user-A', 1000)
      limiter.check('user-A', 1000)
      assert.strictEqual(limiter.check('user-A', 1000).allowed, false)

      // Different key should still be allowed
      assert.strictEqual(limiter.check('user-B', 1000).allowed, true)
    })

    it('resets counters when reset(key) is invoked', () => {
      const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60000 })
      limiter.check('user-C', 1000)
      limiter.check('user-C', 1000)
      assert.strictEqual(limiter.check('user-C', 1000).allowed, false)

      limiter.reset('user-C')
      assert.strictEqual(limiter.check('user-C', 1000).allowed, true)
    })

    it('handles clock-math boundary and window rollover correctly', () => {
      const windowMs = 60000 // 1 minute
      const limiter = createRateLimiter({ maxAttempts: 2, windowMs })
      const startTime = 1000

      limiter.check('key-rollover', startTime)
      limiter.check('key-rollover', startTime)
      assert.strictEqual(limiter.check('key-rollover', startTime).allowed, false)

      // Past window boundary: all previous attempts expired
      const afterWindow = startTime + windowMs + 10
      const rolloverRes = limiter.check('key-rollover', afterWindow)
      assert.strictEqual(rolloverRes.allowed, true)
    })
  })

  describe('5. Tier Transition Matrix', () => {
    it('allows valid upgrades and downgrades between active tiers', () => {
      // Upgrades
      assert.strictEqual(validateTierTransition('free', 'pro'), true)
      assert.strictEqual(validateTierTransition('free', 'enterprise'), true)
      assert.strictEqual(validateTierTransition('pro', 'enterprise'), true)

      // Downgrades
      assert.strictEqual(validateTierTransition('enterprise', 'pro'), true)
      assert.strictEqual(validateTierTransition('pro', 'free'), true)
      assert.strictEqual(validateTierTransition('enterprise', 'free'), true)
    })

    it('disallows transitions to suspended by default (requires super-admin allowSuspend)', () => {
      assert.strictEqual(validateTierTransition('free', 'suspended'), false)
      assert.strictEqual(validateTierTransition('pro', 'suspended'), false)
      assert.strictEqual(validateTierTransition('enterprise', 'suspended'), false)

      // Allowed when opts.allowSuspend is true
      assert.strictEqual(
        validateTierTransition('pro', 'suspended', { allowSuspend: true }),
        true
      )
    })

    it('disallows transitions from suspended to anything', () => {
      assert.strictEqual(validateTierTransition('suspended', 'free'), false)
      assert.strictEqual(validateTierTransition('suspended', 'pro'), false)
      assert.strictEqual(validateTierTransition('suspended', 'enterprise'), false)
      assert.strictEqual(
        validateTierTransition('suspended', 'pro', { allowSuspend: true }),
        false
      )
    })

    it('disallows same-tier transitions (no-op)', () => {
      assert.strictEqual(validateTierTransition('free', 'free'), false)
      assert.strictEqual(validateTierTransition('pro', 'pro'), false)
      assert.strictEqual(validateTierTransition('enterprise', 'enterprise'), false)
    })

    it('disallows invalid or case-mismatched strings', () => {
      assert.strictEqual(validateTierTransition('PRO', 'enterprise'), false)
      assert.strictEqual(validateTierTransition('free', 'PRO'), false)
      assert.strictEqual(validateTierTransition('free', 'gold'), false)
      assert.strictEqual(validateTierTransition('unknown', 'pro'), false)
      assert.strictEqual(validateTierTransition('', 'pro'), false)
    })
  })

  describe('6. Source-Scan Invariants', () => {
    const rootDir = path.resolve(import.meta.dirname, '..')

    it('ensures src/lib/actions.ts does NOT contain createUser inside loginAdminAction', () => {
      const actionsFile = fs.readFileSync(path.join(rootDir, 'src/lib/actions.ts'), 'utf8')

      // Extract loginAdminAction function block
      const loginActionMatch = actionsFile.match(
        /export async function loginAdminAction[\s\S]*?^export async function /m
      )
      assert.ok(loginActionMatch, 'loginAdminAction must exist in src/lib/actions.ts')
      const loginActionContent = loginActionMatch[0]

      assert.strictEqual(
        loginActionContent.includes('createUser'),
        false,
        'loginAdminAction must NOT call createUser'
      )
    })

    it('ensures src/app/super-admin/page.tsx uses && for the two super-admin authorization conditions', () => {
      const pageFile = fs.readFileSync(path.join(rootDir, 'src/app/super-admin/page.tsx'), 'utf8')

      // Assert the hardened line requiring BOTH email and role exists
      assert.ok(
        pageFile.includes("user.email === superAdminEmail && user.user_metadata?.role === 'super-admin'"),
        'Super admin page must use && to require BOTH email and role'
      )

      // Ensure the old insecure bypass does not exist
      assert.strictEqual(
        pageFile.includes("user.email !== superAdminEmail && user.user_metadata?.role !== 'super-admin'"),
        false,
        'Old vulnerable condition must be removed'
      )
    })

    it('ensures src/app/api/webhooks/whatsapp/route.ts uses timingSafeEqual and rejects suspended', () => {
      const routeFile = fs.readFileSync(
        path.join(rootDir, 'src/app/api/webhooks/whatsapp/route.ts'),
        'utf8'
      )

      assert.ok(routeFile.includes('timingSafeEqual'), 'Route must use timingSafeEqual')
      assert.ok(routeFile.includes("'suspended'"), "Route must handle 'suspended'")
      assert.ok(
        routeFile.includes('x-apex-sig'),
        'Route must use x-apex-sig signature header'
      )
    })

    it('ensures newest supabase migration contains WITH CHECK for modify_own_user and tier lock', () => {
      const migrationsDir = path.join(rootDir, 'supabase/migrations')
      const files = fs.readdirSync(migrationsDir).sort()
      const newestMigration = files.find((f) => f === '20260708000001_rls_hardening.sql') || files[files.length - 1]

      assert.strictEqual(newestMigration, '20260708000001_rls_hardening.sql')
      const migrationContent = fs.readFileSync(
        path.join(migrationsDir, newestMigration),
        'utf8'
      )

      assert.ok(
        migrationContent.includes('modify_own_user'),
        'Migration must harden modify_own_user'
      )
      assert.ok(
        migrationContent.includes('WITH CHECK'),
        'Migration must contain WITH CHECK clause'
      )
      assert.ok(
        migrationContent.includes('update_company') && migrationContent.includes('tier'),
        'Migration must contain tier lock on update_company'
      )
    })

    it('ensures README.md does not leak default super-admin password and references bootstrap route', () => {
      const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8')

      // Must not have the default password literal
      assert.strictEqual(
        readme.includes('password: `super-lankdev`') || readme.includes('password: super-lankdev'),
        false,
        'README must not contain literal default super admin password'
      )

      assert.ok(
        readme.includes('/api/bootstrap/super-admin'),
        'README must document /api/bootstrap/super-admin route'
      )
    })

    it('ensures security.ts uses node:crypto', () => {
      const securityFile = fs.readFileSync(path.join(rootDir, 'src/lib/security.ts'), 'utf8')
      assert.ok(
        securityFile.includes("'node:crypto'") || securityFile.includes('"node:crypto"'),
        'security.ts must import from node:crypto'
      )
    })
  })

  describe('7. Super-Admin Bootstrap Password Complexity', () => {
    it('validates password complexity according to policy (min 12 chars, upper, lower, digit)', () => {
      // Too short
      assert.strictEqual(validateBootstrapPassword('short'), false)
      assert.strictEqual(validateBootstrapPassword('Pass1'), false)

      // Valid: 12 chars with upper, lower, digit
      assert.strictEqual(validateBootstrapPassword('Abcdef123456'), true)
      assert.strictEqual(validateBootstrapPassword('SuperSecret12!'), true)

      // Missing digits
      assert.strictEqual(validateBootstrapPassword('abcdefghijkl'), false)
      assert.strictEqual(validateBootstrapPassword('Abcdefghijkl'), false)

      // Missing lowercase
      assert.strictEqual(validateBootstrapPassword('ABCDEF123456'), false)

      // Missing uppercase
      assert.strictEqual(validateBootstrapPassword('abcdef123456'), false)

      // Null, undefined, empty
      assert.strictEqual(validateBootstrapPassword(null), false)
      assert.strictEqual(validateBootstrapPassword(undefined), false)
      assert.strictEqual(validateBootstrapPassword(''), false)
    })
  })
})
