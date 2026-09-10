'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { requireModuleAccess, requireMemberModuleAccess } from '@/lib/authz'

// ---------------------------------------------------------------------------
// Kasbon (Earned Wage Access) — salary advances with installment repayment.
// Tables: kasbon_requests, kasbon_repayments (migration 20260910000009).
// DB enforces: repayments never exceed the approved amount (trigger).
// ---------------------------------------------------------------------------

export interface KasbonRequest {
  id: string
  company_id: string
  user_id: string
  amount: number
  reason: string | null
  installment_count: number
  status: 'pending' | 'approved' | 'rejected' | 'fully_repaid'
  decided_by: string | null
  decided_at: string | null
  created_at: string
  user?: { full_name: string }
  repayments?: KasbonRepayment[]
}

export interface KasbonRepayment {
  id: string
  kasbon_id: string
  company_id: string
  user_id: string
  due_date: string
  amount: number
  paid_at: string | null
  payroll_month: string | null
  created_at: string
}

// Employees self-service kasbon requests; admins/managers may also submit on
// behalf of any member.
export async function createKasbonRequestAction(
  companyId: string,
  slug: string,
  payload: { user_id: string; amount: number; installment_count: number; reason?: string }
) {
  const authz = await requireMemberModuleAccess(companyId, 'kasbon')
  if (!authz.ok) return { error: authz.error }

  const isManager = authz.profile.is_admin || ['Admin', 'Manager'].includes(authz.profile.role_name)
  // Employees may only request for themselves; managers may request for anyone.
  if (!isManager && payload.user_id !== authz.profile.user_id) {
    return { error: 'Akses ditolak.' }
  }

  const amount = Math.round(Number(payload.amount))
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return { error: 'Jumlah kasbon harus berupa angka antara Rp 1 dan Rp 1.000.000.000.' }
  }

  const installments = Math.round(Number(payload.installment_count))
  if (!Number.isInteger(installments) || installments < 1 || installments > 12) {
    return { error: 'Jumlah cicilan harus antara 1 sampai 12 kali.' }
  }

  if (payload.reason && payload.reason.length > 500) {
    return { error: 'Alasan maksimal 500 karakter.' }
  }

  // Validate the target user belongs to this company
  const adminCheck = authz
  const client = await createClient()
  const { data: targetUser } = await client
    .from('users')
    .select('id, company_id')
    .eq('id', payload.user_id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!targetUser) {
    return { error: 'Karyawan tidak ditemukan di perusahaan ini.' }
  }

  // Employees may only have ONE active kasbon at a time
  const { data: existing } = await client
    .from('kasbon_requests')
    .select('id, status')
    .eq('company_id', companyId)
    .eq('user_id', payload.user_id)
    .in('status', ['pending', 'approved'])
    .limit(1)

  if (existing && existing.length > 0) {
    return {
      error:
        existing[0].status === 'pending'
          ? 'Masih ada pengajuan kasbon yang menunggu keputusan.'
          : 'Karyawan ini masih memiliki kasbon aktif yang belum lunas.',
    }
  }

  const { data, error } = await client
    .from('kasbon_requests')
    .insert({
      company_id: companyId,
      user_id: payload.user_id,
      amount,
      installment_count: installments,
      reason: payload.reason ? payload.reason.trim() : null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: 'Gagal membuat pengajuan kasbon: ' + error.message }
  }

  revalidatePath(`/${slug}/kasbon`)
  return { success: true, kasbon: data }
}

