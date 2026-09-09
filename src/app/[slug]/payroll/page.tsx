import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PayrollClient from './PayrollClient'
import { EmployeePayrollSetting } from '@/lib/payroll'
import { EmployeeSummary, AttendanceLogSummary, ShiftAssignmentSummary } from '@/lib/attendance-recap'
import { isProOrHigher } from '@/lib/entitlements'

interface PayrollPageProps {
  params: Promise<{ slug: string }>
}

export default async function PayrollPage({ params }: PayrollPageProps) {
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

  // Entitlement / Pro tier check
  const isProOrTrial = isProOrHigher(company)

  // 1. Fetch employees
  let employeesQuery = supabase
    .from('users')
    .select('id, full_name, email')
    .eq('company_id', company.id)
    .order('full_name', { ascending: true })

  if (!isAdminOrManager) {
    employeesQuery = employeesQuery.eq('id', profile.id)
  }

  const { data: employeesData } = await employeesQuery
  const employees: EmployeeSummary[] = (employeesData || []).map((e: any) => ({
    id: e.id,
    full_name: e.full_name,
    email: e.email,
  }))

  // 2. Fetch employee payroll settings
  let settingsQuery = supabase
    .from('employee_payroll_settings')
    .select('*')
    .eq('company_id', company.id)

  if (!isAdminOrManager) {
    settingsQuery = settingsQuery.eq('user_id', profile.id)
  }

  const { data: settingsData } = await settingsQuery
  const settings: EmployeePayrollSetting[] = (settingsData || []).map((s: any) => ({
    id: s.id,
    company_id: s.company_id,
    user_id: s.user_id,
    base_salary: Number(s.base_salary) || 0,
    overtime_rate_per_hour: Number(s.overtime_rate_per_hour) || 0,
    active: s.active,
  }))

  // 3. Fetch attendance logs
  let logsQuery = supabase
    .from('attendance_logs')
    .select('id, user_id, clock_in_time, clock_out_time')
    .eq('company_id', company.id)
    .order('clock_in_time', { ascending: true })

  if (!isAdminOrManager) {
    logsQuery = logsQuery.eq('user_id', profile.id)
  }

  const { data: logsData } = await logsQuery
  const logs: AttendanceLogSummary[] = (logsData || []).map((l: any) => ({
    id: l.id,
    user_id: l.user_id,
    clock_in_time: l.clock_in_time,
    clock_out_time: l.clock_out_time,
  }))

  // 4. Fetch shift assignments
  let assignQuery = supabase
    .from('shift_assignments')
    .select('user_id, assignment_date, shift_templates(name, start_time, end_time, overnight)')
    .eq('company_id', company.id)

  if (!isAdminOrManager) {
    assignQuery = assignQuery.eq('user_id', profile.id)
  }

  const { data: assignData } = await assignQuery
  const assignments: ShiftAssignmentSummary[] = (assignData || []) as unknown as ShiftAssignmentSummary[]

  return (
    <PayrollClient
      slug={slug}
      companyId={company.id}
      isProOrTrial={isProOrTrial}
      isAdminOrManager={isAdminOrManager}
      currentUserId={profile.id}
      employees={employees}
      initialSettings={settings}
      logs={logs}
      assignments={assignments}
    />
  )
}
