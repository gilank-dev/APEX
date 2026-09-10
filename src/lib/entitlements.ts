export interface CompanyEntitlements {
  tier?: string | null
  trial_ends_at?: string | Date | null
}

// Check whether the 14-day Pro trial is currently active
export function isTrialActive(company: CompanyEntitlements | null | undefined): boolean {
  if (!company || !company.trial_ends_at) return false
  const trialEndDate = new Date(company.trial_ends_at)
  return !isNaN(trialEndDate.getTime()) && trialEndDate > new Date()
}

// Determine effective tier taking active trial into account
export function effectiveTier(
  company: CompanyEntitlements | null | undefined
): 'free' | 'pro' | 'enterprise' | 'suspended' {
  if (!company) return 'free'
  const rawTier = (company.tier || 'free').toLowerCase()

  if (rawTier === 'suspended') return 'suspended'
  if (rawTier === 'enterprise') return 'enterprise'
  if (rawTier === 'pro') return 'pro'

  // If tier is free but 14-day trial is currently active, elevate to pro
  if (isTrialActive(company)) {
    return 'pro'
  }

  return 'free'
}

// Check if company has Pro or higher features (paid Pro, Enterprise, or active Trial)
export function isProOrHigher(company: CompanyEntitlements | null | undefined): boolean {
  const tier = effectiveTier(company)
  return tier === 'pro' || tier === 'enterprise'
}

// Get maximum allowed workspace members based on effective tier
export function getMaxAllowedEmployees(company: CompanyEntitlements | null | undefined): number {
  const tier = effectiveTier(company)
  if (tier === 'free') return 15
  if (tier === 'pro') return 100
  return Infinity
}

// ---------------------------------------------------------------------------
// Module entitlements
// ---------------------------------------------------------------------------

// Modules available on the Free tier. Everything else requires Pro or higher.
export const FREE_MODULES = ['attendance', 'tasks'] as const

// Modules that require an active Pro plan (or trial) on top of Free.
export const PRO_MODULES = [
  'shifts',
  'leave',
  'payroll',
  'inventory',
  'kasbon',
] as const

// Modules that only exist for specific industry categories (dynamic features).
// Pro-gated as well: they are premium widgets per the pricing page.
export const INDUSTRY_MODULES = [
  'payroll-engine',
  'live-attendance-selfie',
  'multi-tier-approval',
  'student-database',
  'tuition-billing',
  'grade-book-system',
  'teacher-scheduling',
  'cash-drawer-audit',
  'fifo-inventory',
  'dynamic-roster',
  'live-sku-tracking',
  'stock-opname',
  'cashier-shift-handover',
  'lite-emr',
  'prescription-tracker',
  'patient-queue-system',
  'insurance-billing-flow',
  'fund-allocation-tracker',
  'donor-crm',
  'beneficiary-database',
] as const

export function isProModule(moduleId: string): boolean {
  return (
    (PRO_MODULES as readonly string[]).includes(moduleId) ||
    (INDUSTRY_MODULES as readonly string[]).includes(moduleId)
  )
}

// The effective module list a company may actually use: a Free company keeps
// only Free modules regardless of what is stored in active_modules. This is the
// single source of truth for both UI and server actions.
export function resolveEntitledModules(
  company: (CompanyEntitlements & { active_modules?: string[] | null }) | null | undefined
): string[] {
  if (!company) return [...FREE_MODULES]
  const stored = company.active_modules || []
  if (isProOrHigher(company)) return stored
  return stored.filter((m) => !isProModule(m))
}

// Format trial end date to Indonesian locale: e.g. "23 September 2026"
export function formatTrialDate(dateStrOrDate: string | Date): string {
  const date = typeof dateStrOrDate === 'string' ? new Date(dateStrOrDate) : dateStrOrDate
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
