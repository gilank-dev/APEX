import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClientPage from './SuperAdminClientPage'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Super Admin Command Center',
  description: 'Global multi-tenant system oversight and telemetry monitoring node.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Strict Super Admin authorization check (both email and app_metadata role required;
  //    app_metadata is not client-writable, unlike user_metadata)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'super-lankdev@apex.internal'
  const isSuperAdmin = user.email === superAdminEmail && user.app_metadata?.role === 'super-admin'
  if (!isSuperAdmin) {
    const slug = user.user_metadata?.company_slug || ''
    redirect(slug ? `/${slug}/dashboard` : '/login')
  }

  const adminClient = createAdminClient()

  // 3. Query all companies registered on the platform
  const { data: companies = [] } = await adminClient
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  // 4. Query total database activity telemetry
  const { count: attendanceCount } = await adminClient
    .from('attendance_logs')
    .select('*', { count: 'exact', head: true })

  const { count: tasksCount } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })

  return (
    <SuperAdminClientPage
      companies={companies || []}
      attendanceCount={attendanceCount || 0}
      tasksCount={tasksCount || 0}
      adminEmail={user.email || superAdminEmail}
    />
  )
}
