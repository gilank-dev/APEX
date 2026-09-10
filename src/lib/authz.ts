import { createClient } from '@/lib/supabase/server'
import { effectiveTier, isProOrHigher, resolveEntitledModules } from '@/lib/entitlements'

export interface CallerProfile {
  user_id: string        // users.id (profile row id)
  auth_id: string        // auth.users id
  company_id: string
  company_slug: string
  role_name: string      // roles.name
  is_admin: boolean     // roles.is_admin
  tier: 'free' | 'pro' | 'enterprise' | 'suspended'
  is_pro: boolean        // effective tier is pro or higher (incl. trial)
  active_modules: string[] // entitlement-filtered list of usable modules
}

// Resolve the caller from their session. Returns null when unauthenticated
// or the profile row is missing.
export async function getCallerProfile(): Promise<CallerProfile | null> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data: profile } = await client
    .from('users')
    .select('id, auth_id, company_id, companies(slug, tier, trial_ends_at, active_modules), roles(name, is_admin)')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return null

  const company = profile.companies as any
  const active_modules = resolveEntitledModules(company)

  return {
    user_id: profile.id,
    auth_id: profile.auth_id,
    company_id: profile.company_id,
    company_slug: company?.slug ?? '',
    role_name: (profile.roles as any)?.name ?? '',
    is_admin: Boolean((profile.roles as any)?.is_admin),
    tier: effectiveTier(company),
    is_pro: isProOrHigher(company),
    active_modules,
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

// Require the caller's company to have `moduleId` usable (Free company
// cannot use Pro modules even if active_modules was tampered with).
export async function requireModuleAccess(
  companyId: string,
  moduleId: string
): Promise<{ ok: true; profile: CallerProfile } | { ok: false; error: string }> {
  const authz = await requireManager(companyId)
  if (!authz.ok) return authz
  if (!authz.profile.active_modules.includes(moduleId)) {
    return {
      ok: false,
      error: 'Modul ini tidak aktif pada paket Anda. Upgrade ke Pro untuk membukanya.',
    }
  }
  return authz
}

// Same as requireModuleAccess but for ALL members (self-service features like
// kasbon requests, where employees act for themselves). Authorization for
// "acting on behalf of someone else" is enforced by the caller.
export async function requireMemberModuleAccess(
  companyId: string,
  moduleId: string
): Promise<{ ok: true; profile: CallerProfile } | { ok: false; error: string }> {
  const profile = await getCallerProfile()
  if (!profile) return { ok: false, error: 'Tidak terautentikasi.' }
  if (profile.company_id !== companyId) return { ok: false, error: 'Akses ditolak.' }
  if (!profile.active_modules.includes(moduleId)) {
    return {
      ok: false,
      error: 'Modul ini tidak aktif pada paket Anda. Upgrade ke Pro untuk membukanya.',
    }
  }
  return { ok: true, profile }
}
