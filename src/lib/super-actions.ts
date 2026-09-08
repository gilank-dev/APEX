'use server'

import { createAdminClient, createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCompanyTierAction(companyId: string, tier: 'free' | 'pro' | 'enterprise') {
  if (!companyId || !tier) {
    return { error: 'Missing companyId or tier value.' }
  }

  // Defense-in-depth: verify caller session matches super-admin email and role
  const client = await createClient()
  const { data: { user }, error: userError } = await client.auth.getUser()
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'super-lankdev@apex.internal'

  if (userError || !user || user.email !== superAdminEmail || user.user_metadata?.role !== 'super-admin') {
    return { error: 'Unauthorized: Access restricted to super admin.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('companies')
    .update({ tier })
    .eq('id', companyId)

  if (error) {
    console.error('Failed to update company tier:', error)
    return { error: error.message || 'Failed to update company tier.' }
  }

  revalidatePath('/super-admin')
  return { success: true }
}
