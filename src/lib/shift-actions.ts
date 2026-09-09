'use server'

import { createAdminClient, createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { getCallerProfile, requireManager } from '@/lib/authz'

export interface ShiftTemplateInput {
  name: string
  start_time: string
  end_time: string
}

export interface ShiftAssignmentInput {
  user_id: string
  assignment_date: string
  shift_template_id: string | null
}

// Check if a time span crosses midnight (e.g. 23:00 to 07:00)
function isOvernightShift(startTime: string, endTime: string): boolean {
  return endTime < startTime
}

// Seed default shift templates: Pagi 07:00-15:00, Siang 15:00-23:00, Malam 23:00-07:00
export async function seedDefaultShiftTemplatesAction(companyId: string, slug: string) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  const adminClient = createAdminClient()

  // Check if templates already exist
  const { data: existing, error: checkError } = await adminClient
    .from('shift_templates')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)

  if (checkError) {
    return { error: 'Gagal memeriksa template shift.' }
  }

  if (existing && existing.length > 0) {
    return { success: true, message: 'Template shift sudah ada.' }
  }

  const defaults = [
    {
      company_id: companyId,
      name: 'Pagi',
      start_time: '07:00',
      end_time: '15:00',
      overnight: false,
    },
    {
      company_id: companyId,
      name: 'Siang',
      start_time: '15:00',
      end_time: '23:00',
      overnight: false,
    },
    {
      company_id: companyId,
      name: 'Malam',
      start_time: '23:00',
      end_time: '07:00',
      overnight: true,
    },
  ]

  const { error: insertError } = await adminClient
    .from('shift_templates')
    .insert(defaults)

  if (insertError) {
    return { error: 'Gagal membuat template shift bawaan: ' + insertError.message }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true }
}

export async function createShiftTemplateAction(
  companyId: string,
  slug: string,
  data: ShiftTemplateInput
) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  if (!data.name || !data.start_time || !data.end_time) {
    return { error: 'Nama, jam mulai, dan jam selesai wajib diisi.' }
  }

  const overnight = isOvernightShift(data.start_time, data.end_time)
  const adminClient = createAdminClient()

  const { data: template, error } = await adminClient
    .from('shift_templates')
    .insert({
      company_id: companyId,
      name: data.name.trim(),
      start_time: data.start_time,
      end_time: data.end_time,
      overnight,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Gagal menambahkan template shift: ' + error.message }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true, template }
}

export async function updateShiftTemplateAction(
  templateId: string,
  companyId: string,
  slug: string,
  data: ShiftTemplateInput
) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  if (!data.name || !data.start_time || !data.end_time) {
    return { error: 'Nama, jam mulai, dan jam selesai wajib diisi.' }
  }

  const overnight = isOvernightShift(data.start_time, data.end_time)
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('shift_templates')
    .update({
      name: data.name.trim(),
      start_time: data.start_time,
      end_time: data.end_time,
      overnight,
    })
    .eq('id', templateId)
    .eq('company_id', companyId)

  if (error) {
    return { error: 'Gagal memperbarui template shift: ' + error.message }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true }
}

export async function deleteShiftTemplateAction(
  templateId: string,
  companyId: string,
  slug: string
) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('shift_templates')
    .delete()
    .eq('id', templateId)
    .eq('company_id', companyId)

  if (error) {
    return { error: 'Gagal menghapus template shift: ' + error.message }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true }
}

