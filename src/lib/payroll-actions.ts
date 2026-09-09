'use server'

import { createAdminClient } from './supabase/server'
import { revalidatePath } from 'next/cache'

export interface PayrollSettingInput {
  user_id: string
  base_salary: number
  overtime_rate_per_hour: number
  active: boolean
}

// Bulk upsert payroll settings per employee
export async function saveBulkPayrollSettingsAction(
  companyId: string,
  slug: string,
  settings: PayrollSettingInput[]
) {
  if (!settings || settings.length === 0) {
    return { success: true }
  }

  const adminClient = createAdminClient()

  const payload = settings.map((s) => ({
    company_id: companyId,
    user_id: s.user_id,
    base_salary: Math.max(0, Number(s.base_salary) || 0),
    overtime_rate_per_hour: Math.max(0, Number(s.overtime_rate_per_hour) || 0),
    active: s.active ?? true,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await adminClient
    .from('employee_payroll_settings')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    return { error: 'Gagal menyimpan pengaturan gaji: ' + error.message }
  }

  revalidatePath(`/${slug}/payroll`)
  return { success: true }
}
