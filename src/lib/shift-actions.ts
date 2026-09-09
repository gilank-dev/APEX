'use server'

import { createAdminClient, createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'

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
  if (!assignments || assignments.length === 0) {
    return { success: true }
  }

  const adminClient = createAdminClient()

  // Split into deletes (OFF) and upserts
  const toDelete = assignments.filter((a) => !a.shift_template_id)
  const toUpsert = assignments.filter((a) => !!a.shift_template_id)

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