// Bulk upsert weekly roster assignments
export async function saveWeeklyRosterAction(
  companyId: string,
  slug: string,
  assignments: ShiftAssignmentInput[]
) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  if (!assignments || assignments.length === 0) {
    return { success: true }
  }

  const adminClient = createAdminClient()

  // Fetch valid members of the company
  const { data: members, error: memberError } = await adminClient
    .from('users')
    .select('id')
    .eq('company_id', companyId)

  if (memberError || !members) {
    return { error: 'Gagal memvalidasi anggota tim.' }
  }

  const validMemberIds = new Set(members.map((m) => m.id))
  const filteredAssignments = assignments.filter((a) => validMemberIds.has(a.user_id))

  if (filteredAssignments.length === 0) {
    return { success: true }
  }

  // Split into deletes (OFF) and upserts
  const toDelete = filteredAssignments.filter((a) => !a.shift_template_id)
  const toUpsert = filteredAssignments.filter((a) => !!a.shift_template_id)

  // Handle removals
  for (const del of toDelete) {
    await adminClient
      .from('shift_assignments')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', del.user_id)
      .eq('assignment_date', del.assignment_date)
  }

  // Handle upserts
  if (toUpsert.length > 0) {
    const upsertPayload = toUpsert.map((item) => ({
      company_id: companyId,
      user_id: item.user_id,
      shift_template_id: item.shift_template_id!,
      assignment_date: item.assignment_date,
    }))

    const { error: upsertError } = await adminClient
      .from('shift_assignments')
      .upsert(upsertPayload, { onConflict: 'user_id,assignment_date' })

    if (upsertError) {
      return { error: 'Gagal menyimpan jadwal roster: ' + upsertError.message }
    }
  }

  revalidatePath(`/${slug}/shifts`)
  revalidatePath(`/${slug}/attendance`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// SHIFT SWAP ACTIONS
// ---------------------------------------------------------------------------

export async function createSwapRequestAction(
  companyId: string,
  slug: string,
  targetUserId: string,
  requesterAssignmentId: string,
  targetAssignmentId: string
) {
  const profile = await getCallerProfile()
  if (!profile || profile.company_id !== companyId) {
    return { error: 'Akses ditolak.' }
  }

  if (targetUserId === profile.user_id) {
    return { error: 'Tidak dapat menukar shift dengan diri sendiri.' }
  }

  const client = await createClient()

  // Fetch both assignments and verify company ownership
  const { data: reqAssign, error: reqErr } = await client
    .from('shift_assignments')
    .select('*')
    .eq('id', requesterAssignmentId)
    .eq('company_id', companyId)
    .maybeSingle()

  const { data: targetAssign, error: tgtErr } = await client
    .from('shift_assignments')
    .select('*')
    .eq('id', targetAssignmentId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (reqErr || tgtErr || !reqAssign || !targetAssign) {
    return { error: 'Data jadwal shift tidak ditemukan.' }
  }

  // Requester assignment must be caller's own
  if (reqAssign.user_id !== profile.user_id) {
    return { error: 'Akses ditolak. Anda hanya dapat menukar shift milik Anda.' }
  }

  // Target assignment must belong to targetUserId
  if (targetAssign.user_id !== targetUserId) {
    return { error: 'Target shift tidak cocok dengan pengguna target.' }
  }

  // Dates must differ
  if (reqAssign.assignment_date === targetAssign.assignment_date) {
    return { error: 'Tanggal shift harus berbeda untuk pertukaran shift.' }
  }

  const { error: insertError } = await client
    .from('shift_swap_requests')
    .insert({
      company_id: companyId,
      requester_id: profile.user_id,
      target_id: targetUserId,
      requester_assignment_id: requesterAssignmentId,
      target_assignment_id: targetAssignmentId,
      status: 'pending',
    })

  if (insertError) {
    return { error: 'Gagal membuat pengajuan tukar shift: ' + insertError.message }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true }
}

export async function decideSwapRequestAction(
  companyId: string,
  slug: string,
  swapId: string,
  decision: 'approved' | 'rejected'
) {
  const profile = await getCallerProfile()
  if (!profile || profile.company_id !== companyId) {
    return { error: 'Akses ditolak.' }
  }

  const isManager = profile.is_admin || ['Admin', 'Manager'].includes(profile.role_name)

  if (!['approved', 'rejected'].includes(decision)) {
    return { error: 'Keputusan tidak valid.' }
  }

  const client = await createClient()

  const { data: swap, error: swapError } = await client
    .from('shift_swap_requests')
    .select('*')
    .eq('id', swapId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (swapError || !swap) {
    return { error: 'Pengajuan tukar shift tidak ditemukan.' }
  }

  if (swap.status !== 'pending') {
    return { error: 'Pengajuan sudah diputuskan.' }
  }

  // Consent: only target employee or Admin/Manager can decide
  if (!isManager && swap.target_id !== profile.user_id) {
    return { error: 'Akses ditolak. Hanya target atau Manager yang dapat memutuskan.' }
  }

  if (decision === 'rejected') {
    const { data: rejectedRows, error: rejectError } = await client
      .from('shift_swap_requests')
      .update({
        status: 'rejected',
        decided_by: profile.user_id,
        decided_at: new Date().toISOString(),
      })
      .eq('id', swapId)
      .eq('company_id', companyId)
      // Race guard: only transition a still-pending request
      .eq('status', 'pending')
      .select('id')

    if (rejectError) {
      return { error: 'Gagal menolak pertukaran: ' + rejectError.message }
    }
    if (!rejectedRows || rejectedRows.length === 0) {
      return { error: 'Pengajuan sudah diputuskan.' }
    }

    revalidatePath(`/${slug}/shifts`)
    return { success: true }
  }

  // Transaction-style double-update of both assignment rows via adminClient
  // AFTER re-verifying company ownership of both assignment ids (defense in depth)
  const adminClient = createAdminClient()

  const { data: reqAssign } = await adminClient
    .from('shift_assignments')
    .select('*')
    .eq('id', swap.requester_assignment_id)
    .eq('company_id', companyId)
    .maybeSingle()

  const { data: targetAssign } = await adminClient
    .from('shift_assignments')
    .select('*')
    .eq('id', swap.target_assignment_id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!reqAssign || !targetAssign) {
    return { error: 'Jadwal shift yang akan ditukar tidak ditemukan.' }
  }

  // Verify ownership hasn't changed
  if (reqAssign.user_id !== swap.requester_id || targetAssign.user_id !== swap.target_id) {
    return { error: 'Kepemilikan shift telah berubah sebelum pertukaran disetujui.' }
  }

  // Swap user_id values
  const { error: err1 } = await adminClient
    .from('shift_assignments')
    .update({ user_id: swap.target_id })
    .eq('id', reqAssign.id)
    .eq('company_id', companyId)

  if (err1) {
    return { error: 'Gagal menukar shift pemohon: ' + err1.message }
  }

  const { error: err2 } = await adminClient
    .from('shift_assignments')
    .update({ user_id: swap.requester_id })
    .eq('id', targetAssign.id)
    .eq('company_id', companyId)

  if (err2) {
    // Rollback first update
    await adminClient
      .from('shift_assignments')
      .update({ user_id: swap.requester_id })
      .eq('id', reqAssign.id)
      .eq('company_id', companyId)
    return { error: 'Gagal menukar shift target: ' + err2.message }
  }

  const { error: swapUpdateErr } = await adminClient
    .from('shift_swap_requests')
    .update({
      status: 'approved',
      decided_by: profile.user_id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', swap.id)
    .eq('company_id', companyId)

  if (swapUpdateErr) {
    return { error: 'Gagal memperbarui status pengajuan: ' + swapUpdateErr.message }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true }
}

export async function cancelSwapRequestAction(
  companyId: string,
  slug: string,
  swapId: string
) {
  const profile = await getCallerProfile()
  if (!profile || profile.company_id !== companyId) {
    return { error: 'Akses ditolak.' }
  }

  const client = await createClient()

  const { data: swap, error: fetchErr } = await client
    .from('shift_swap_requests')
    .select('*')
    .eq('id', swapId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (fetchErr || !swap) {
    return { error: 'Pengajuan tukar shift tidak ditemukan.' }
  }

  if (swap.requester_id !== profile.user_id) {
    return { error: 'Akses ditolak. Hanya pemohon yang dapat membatalkan.' }
  }

  if (swap.status !== 'pending') {
    return { error: 'Pengajuan tidak dapat dibatalkan karena sudah diputuskan.' }
  }

  const { data: cancelledRows, error: cancelError } = await client
    .from('shift_swap_requests')
    .update({ status: 'cancelled' })
    .eq('id', swapId)
    .eq('company_id', companyId)
    // Race guard: only a still-pending request can be cancelled
    .eq('status', 'pending')
    .select('id')

  if (cancelError) {
    return { error: 'Gagal membatalkan pengajuan: ' + cancelError.message }
  }
  if (!cancelledRows || cancelledRows.length === 0) {
    return { error: 'Pengajuan tidak dapat dibatalkan karena sudah diputuskan.' }
  }

  revalidatePath(`/${slug}/shifts`)
  return { success: true }
}

