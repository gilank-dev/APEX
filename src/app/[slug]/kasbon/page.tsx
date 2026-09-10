import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveEntitledModules } from '@/lib/entitlements'
import KasbonClient from './KasbonClient'
import ModuleLockScreen from '@/components/shared/ModuleLockScreen'
import { KasbonRequest, KasbonRepayment } from '@/lib/kasbon-actions'

interface KasbonPageProps {
  params: Promise<{ slug: string }>
}

export default async function KasbonPage({ params }: KasbonPageProps) {
  const { slug } = await params
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

  // Entitlement gate BEFORE any data fetch
  const isModuleActive = resolveEntitledModules(company).includes('kasbon')
  if (!isModuleActive) {
    const storedActive = (company.active_modules || []).includes('kasbon')
    return (
      <ModuleLockScreen
        slug={slug}
        featureName="Kasbon"
        reason={storedActive ? 'upgrade' : 'inactive'}
        isAdminOrManager={isAdminOrManager}
        description="Kelola pengajuan kasbon karyawan dengan jadwal cicilan otomatis dan potong gaji tercatat rapi. Tersedia untuk paket Pro."
      />
    )
  }

  // Fetch members for the admin dropdown
  const { data: membersData } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('company_id', company.id)
    .order('full_name', { ascending: true })

  // Fetch kasbon requests (non-managers see only their own)
  let requestsQuery = supabase
    .from('kasbon_requests')
    .select('*, user:users!user_id(full_name)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  if (!isAdminOrManager) {
    requestsQuery = requestsQuery.eq('user_id', profile.id)
  }

  const { data: requestsData } = await requestsQuery

  // Fetch repayments (non-managers see only their own)
  let repaymentsQuery = supabase
    .from('kasbon_repayments')
    .select('*')
    .eq('company_id', company.id)
    .order('due_date', { ascending: true })

  if (!isAdminOrManager) {
    repaymentsQuery = repaymentsQuery.eq('user_id', profile.id)
  }

  const { data: repaymentsData } = await repaymentsQuery

  return (
    <KasbonClient
      slug={slug}
      companyId={company.id}
      isAdminOrManager={isAdminOrManager}
      currentUserId={profile.id}
      initialRequests={(requestsData as unknown as KasbonRequest[]) || []}
      initialRepayments={(repaymentsData as unknown as KasbonRepayment[]) || []}
      members={(membersData as { id: string; full_name: string }[]) || []}
    />
  )
}
