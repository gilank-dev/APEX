import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { createRateLimiterPersistent, hmacSignature, verifyTimestamp } from '@/lib/security'
import { NextResponse, type NextRequest } from 'next/server'

const webhookRateLimiter = createRateLimiterPersistent({
  maxAttempts: 100,
  windowMs: 60 * 1000,
})

/**
 * WhatsApp Payslip Distribution Webhook
 * 
 * POST /api/webhooks/whatsapp/payslip
 * 
 * Request body:
 * {
 *   company_id: string (UUID)
 *   employee_id: string (UUID)
 *   payslip_month: string (YYYY-MM)
 *   payslip_url: string (signed URL to PDF)
 *   ts: number (unix timestamp, max 5min old)
 * }
 * 
 * Headers:
 *   x-apex-sig: HMAC-SHA256(secret, company_id + employee_id + payslip_month + ts)
 * 
 * Response:
 *   { success: true, message_id: string, whatsapp_status: 'sent' | 'queued' }
 *   or
 *   { error: string }
 */
export async function POST(request: NextRequest) {
  let companyId: string | undefined
  let employeeId: string | undefined
  let payslipMonth: string | undefined
  let ts: number | undefined

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Rate limit webhook invocations per IP
  const { allowed: ipAllowed, retryAfterSec } = await webhookRateLimiter.check(`whatsapp-payslip:${ip}`)
  if (!ipAllowed) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan webhook. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  const logAttempt = (status: 'accepted' | 'rejected', reason?: string, additionalData?: any) => {
    console.log(
      JSON.stringify({
        event: 'whatsapp_payslip_webhook',
        status,
        company_id: companyId || null,
        employee_id: employeeId || null,
        payslip_month: payslipMonth || null,
        ts: ts !== undefined ? ts : null,
        ip,
        ...(reason ? { reason } : {}),
        ...additionalData,
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
    employeeId = body.employee_id
    payslipMonth = body.payslip_month
    ts = body.ts
    const payslipUrl = body.payslip_url

    // Validate required fields
    if (!companyId || !employeeId || !payslipMonth || !payslipUrl) {
      logAttempt('rejected', 'Missing required fields')
      return NextResponse.json(
        { error: 'Parameter company_id, employee_id, payslip_month, dan payslip_url wajib disertakan.' },
        { status: 400 }
      )
    }

    // Validate timestamp (max 5 minutes old)
    if (ts === undefined || ts === null || !verifyTimestamp(ts, 5 * 60)) {
      logAttempt('rejected', 'Timestamp expired or invalid')
      return NextResponse.json(
        { error: 'Timestamp kedaluwarsa atau tidak valid.' },
        { status: 400 }
      )
    }

    // Validate payslip_month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(payslipMonth)) {
      logAttempt('rejected', 'Invalid payslip_month format (must be YYYY-MM)')
      return NextResponse.json(
        { error: 'Format payslip_month harus YYYY-MM.' },
        { status: 400 }
      )
    }

    // HMAC verification: companyId + employeeId + payslipMonth + ts
    const expectedSig = hmacSignature(secret, companyId, employeeId, payslipMonth, ts)
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

    // 1. Fetch employee + company details
    const { data: employee, error: empError } = await adminClient
      .from('employees')
      .select('id, name, whatsapp_number, company_id')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .single()

    if (empError || !employee) {
      logAttempt('rejected', 'Employee not found or not associated with company')
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan atau tidak terkait dengan perusahaan.' },
        { status: 404 }
      )
    }

    // 2. Validate WhatsApp number exists
    if (!employee.whatsapp_number) {
      logAttempt('rejected', 'Employee has no WhatsApp number registered', {
        employee_name: employee.name,
      })
      return NextResponse.json(
        { error: 'Nomor WhatsApp karyawan tidak terdaftar. Minta karyawan untuk update profile.' },
        { status: 400 }
      )
    }

    // 3. Fetch company WhatsApp Business config
    const { data: company, error: compError } = await adminClient
      .from('companies')
      .select('id, whatsapp_business_phone_id, whatsapp_business_token')
      .eq('id', companyId)
      .single()

    if (compError || !company) {
      logAttempt('rejected', 'Company not found')
      return NextResponse.json(
        { error: 'Perusahaan tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 4. Validate company has WhatsApp Business configured
    if (!company.whatsapp_business_phone_id || !company.whatsapp_business_token) {
      logAttempt('rejected', 'Company WhatsApp Business not configured', {
        has_phone_id: !!company.whatsapp_business_phone_id,
        has_token: !!company.whatsapp_business_token,
      })
      return NextResponse.json(
        { error: 'WhatsApp Business belum dikonfigurasi untuk perusahaan. Hubungi admin.' },
        { status: 400 }
      )
    }

    // 5. Send WhatsApp message via Meta Business API
    const waPhoneId = company.whatsapp_business_phone_id
    const waToken = company.whatsapp_business_token
    const recipientPhone = normalizeWhatsAppPhone(employee.whatsapp_number)

    const waMessage = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: 'payslip_distribution',
        language: {
          code: 'id', // Indonesian locale
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: employee.name,
              },
              {
                type: 'text',
                text: payslipMonth,
              },
              {
                type: 'text',
                text: payslipUrl,
              },
            ],
          },
        ],
      },
    }

    const waResponse = await fetch(
      `https://graph.instagram.com/v18.0/${waPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waMessage),
      }
    )

    if (!waResponse.ok) {
      const waError = await waResponse.json()
      logAttempt('rejected', `WhatsApp API error: ${waResponse.status}`, {
        wa_error: waError,
      })
      return NextResponse.json(
        { error: `WhatsApp API gagal: ${waError.error?.message || waResponse.statusText}` },
        { status: waResponse.status }
      )
    }

    const waData = await waResponse.json()
    const messageId = waData.messages?.[0]?.id

    // 6. Log payslip distribution to audit table
    const { error: auditError } = await adminClient.from('payslip_distributions').insert({
      company_id: companyId,
      employee_id: employeeId,
      payslip_month: payslipMonth,
      payslip_url: payslipUrl,
      whatsapp_number: recipientPhone,
      whatsapp_message_id: messageId || null,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    if (auditError) {
      console.warn('Failed to log payslip distribution to audit table:', auditError)
      // Don't fail the request — message was sent
    }

    logAttempt('accepted', undefined, {
      employee_name: employee.name,
      whatsapp_message_id: messageId,
      wa_status: 'sent',
    })

    return NextResponse.json({
      success: true,
      message_id: messageId,
      whatsapp_status: 'sent',
      message: `Payslip untuk ${employee.name} (${payslipMonth}) berhasil dikirim ke WhatsApp.`,
    })
  } catch (err: any) {
    logAttempt('rejected', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Normalize WhatsApp phone number to international format
 * Input: "081234567890" (Indonesian) or "+6281234567890"
 * Output: "6281234567890" (without +)
 */
function normalizeWhatsAppPhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '') // Remove non-digits
  
  // If starts with 0 (Indonesian), replace with 62
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.slice(1)
  }
  
  // If already has country code, keep as-is
  return normalized
}
