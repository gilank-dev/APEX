'use server'

import { createAdminClient, createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { effectiveTier, getMaxAllowedEmployees } from './entitlements'
import { getCallerProfile, requireManager } from '@/lib/authz'
import { parseCsv, rowsToEmployees } from './csv'
import crypto from 'node:crypto'

export async function updateModulesAction(companyId: string, slug: string, modules: string[]) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('companies')
    .update({ active_modules: modules })
    .eq('id', companyId)

  if (error) {
    return { error: 'Failed to update active modules.' }
  }

  revalidatePath(`/${slug}/admin`)
  return { success: true }
}

export async function createDummyAccountAction(companyId: string, companySlug: string, fullName: string, roleName: string = 'Employee') {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  if (!fullName) {
    return { error: 'Full name is required.' }
  }

  const adminClient = createAdminClient()

  // 1. Get company details to check tier
  const { data: company, error: compError } = await adminClient
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (compError || !company) {
    return { error: 'Company details not found.' }
  }

  // Count current workspace members
  const { count: currentMemberCount } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const tier = effectiveTier(company)
  const maxAllowed = getMaxAllowedEmployees(company)

  if ((currentMemberCount || 0) >= maxAllowed) {
    return { error: `Batas kuota karyawan untuk tingkat ${tier.toUpperCase()} (${maxAllowed} orang) telah tercapai. Silakan lakukan peningkatan paket langganan.` }
  }

  // 2. Get the specified role for the company
  const { data: role, error: roleError } = await adminClient
    .from('roles')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', roleName)
    .single()

  if (roleError || !role) {
    return { error: `Failed to locate role ${roleName} for this company.` }
  }

  // 2. Generate credentials
  const username = fullName.toLowerCase().replace(/\s+/g, '') + Math.floor(100 + Math.random() * 900)
  const pseudoEmail = `${username}@${companySlug}.local`
  const password = Math.random().toString(36).substring(2, 10) // Temporary password

  // 3. Create confirmed user via Admin API
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: pseudoEmail,
    password,
    email_confirm: true,
    user_metadata: {
      company_slug: companySlug,
      role: roleName,
    },
  })

  if (createError || !newUser.user) {
    return { error: createError?.message || 'Failed to create employee account in the system.' }
  }

  // 4. Save profile record
  const { error: insertError } = await adminClient.from('users').insert({
    auth_id: newUser.user.id,
    company_id: companyId,
    role_id: role.id,
    email: pseudoEmail,
    full_name: fullName,
    is_dummy_account: true,
  })

  if (insertError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: 'Failed to create dummy employee profile.' }
  }

  revalidatePath(`/${companySlug}/admin`)
  return { success: true, email: pseudoEmail, password }
}

export async function resetDummyPasswordAction(userId: string, companySlug: string, newPassword?: string) {
  const profile = await getCallerProfile()
  if (!profile) {
    return { error: 'Tidak terautentikasi.' }
  }
  if (!profile.is_admin && profile.role_name !== 'Admin') {
    return { error: 'Akses ditolak.' }
  }

  const adminClient = createAdminClient()

  let { data: target } = await adminClient
    .from('users')
    .select('company_id, auth_id')
    .eq('id', userId)
    .maybeSingle()

  if (!target) {
    const { data: targetByAuth } = await adminClient
      .from('users')
      .select('company_id, auth_id')
      .eq('auth_id', userId)
      .maybeSingle()
    target = targetByAuth
  }

  if (!target) {
    return { error: 'Pengguna tidak ditemukan.' }
  }

  if (profile.company_id !== target.company_id) {
    return { error: 'Akses ditolak.' }
  }

  const password = newPassword || Math.random().toString(36).substring(2, 10)

  const { error } = await adminClient.auth.admin.updateUserById(target.auth_id || userId, {
    password,
  })

  if (error) {
    return { error: 'Failed to reset password: ' + error.message }
  }

  revalidatePath(`/${companySlug}/admin`)
  return { success: true, password }
}

