import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveEntitledModules } from '@/lib/entitlements'
import InventoryClient from './InventoryClient'
import ModuleLockScreen from '@/components/shared/ModuleLockScreen'

interface InventoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, roles(*), companies(*)')
    .eq('auth_id', user.id)
    .maybeSingle()

  const company = profile?.companies as any
  const role = profile?.roles as any

  if (!profile || !company || company.slug !== slug) {
    redirect(`/${(company?.slug) || 'login'}/dashboard`)
  }

  const isAdminOrManager = !!role.is_admin || role.name === 'Manager'
  const entitledModules = resolveEntitledModules(company)

  if (!entitledModules.includes('inventory')) {
    const storedActive = (company.active_modules || []).includes('inventory')
    return (
      <ModuleLockScreen
        slug={slug}
        featureName="Inventaris"
        reason={storedActive ? 'upgrade' : 'inactive'}
        isAdminOrManager={isAdminOrManager}
      />
    )
  }

  return <InventoryClient />
}
