import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { createRateLimiterPersistent, hmacSignature, verifyTimestamp } from '@/lib/security'
import { NextResponse, type NextRequest } from 'next/server'

const webhookRateLimiter = createRateLimiterPersistent({
  maxAttempts: 30,
  windowMs: 60 * 1000,
})

export async function POST(request: NextRequest) {
  let companyId: string | undefined
  let newTier: string | undefined
  let ts: number | undefined

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Rate limit webhook invocations per IP (sensitive endpoint: tier changes)
  const { allowed: ipAllowed, retryAfterSec } = await webhookRateLimiter.check(`whatsapp:${ip}`)
  if (!ipAllowed) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan webhook. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  const logAttempt = (status: 'accepted' | 'rejected', reason?: string) => {
    console.log(
      JSON.stringify({
        event: 'whatsapp_webhook',
        status,
        company_id: companyId || null,
        tier: newTier || null,
        ts: ts !== undefined ? ts : null,
        ip,
        ...(reason ? { reason } : {}),
      })
    )
  }

  try {
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET
    if (!secret) {
      logAttempt('rejected', 'WHATSAPP_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret is not configured.' },
        { status: 401 }
      )
    }

    const signature = request.headers.get('x-apex-sig')
    if (!signature) {
      logAttempt('rejected', 'Missing x-apex-sig header')
      return NextResponse.json(
        { error: 'Missing webhook signature header.' },
        { status: 401 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      logAttempt('rejected', 'Invalid JSON payload')
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    companyId = body.company_id
    newTier = body.new_tier
    ts = body.ts

    if (!companyId || !newTier) {
      logAttempt('rejected', 'Missing company_id or new_tier')
      return NextResponse.json(
        { error: 'Parameter company_id dan new_tier wajib disertakan.' },
        { status: 400 }
      )
    }

    // Explicitly reject suspended tier via webhook
    if (newTier === 'suspended') {
      logAttempt('rejected', 'Suspension is not allowed via webhook')
      return NextResponse.json(
        { error: 'Perubahan tier ke suspended hanya dapat dilakukan manual oleh super-admin.' },
        { status: 400 }
      )
    }

    if (!['free', 'pro', 'enterprise'].includes(newTier)) {
      logAttempt('rejected', 'Invalid tier specified')
      return NextResponse.json({ error: 'Tier tidak valid.' }, { status: 400 })
    }

    if (ts === undefined || ts === null || !verifyTimestamp(ts)) {
      logAttempt('rejected', 'Timestamp expired or invalid')
      return NextResponse.json(
        { error: 'Timestamp kedaluwarsa atau tidak valid.' },
        { status: 400 }
      )
    }

    const expectedSig = hmacSignature(secret, companyId, newTier, ts)
    const sigBuf = Buffer.from(signature, 'utf8')
    const expBuf = Buffer.from(expectedSig, 'utf8')

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logAttempt('rejected', 'HMAC signature mismatch')
      return NextResponse.json(
        { error: 'Autentikasi webhook gagal. Tanda tangan tidak valid.' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Update company tier bypassing RLS
    const { error } = await adminClient
      .from('companies')
      .update({ tier: newTier, updated_at: new Date().toISOString() })
      .eq('id', companyId)

    if (error) {
      logAttempt('rejected', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAttempt('accepted')
    return NextResponse.json({
      success: true,
      message: `Tier perusahaan berhasil diperbarui ke ${newTier}.`,
    })
  } catch (err: any) {
    logAttempt('rejected', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
