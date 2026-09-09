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

// Format trial end date to Indonesian locale: e.g. "23 September 2026"
export function formatTrialDate(dateStrOrDate: string | Date): string {
  const date = typeof dateStrOrDate === 'string' ? new Date(dateStrOrDate) : dateStrOrDate
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
