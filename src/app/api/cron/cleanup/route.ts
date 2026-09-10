import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'node:crypto'

export async function GET(request: NextRequest) {
  // Authorization check for Vercel Cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Timing-safe comparison: a plain === leaks secret length/content timing
  // and is vulnerable to early-exit timing analysis.
  const expected = `Bearer ${cronSecret}`
  const a = Buffer.from(authHeader || '', 'utf8')
  const b = Buffer.from(expected, 'utf8')
  const authorized = a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!authorized) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const adminClient = createAdminClient()

    // Calculate cutoff date (60 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    const cutoffIso = cutoffDate.toISOString()

    // Delete suspended companies (cascade will delete rows in other tables)
    const { data, error } = await adminClient
      .from('companies')
      .delete()
      .eq('tier', 'suspended')
      .lt('updated_at', cutoffIso)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Expire trials: when trial_ends_at < now() and tier still 'free', clear trial_ends_at (reverts to free features)
    const nowIso = new Date().toISOString()
    const { data: expiredTrials, error: trialError } = await adminClient
      .from('companies')
      .update({ trial_ends_at: null, updated_at: nowIso })
      .eq('tier', 'free')
      .lt('trial_ends_at', nowIso)
      .select('id, slug, name')

    if (trialError) {
      return NextResponse.json({ error: trialError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup and trial expiration run successfully.',
      purged_companies: data,
      expired_trials: expiredTrials,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
