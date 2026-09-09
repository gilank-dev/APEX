'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { getCallerProfile, requireManager } from '@/lib/authz'

export interface CreateLeaveRequestInput {
  leave_type: string
  start_date: string
  end_date: string
  reason?: string
}

export interface LeaveRequest {
  id: string
  company_id: string
  user_id: string
  leave_type: 'cuti' | 'izin' | 'sakit'
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  decided_by: string | null
  decided_at: string | null
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

function getTodayDateStr(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function createLeaveRequestAction(
  companyId: string,
  slug: string,
  payload: CreateLeaveRequestInput
) {
  const profile = await getCallerProfile()
  if (!profile || profile.company_id !== companyId) {
    return { error: 'Akses ditolak.' }
  }

  if (!payload || !payload.leave_type || !payload.start_date || !payload.end_date) {
    return { error: 'Tipe cuti, tanggal mulai, dan tanggal selesai wajib diisi.' }
  }

  const validTypes = ['cuti', 'izin', 'sakit']
  if (!validTypes.includes(payload.leave_type)) {
    return { error: 'Tipe cuti tidak valid (pilih cuti, izin, atau sakit).' }
  }

  const today = getTodayDateStr()
  if (payload.start_date < today) {
    return { error: 'Tanggal mulai tidak boleh di masa lalu.' }
  }

  if (payload.end_date < payload.start_date) {
    return { error: 'Tanggal selesai harus sama atau setelah tanggal mulai.' }
  }

  if (payload.reason && payload.reason.length > 500) {
    return { error: 'Alasan maksimal 500 karakter.' }
  }

  const client = await createClient()

  const { data, error } = await client
    .from('leave_requests')
    .insert({
      company_id: companyId,
      user_id: profile.user_id,
      leave_type: payload.leave_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      reason: payload.reason ? payload.reason.trim() : null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: 'Gagal membuat pengajuan cuti: ' + error.message }
  }

  revalidatePath(`/${slug}/leave`)
  return { success: true, leaveRequest: data }
}

export async function decideLeaveRequestAction(
  companyId: string,
  slug: string,
  requestId: string,
  decision: 'approved' | 'rejected'
) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  if (!['approved', 'rejected'].includes(decision)) {
    return { error: 'Keputusan tidak valid.' }
  }

  const client = await createClient()

  // Fetch request via session client (company match + pending check)
  const { data: request, error: fetchError } = await client
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (fetchError || !request) {
    return { error: 'Pengajuan cuti tidak ditemukan.' }
  }

  if (request.status !== 'pending') {
    return { error: 'Pengajuan sudah diputuskan.' }
  }

  const { error: updateError } = await client
    .from('leave_requests')
    .update({
      status: decision,
      decided_by: authz.profile.user_id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('company_id', companyId)

  if (updateError) {
    return { error: 'Gagal memperbarui status pengajuan: ' + updateError.message }
  }

  revalidatePath(`/${slug}/leave`)
  return { success: true }
}

export async function fetchMyLeaveRequestsAction(companyId: string, slug: string) {
  const profile = await getCallerProfile()
  if (!profile || profile.company_id !== companyId) {
    return { error: 'Akses ditolak.' }
  }

  const client = await createClient()
  const { data, error } = await client
    .from('leave_requests')
    .select('*')
    .eq('company_id', companyId)
    .eq('user_id', profile.user_id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'Gagal memuat pengajuan cuti: ' + error.message }
  }

  return { success: true, data: data || [] }
}
