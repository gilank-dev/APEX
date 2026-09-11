import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { effectiveTier, isTrialActive, formatTrialDate } from '@/lib/entitlements'
import RealtimeDashboard, { type RealtimeDashboardStats } from './RealtimeDashboard'

interface Company {
  id: string
  slug: string
  tier: string
  trial_ends_at: string | null
  active_modules?: string[] | null
}

interface Role {
  name: string
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const formatted = slug.toUpperCase()
  return {
    title: `Control Center (${formatted})`,
    description: `Real-time workforce telemetry, daily attendance counts, active tasks, and inventory alerts for ${slug}.`,
    alternates: {
      canonical: `/${slug}/dashboard`,
    },
  }
}

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
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
    .single()

  if (!profile) {
    redirect('/login')
  }

  const company = profile.companies as Company
  const role = profile.roles as Role
  const activeModules = company.active_modules || ['attendance', 'tasks']

  // Single round-trip stats via the scoped RPC (migration 20260910000018).
  const { data: rpcStats } = await supabase.rpc('get_dashboard_stats', {
    target_company_id: company.id,
  })

  const initialStats = (rpcStats ?? {}) as RealtimeDashboardStats
  const serverRenderedAt = new Date().toISOString()

  return (
    <div className="space-y-6 dashboard-container">
      {/* Banner Tier */}
      {isTrialActive(company) && (
        <div className="p-4 bg-orange-50/80 border border-primary/20 rounded-lg text-xs font-mono text-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
          <div>
            <span className="font-bold">TRIAL PRO AKTIF:</span> Berlaku s.d. {formatTrialDate(company.trial_ends_at as string)}. Kuota hingga 100 karyawan & seluruh modul Pro terbuka.
          </div>
          <a
            href={`/${slug}/billing`}
            className="text-white bg-primary hover:bg-primary-hover text-[11px] font-bold px-4 py-1.5 rounded-md transition-colors uppercase"
          >
            Upgrade Langganan
          </a>
        </div>
      )}

      {effectiveTier(company) === 'free' && (
        <div className="p-4 bg-primary/5 border border-primary/15 rounded-lg text-xs font-mono text-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
          <div>
            <span className="font-bold">FREE PLAN ACTIVE:</span> Maximum limit of 15 users.
          </div>
          <a
            href={`/${slug}/billing`}
            className="text-white bg-primary hover:bg-primary-hover text-[11px] font-bold px-4 py-1.5 rounded-md transition-colors uppercase"
          >
            Upgrade to Pro
          </a>
        </div>
      )}

      <RealtimeDashboard
        companyId={company.id}
        slug={slug}
        activeModules={activeModules}
        initialStats={initialStats}
        serverRenderedAt={serverRenderedAt}
      />
    </div>
  )
}