export async function decideKasbonRequestAction(
  companyId: string,
  slug: string,
  kasbonId: string,
  decision: 'approved' | 'rejected'
) {
  const authz = await requireModuleAccess(companyId, 'kasbon')
  if (!authz.ok) return { error: authz.error }

  const isManager = authz.profile.is_admin || ['Admin', 'Manager'].includes(authz.profile.role_name)
  if (!isManager) {
    return { error: 'Hanya Admin atau Manager yang dapat memutuskan pengajuan kasbon.' }
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return { error: 'Keputusan tidak valid.' }
  }

  const client = await createClient()

  // Fetch the request with a pending guard (race-safe: the WHERE includes status)
  const { data: kasbon, error: fetchErr } = await client
    .from('kasbon_requests')
    .select('*')
    .eq('id', kasbonId)
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .maybeSingle()

  if (fetchErr || !kasbon) {
    return { error: 'Pengajuan tidak ditemukan atau sudah diputuskan.' }
  }

  const { data: updated, error: updateErr } = await client
    .from('kasbon_requests')
    .update({
      status: decision,
      decided_by: authz.profile.user_id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', kasbonId)
    .eq('status', 'pending')
    .select()
    .single()

  if (updateErr || !updated) {
    return { error: 'Pengajuan sudah diputuskan oleh orang lain.' }
  }

  // On approval, generate the installment schedule (due on the 28th of each
  // upcoming month — payday convention; last installment absorbs rounding).
  if (decision === 'approved') {
    const total = Number(kasbon.amount)
    const n = Number(kasbon.installment_count)
    const base = Math.floor(total / n)
    const schedule: Array<{
      kasbon_id: string
      company_id: string
      user_id: string
      due_date: string
      amount: number
    }> = []

    const now = new Date()
    for (let i = 1; i <= n; i++) {
      const due = new Date(now.getFullYear(), now.getMonth() + i, 28)
      const amount = i === n ? total - base * (n - 1) : base
      schedule.push({
        kasbon_id: kasbonId,
        company_id: companyId,
        user_id: kasbon.user_id,
        due_date: due.toISOString().split('T')[0],
        amount,
      })
    }

    const { error: schedErr } = await client.from('kasbon_repayments').insert(schedule)
    if (schedErr) {
      // Roll the decision back — do not leave an approved kasbon without schedule
      await client
        .from('kasbon_requests')
        .update({ status: 'pending', decided_by: null, decided_at: null })
        .eq('id', kasbonId)
      return { error: 'Gagal membuat jadwal cicilan: ' + schedErr.message }
    }
  }

  revalidatePath(`/${slug}/kasbon`)
  return { success: true, kasbon: updated }
}

// Record a repayment as paid (managers only). Marks the parent fully_repaid
// when the last installment settles.
export async function markKasbonRepaymentPaidAction(
  companyId: string,
  slug: string,
  repaymentId: string,
  paid: boolean
) {
  const authz = await requireModuleAccess(companyId, 'kasbon')
  if (!authz.ok) return { error: authz.error }

  const isManager = authz.profile.is_admin || ['Admin', 'Manager'].includes(authz.profile.role_name)
  if (!isManager) {
    return { error: 'Hanya Admin atau Manager yang dapat mencatat pembayaran.' }
  }

  const client = await createClient()

  const { data: repayment } = await client
    .from('kasbon_repayments')
    .select('*')
    .eq('id', repaymentId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!repayment) {
    return { error: 'Cicilan tidak ditemukan.' }
  }

  // Race guard via the WHERE shape: marking requires an unpaid row,
  // un-marking requires a paid row with the exact known paid_at value.
  let updateQuery = client
    .from('kasbon_repayments')
    .update({ paid_at: paid ? new Date().toISOString() : null })
    .eq('id', repaymentId)
    .eq('kasbon_id', repayment.kasbon_id)
    .eq('company_id', companyId)

  if (paid) {
    updateQuery = updateQuery.is('paid_at', null)
  } else {
    updateQuery = updateQuery.eq('paid_at', repayment.paid_at)
  }

  const { error: updateErr } = await updateQuery

  if (updateErr) {
    return { error: 'Gagal memperbarui cicilan: ' + updateErr.message }
  }

  // Recompute parent status: fully_repaid when every installment is settled
  const { data: all } = await client
    .from('kasbon_repayments')
    .select('id, paid_at, amount')
    .eq('kasbon_id', repayment.kasbon_id)

  if (all && all.length > 0 && all.every((r: any) => r.paid_at)) {
    await client
      .from('kasbon_requests')
      .update({ status: 'fully_repaid' })
      .eq('id', repayment.kasbon_id)
      .eq('status', 'approved')
  }

  revalidatePath(`/${slug}/kasbon`)
  return { success: true }
}
