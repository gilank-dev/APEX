import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LeaveClient from './LeaveClient'
import { LeaveRequest } from '@/lib/leave-actions'
import { Lock, Sparkles } from 'lucide-react'

interface LeavePageProps {
  params: Promise<{ slug: string }>
}

export default async function LeavePage({ params }: LeavePageProps) {
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
  const activeModules: string[] = company.active_modules || []
  const isModuleActive = activeModules.includes('leave')

  if (!isModuleActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
            Cuti & Izin
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            PENGAJUAN CUTI, IZIN, DAN SAKIT KARYAWAN
          </p>
        </div>

        <div className="liquid-glass max-w-2xl mx-auto my-12 p-8 border border-primary/20 rounded-xl text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-sans uppercase text-gray-900">
              Fitur Cuti & Izin Belum Aktif
            </h2>
            <p className="text-xs text-gray-600 font-sans max-w-md mx-auto leading-relaxed">
              Modul pengajuan cuti, izin, dan sakit karyawan belum diaktifkan pada perusahaan ini. Aktifkan modul melalui menu Admin Setting.
            </p>
          </div>
          {isAdminOrManager && (
            <div className="pt-2">
              <Link
                href={`/${slug}/admin`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" /> Kelola Modul di Admin Setting
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fetch company members to map user details
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('company_id', company.id)

  const userMap = new Map<string, { full_name: string; email: string }>()
  ;(members || []).forEach((m: any) => {
    userMap.set(m.id, { full_name: m.full_name, email: m.email })
  })

  // Fetch leave requests
  let requestsQuery = supabase
    .from('leave_requests')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  if (!isAdminOrManager) {
    requestsQuery = requestsQuery.eq('user_id', profile.id)
  }

  const { data: requestsData } = await requestsQuery

  const initialRequests: LeaveRequest[] = (requestsData || []).map((r: any) => ({
    id: r.id,
    company_id: r.company_id,
    user_id: r.user_id,
    leave_type: r.leave_type,
    start_date: r.start_date,
    end_date: r.end_date,
    reason: r.reason,
    status: r.status,
    decided_by: r.decided_by,
    decided_at: r.decided_at,
    created_at: r.created_at,
    user: userMap.get(r.user_id) || { full_name: 'Karyawan', email: '' },
  }))

  return (
    <LeaveClient
      slug={slug}
      companyId={company.id}
      isAdminOrManager={isAdminOrManager}
      currentUserId={profile.id}
      initialRequests={initialRequests}
    />
  )
}
