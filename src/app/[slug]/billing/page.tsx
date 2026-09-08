import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionLayout from '@/components/shared/SubscriptionLayout'
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

      <SubscriptionLayout company={company} />
    </div>
  )
}
