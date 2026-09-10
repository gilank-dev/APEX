import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { effectiveTier, isTrialActive, formatTrialDate } from '@/lib/entitlements'

// Minimal tenant shapes used by this page (subset of the DB rows)
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

  // Fetch company info and statistics
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

  // Fetch stats count
  // 1. Attendance today
  const today = new Date().toISOString().split('T')[0]
  const { count: attendanceCount } = await supabase
    .from('attendance_logs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company.id)
    .gte('clock_in_time', `${today}T00:00:00.000Z`)

  // 2. Open tasks (todo, in_progress, review)
  const { count: openTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company.id)
    .neq('status', 'done')

  // 3. Low stock inventory
  const { data: lowStockData } = await supabase
    .from('inventory_assets')
    .select('id')
    .eq('company_id', company.id)
    .lte('quantity', 10)

  const lowStockCount = lowStockData?.length || 0

  // Fetch total employees to compute percentage rate
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company.id)

  // Fetch past 6 days dates
  const dates = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  const dayNames = dates.map(dateStr => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  })

  // Fetch logs count for each day
  const dailyAttendanceRates = await Promise.all(
    dates.map(async (date) => {
      const { count } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('clock_in_time', `${date}T00:00:00.000Z`)
        .lte('clock_in_time', `${date}T23:59:59.999Z`)

      const activeUserCount = totalUsers || 1
      const percent = Math.min(100, Math.round(((count || 0) / activeUserCount) * 100))
      return { count: count || 0, percent }
    })
  )

  const hasRealAttendance = dailyAttendanceRates.some((r) => r.count > 0)
  const trendPercentages = hasRealAttendance
    ? dailyAttendanceRates.map((r) => r.percent)
    : [0, 0, 0, 0, 0, 0]

  const averageAttendance = hasRealAttendance
    ? Number((trendPercentages.reduce((sum, p) => sum + p, 0) / trendPercentages.length).toFixed(1))
    : 0

  const getY = (p: number) => Math.round(140 - (p / 100) * 110)

  const chartPoints = trendPercentages.map((val, idx) => {
    const x = (idx / (trendPercentages.length - 1)) * 500
    const y = getY(val)
    return { x, y }
  })
  const pathD = chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
  const areaD = `${pathD} L 500,150 L 0,150 Z`

  // Fetch tasks status distribution
  const { data: dbTasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('company_id', company.id)

  const totalTasks = dbTasks?.length || 0
  const todoCount = dbTasks?.filter((t) => t.status === 'todo').length || 0
  const inProgressCount = dbTasks?.filter((t) => t.status === 'in_progress').length || 0
  const reviewCount = dbTasks?.filter((t) => t.status === 'review').length || 0
  const doneCount = dbTasks?.filter((t) => t.status === 'done').length || 0

  const dTodo = todoCount
  const dInProgress = inProgressCount
  const dReview = reviewCount
  const dDone = doneCount
  const dTotal = totalTasks

  const pTodo = dTotal > 0 ? Math.round((dTodo / dTotal) * 100) : 0
  const pInProgress = dTotal > 0 ? Math.round((dInProgress / dTotal) * 100) : 0
  const pReview = dTotal > 0 ? Math.round((dReview / dTotal) * 100) : 0
  const pDone = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0
  const kpiPercent = pDone

  return (
    <div className="space-y-6 dashboard-container">
      {/* Banner Tier */}
      {isTrialActive(company) && (
        <div className="p-4 bg-orange-50/80 border border-primary/20 rounded-lg text-xs font-mono text-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
          <div>
            <span className="font-bold">TRIAL PRO AKTIF:</span> Berlaku s.d. {formatTrialDate(company.trial_ends_at as string)}. Kuota hingga 100 karyawan & seluruh modul Pro terbuka.
          </div>
          <Link
            href={`/${slug}/billing`}
            className="text-white bg-primary hover:bg-primary-hover text-[11px] font-bold px-4 py-1.5 rounded-md transition-colors uppercase"
          >
            Upgrade Langganan
          </Link>
        </div>
      )}

      {effectiveTier(company) === 'free' && (
        <div className="p-4 bg-primary/5 border border-primary/15 rounded-lg text-xs font-mono text-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
          <div>
            <span className="font-bold">FREE PLAN ACTIVE:</span> Maximum limit of 15 users.
          </div>
          <Link
            href={`/${slug}/billing`}
            className="text-white bg-primary hover:bg-primary-hover text-[11px] font-bold px-4 py-1.5 rounded-md transition-colors uppercase"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Control Center</h1>
        <p className="text-sm text-gray-500 font-mono mt-1">OPERATIONAL STATUS AND KEY METRICS TODAY</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Attendance */}
        {activeModules.includes('attendance') && (
          <div className="liquid-glass p-6 border border-border rounded-lg flex flex-col justify-between h-36">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Today&apos;s Attendance Log</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-4xl font-extrabold text-foreground font-mono">{attendanceCount || 0}</span>
              <span className="text-xs text-gray-450 text-gray-500 font-mono">ACTIVE ATTENDANCE</span>
            </div>
            <Link
              href={`/${slug}/attendance`}
              className="text-xs text-primary hover:underline font-mono uppercase mt-4 block"
            >
              [Open Attendance Logs]
            </Link>
          </div>
        )}

        {/* Stat 2: Tasks */}
        {activeModules.includes('tasks') && (
          <div className="liquid-glass p-6 border border-border rounded-lg flex flex-col justify-between h-36">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Ongoing Tasks</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-4xl font-extrabold text-foreground font-mono">{openTasksCount || 0}</span>
              <span className="text-xs text-gray-500 font-mono">PENDING COMPLETION</span>
            </div>
            <Link
              href={`/${slug}/tasks`}
              className="text-xs text-primary hover:underline font-mono uppercase mt-4 block"
            >
              [Open Kanban Board]
            </Link>
          </div>
        )}

        {/* Stat 3: Inventory */}
        {activeModules.includes('inventory') && (
          <div className="liquid-glass p-6 border border-border rounded-lg flex flex-col justify-between h-36">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Low Stock SKUs</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-4xl font-extrabold text-foreground font-mono">{lowStockCount}</span>
              <span className="text-xs text-gray-500 font-mono">ITEMS UNDER LIMIT</span>
            </div>
            <Link
              href={`/${slug}/inventory`}
              className="text-xs text-primary hover:underline font-mono uppercase mt-4 block"
            >
              [Open Inventory]
            </Link>
          </div>
        )}
      </div>

      {/* Visual Analytics Sector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="liquid-glass p-6 border border-border rounded-lg space-y-4">
          <div className="border-b border-border pb-2 flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-gray-500">
              Weekly Attendance Trend (%)
            </h2>
            <span className="text-[10px] font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
              Average: {averageAttendance}%
            </span>
          </div>

          <div className="h-32 w-full flex items-end justify-between pt-4 px-2 relative">
            {/* Grid Lines */}
            <div className="absolute inset-x-0 top-4 border-t border-gray-100 border-dashed text-[9px] text-gray-400 font-mono pt-1">100%</div>
            <div className="absolute inset-x-0 top-14 border-t border-gray-100 border-dashed text-[9px] text-gray-400 font-mono pt-1">80%</div>
            <div className="absolute inset-x-0 top-24 border-t border-gray-100 border-dashed text-[9px] text-gray-400 font-mono pt-1">60%</div>

            {/* Line / Bar Chart (SVG) */}
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Area path */}
              <path 
                d={areaD} 
                fill="url(#areaGrad)" 
              />
              
              {/* Line path */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="#F97316" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* Circle markers */}
              {chartPoints.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#F97316" 
                  stroke="#FFF" 
                  strokeWidth="2" 
                />
              ))}
            </svg>
          </div>
          
          <div className="flex justify-between text-[10px] text-gray-400 font-mono px-2 pt-1">
            {dayNames.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>

        {/* Task Allocation Chart */}
        <div className="liquid-glass p-6 border border-border rounded-lg space-y-4">
          <div className="border-b border-border pb-2 flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-gray-500">
              Team Workload & Progress (%)
            </h2>
            <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Total: {totalTasks} Tasks
            </span>
          </div>

          <div className="h-32 w-full flex items-center justify-center pt-2">
            <div className="flex w-full items-center gap-6">
              {/* Simple SVG Donut Chart */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                  {/* Done segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray={`${pDone} ${100 - pDone}`} strokeDashoffset="0" />
                  {/* In Progress segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray={`${pInProgress} ${100 - pInProgress}`} strokeDashoffset={`-${pDone}`} />
                  {/* Review segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${pReview} ${100 - pReview}`} strokeDashoffset={`-${pDone + pInProgress}`} />
                  {/* Todo segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#9CA3AF" strokeWidth="3" strokeDasharray={`${pTodo} ${100 - pTodo}`} strokeDashoffset={`-${pDone + pInProgress + pReview}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-xs font-bold text-gray-800">{kpiPercent}%</span>
                  <span className="text-[8px] text-gray-400">KPI</span>
                </div>
              </div>

              {/* Chart Legend & Bars */}
              <div className="flex-1 space-y-2 text-[10px] font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Done</span>
                    <span className="font-bold text-gray-800">{pDone}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pDone}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>In Progress</span>
                    <span className="font-bold text-gray-800">{pInProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pInProgress}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>In Review</span>
                    <span className="font-bold text-gray-800">{pReview}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${pReview}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Todo</span>
                    <span className="font-bold text-gray-800">{pTodo}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-gray-400 h-full rounded-full" style={{ width: `${pTodo}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Details Box */}
      <div className="liquid-glass p-6 border border-border rounded-lg space-y-4">
        <h2 className="text-xs font-mono uppercase text-gray-500 border-b border-border pb-2">
          SYSTEM INTEGRITY LOG
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono text-gray-700">
          <div className="space-y-2.5">
            <p>COMPANY ID: <span className="text-gray-500">{company.id}</span></p>
            <p>ACCESS TIER: <span className="text-primary uppercase font-bold">{company.tier}</span></p>
            <p>INTEGRITY SLUG: <span className="text-gray-500">/{company.slug}</span></p>
          </div>
          <div className="space-y-2.5">
            <p>SERVER TIME: <span className="text-gray-500">{new Date().toISOString()}</span></p>
            <p>ACTIVE USER: <span className="text-gray-900 font-bold">{profile.full_name}</span> <span className="text-gray-500">(@{role.name})</span></p>
            <p>CONNECTION STATUS: <span className="text-green-600 font-bold uppercase">SYS_ONLINE</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
