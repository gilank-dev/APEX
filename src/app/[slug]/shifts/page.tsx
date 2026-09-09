import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import ShiftsClient, { ShiftTemplate, ShiftAssignment, Employee } from './ShiftsClient'

interface ShiftsPageProps {
  params: Promise<{ slug: string }>
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setHours(0, 0, 0, 0)
  date.setDate(diff)
  return date
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default async function ShiftsPage({ params }: ShiftsPageProps) {
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

  // Entitlement / Pro tier check (free tier is gated unless trial is active)
  const isTrialActive = company.trial_ends_at && new Date(company.trial_ends_at) > new Date()
  const isProOrTrial = company.tier === 'pro' || company.tier === 'enterprise' || !!isTrialActive

  // Fetch shift templates
  let { data: templates } = await supabase
    .from('shift_templates')
    .select('*')
    .eq('company_id', company.id)
    .order('start_time', { ascending: true })

  // Auto-seed default templates if empty
  if ((!templates || templates.length === 0) && isProOrTrial) {
    const adminClient = createAdminClient()
    const defaultTemplates = [
      {
        company_id: company.id,
        name: 'Pagi',
        start_time: '07:00',
        end_time: '15:00',
        overnight: false,
      },
      {
        company_id: company.id,
        name: 'Siang',
        start_time: '15:00',
        end_time: '23:00',
        overnight: false,
      },
      {
        company_id: company.id,
        name: 'Malam',
        start_time: '23:00',
        end_time: '07:00',
        overnight: true,
      },
    ]

    await adminClient.from('shift_templates').insert(defaultTemplates)
    const { data: seeded } = await adminClient
      .from('shift_templates')
      .select('*')
      .eq('company_id', company.id)
      .order('start_time', { ascending: true })

    if (seeded) {
      templates = seeded
    }
  }

  // Fetch employees
  const { data: employees } = await supabase
    .from('users')
    .select('id, full_name, email, roles(name, is_admin)')
    .eq('company_id', company.id)
    .order('full_name', { ascending: true })

  // Fetch assignments for current week (-7 days to +14 days to cover navigation)
  const monday = getMonday(new Date())
  const startDate = new Date(monday)
  startDate.setDate(startDate.getDate() - 14)
  const endDate = new Date(monday)
  endDate.setDate(endDate.getDate() + 28)

  const { data: assignments } = await supabase
    .from('shift_assignments')
    .select('*, shift_templates(*)')
    .eq('company_id', company.id)
    .gte('assignment_date', toDateString(startDate))
    .lte('assignment_date', toDateString(endDate))

  // Format employees with single role object
  const formattedEmployees: Employee[] = (employees || []).map((e: any) => ({
    id: e.id,
    full_name: e.full_name,
    email: e.email,
    roles: Array.isArray(e.roles) ? e.roles[0] : e.roles,
  }))

  return (
    <ShiftsClient
      slug={slug}
      companyId={company.id}
      isProOrTrial={isProOrTrial}
      isAdminOrManager={isAdminOrManager}
      initialTemplates={(templates as ShiftTemplate[]) || []}
      employees={formattedEmployees}
      initialAssignments={(assignments as unknown as ShiftAssignment[]) || []}
    />
  )
}
