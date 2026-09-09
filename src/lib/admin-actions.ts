'use server'

import { createAdminClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { effectiveTier, getMaxAllowedEmployees } from './entitlements'
import { getCallerProfile, requireManager } from '@/lib/authz'

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