export async function regenerateInviteCodeAction(roleId: string, companySlug: string) {
  const profile = await getCallerProfile()
  if (!profile) {
    return { error: 'Tidak terautentikasi.' }
  }
  if (!profile.is_admin && !['Admin', 'Manager'].includes(profile.role_name)) {
    return { error: 'Akses ditolak.' }
  }

  if (!roleId || !companySlug) {
    return { error: 'Role ID and company slug are required.' }
  }

  const adminClient = createAdminClient()

  const { data: role, error: roleError } = await adminClient
    .from('roles')
    .select('company_id, name')
    .eq('id', roleId)
    .maybeSingle()

  if (roleError || !role) {
    return { error: 'Role tidak ditemukan.' }
  }

  if (profile.company_id !== role.company_id) {
    return { error: 'Akses ditolak.' }
  }

  const prefix = role.name.toLowerCase().includes('admin') ? 'AD-' : 'EM-'
  const newInviteCode = prefix + Math.random().toString(36).substring(2, 8).toUpperCase()

  const { error: updateError } = await adminClient
    .from('roles')
    .update({ invite_code: newInviteCode })
    .eq('id', roleId)

  if (updateError) {
    return { error: 'Failed to update invite code: ' + updateError.message }
  }

  revalidatePath(`/${companySlug}/admin`)
  return { success: true, newInviteCode }
}

export async function importEmployeesAction(
  companyId: string,
  slug: string,
  csvText: string
) {
  const authz = await requireManager(companyId)
  if (!authz.ok) return { error: authz.error }

  if (!csvText || !csvText.trim()) {
    return { error: 'Data CSV tidak boleh kosong.' }
  }

  const rawRows = parseCsv(csvText)
  const { employees, errors: parseErrors } = rowsToEmployees(rawRows, { limit: 200 })

  if (employees.length === 0) {
    return {
      error: parseErrors.length > 0 ? parseErrors[0] : 'Tidak ada data karyawan yang valid.',
      errors: parseErrors,
    }
  }

  // 1. Fetch company via session client first for tier data
  const sessionClient = await createClient()
  const { data: company, error: compError } = await sessionClient
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (compError || !company) {
    return { error: 'Informasi perusahaan tidak ditemukan.' }
  }

  const adminClient = createAdminClient()

  // 2. Respect entitlements: count current members + new <= getMaxAllowedEmployees(company)
  const { count: currentMemberCount } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const maxAllowed = getMaxAllowedEmployees(company)
  const currentCount = currentMemberCount || 0
  const availableSlots = Math.max(0, maxAllowed - currentCount)

  let quotaReached = false
  let toImport = employees
  let skipped = 0

  if (employees.length > availableSlots) {
    quotaReached = true
    toImport = employees.slice(0, availableSlots)
    skipped = employees.length - toImport.length
  }

  if (toImport.length === 0) {
    return {
      success: true,
      imported: 0,
      skipped: employees.length,
      quotaReached: true,
      errors: ['Batas kuota karyawan telah tercapai.'],
    }
  }

  // 3. Fetch existing roles for company
  const { data: existingRoles } = await adminClient
    .from('roles')
    .select('id, name')
    .eq('company_id', companyId)

  const roleMap = new Map<string, string>()
  ;(existingRoles || []).forEach((r) => {
    roleMap.set(r.name.toLowerCase(), r.id)
  })

  // Helper for generating invite code: XX- + 6 random alnum via crypto
  const generateRoleInviteCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const bytes = crypto.randomBytes(6)
    let code = 'XX-'
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length]
    }
    return code
  }

  let imported = 0
  const importErrors = [...parseErrors]

  for (const emp of toImport) {
    const lowerRole = emp.role_name.toLowerCase()
    let roleId = roleMap.get(lowerRole)

    if (!roleId) {
      const newInviteCode = generateRoleInviteCode()
      const { data: newRole, error: roleError } = await adminClient
        .from('roles')
        .insert({
          company_id: companyId,
          name: emp.role_name,
          invite_code: newInviteCode,
          is_admin: false,
          permissions: {},
        })
        .select('id, name')
        .single()

      if (roleError || !newRole?.id) {
        importErrors.push(`Gagal membuat role ${emp.role_name} untuk ${emp.full_name}`)
        skipped++
        continue
      }
      const createdRoleId = newRole.id as string
      roleId = createdRoleId
      roleMap.set(lowerRole, createdRoleId)
    }

    if (!roleId) {
      skipped++
      continue
    }

    const isDummy = !emp.email || emp.email.trim() === ''
    const { error: insertError } = await adminClient.from('users').insert({
      auth_id: null,
      company_id: companyId,
      role_id: roleId,
      email: emp.email || '',
      full_name: emp.full_name,
      is_dummy_account: isDummy,
    })

    if (insertError) {
      importErrors.push(`Gagal mengimpor ${emp.full_name}: ${insertError.message}`)
      skipped++
    } else {
      imported++
    }
  }

  revalidatePath(`/${slug}/admin`)
  return {
    success: true,
    imported,
    skipped,
    quotaReached,
    errors: importErrors,
  }
}


