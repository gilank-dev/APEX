import { createClient } from '@/lib/supabase/server'

export interface CallerProfile {
  user_id: string        // users.id (profile row id)
  auth_id: string        // auth.users id
  company_id: string
  company_slug: string
  role_name: string      // roles.name
  is_admin: boolean      // roles.is_admin
}

// Resolve the caller from their session. Returns null when unauthenticated
// or the profile row is missing.
export async function getCallerProfile(): Promise<CallerProfile | null> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data: profile } = await client
    .from('users')
    .select('id, auth_id, company_id, companies(slug), roles(name, is_admin)')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return null

  return {
    user_id: profile.id,
    auth_id: profile.auth_id,
    company_id: profile.company_id,
    company_slug: (profile.companies as any)?.slug ?? '',
    role_name: (profile.roles as any)?.name ?? '',
    is_admin: Boolean((profile.roles as any)?.is_admin),
  }
}

// Require an Admin/Manager caller belonging to `companyId`. Returns a discriminated result.
export async function requireManager(
  companyId: string
): Promise<{ ok: true; profile: CallerProfile } | { ok: false; error: string }> {
  const profile = await getCallerProfile()
  if (!profile) return { ok: false, error: 'Tidak terautentikasi.' }
  if (profile.company_id !== companyId) return { ok: false, error: 'Akses ditolak.' }
  if (!profile.is_admin && !['Admin', 'Manager'].includes(profile.role_name)) {
    return { ok: false, error: 'Akses ditolak.' }
  }
  return { ok: true, profile }
}
