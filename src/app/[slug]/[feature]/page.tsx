import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_FEATURES } from '@/lib/features'
import { isProModule, resolveEntitledModules } from '@/lib/entitlements'
import FeatureClient from './FeatureClient'
import ModuleLockScreen from '@/components/shared/ModuleLockScreen'

interface FeaturePageProps {
  params: Promise<{ slug: string; feature: string }>
}

export default async function DynamicFeaturePage({ params }: FeaturePageProps) {
  const { slug, feature: featureId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*, roles(*), companies(*)')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (error || !profile) {
    redirect('/login')
  }

  const company = profile.companies as any
  const role = profile.roles as any

  if (company.slug !== slug) {
    redirect(`/${company.slug}/dashboard`)
  }

  const isAdminOrManager = !!role.is_admin || role.name === 'Manager'

  // The feature id must belong to this company's industry category
  const category = company.category || 'corporate'
  const featuresList = CATEGORY_FEATURES[category] || CATEGORY_FEATURES.corporate
  const found = featuresList.find((f) => f.id === featureId)

  if (!found) {
    notFound()
  }

  // Entitlement check: resolve usable modules from tier + stored modules
  const entitledModules = resolveEntitledModules(company)
  const isActive = entitledModules.includes(featureId)

  if (!isActive) {
    // If the module is stored as active but filtered out, this is a plan limit
    const storedActive = (company.active_modules || []).includes(featureId)
    return (
      <ModuleLockScreen
        slug={slug}
        featureName={found.name}
        reason={storedActive ? 'upgrade' : 'inactive'}
        isAdminOrManager={isAdminOrManager}
      />
    )
  }

  return <FeatureClient slug={slug} featureId={featureId} />
}
