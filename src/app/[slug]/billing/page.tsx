import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionLayout from '@/components/shared/SubscriptionLayout'
import { isTrialActive, formatTrialDate } from '@/lib/entitlements'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const formatted = slug.toUpperCase()
  return {
    title: `Subscription & Billing (${formatted})`,
    description: `Manage workspace quotas, subscription tiers, and invoicing for ${slug}.`,
    alternates: {
      canonical: `/${slug}/billing`,
    },
  }
}

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('auth_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const company = profile.companies as any

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Subscription System</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">SUBSCRIPTION STATUS AND NODE ACTIVATION</p>
      </div>

      {isTrialActive(company) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-sm font-medium">
              Trial Pro aktif s.d. <span className="font-bold">{formatTrialDate(company?.trial_ends_at)}</span>
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-500/20 text-amber-800 px-2.5 py-1 rounded self-start sm:self-auto font-semibold">
            14 Hari Akses Penuh
          </span>
        </div>
      )}

      <SubscriptionLayout company={company} />
    </div>
  )
}
