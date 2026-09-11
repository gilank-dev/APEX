'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Realtime stats shape returned by the get_dashboard_stats RPC.
interface DashboardStats {
  attendance_today: number
  open_tasks: number
  total_tasks: number
  tasks_todo: number
  tasks_in_progress: number
  tasks_review: number
  tasks_done: number
  low_stock: number
  total_members: number
  active_sessions: number
  daily_trend: { day: string; present: number }[]
}

export type { DashboardStats as RealtimeDashboardStats }

interface Props {
  companyId: string
  slug: string
  activeModules: string[]
  initialStats: DashboardStats
  serverRenderedAt: string
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function dayLabel(dayStr: string) {
  const d = new Date(dayStr + 'T00:00:00')
  return WEEKDAYS[d.getDay()]
}

export default function RealtimeDashboard({ companyId, slug, activeModules, initialStats, serverRenderedAt }: Props) {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [connected, setConnected] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date(serverRenderedAt))
  const [pulse, setPulse] = useState(false)
  // Lazy single-instance client: useState initializer runs exactly once.
  const [client] = useState(() => createClient())

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await client.rpc('get_dashboard_stats', {
        target_company_id: companyId,
      })
      if (error) throw error
      if (data) {
        setStats(data as DashboardStats)
        setLastSync(new Date())
        setPulse(true)
        setTimeout(() => setPulse(false), 700)
      }
    } catch {
      // Network hiccup: keep last known values, retry on next event/poll.
    }
  }, [companyId])

  useEffect(() => {
    // Realtime channel on the exact tables the charts are built from.
    // No `private: true`: this is a postgres_changes channel, and row access is
    // already enforced by each table's RLS policies using the caller's JWT.
    // (private:true would require realtime.messages policies instead.)
    const channel = client
      .channel(`dashboard-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_logs', filter: `company_id=eq.${companyId}` },
        () => { void refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `company_id=eq.${companyId}` },
        () => { void refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_assets', filter: `company_id=eq.${companyId}` },
        () => { void refresh() }
      )
      .on('system', { event: 'disconnect' }, () => setConnected(false))
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') void refresh()
      })

    // Safety net for environments where realtime events are not delivered.
    const poll = setInterval(() => { void refresh() }, 30_000)

    return () => {
      clearInterval(poll)
      void client.removeChannel(channel)
    }
  }, [companyId, refresh])

  const members = stats.total_members || 1
  const trendPoints = stats.daily_trend.map((t) => ({
    label: dayLabel(t.day),
    count: t.present,
    percent: Math.min(100, Math.round((t.present / members) * 100)),
  }))

  const hasRealData = stats.daily_trend.some((t) => t.present > 0)
  const averageAttendance = hasRealData
    ? Number(
        (trendPoints.reduce((sum, p) => sum + p.percent, 0) / trendPoints.length).toFixed(1)
      )
    : 0

  // SVG area chart geometry (500x150 viewBox, same as before).
  const getY = (p: number) => Math.round(140 - (p / 100) * 110)
  const chartPoints = trendPoints.map((p, idx) => ({
    x: (idx / (trendPoints.length - 1 || 1)) * 500,
    y: getY(p.percent),
  }))
  const pathD = chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
  const areaD = trendPoints.length > 1 ? `${pathD} L 500,150 L 0,150 Z` : ''

  const pTodo = stats.total_tasks > 0 ? Math.round((stats.tasks_todo / stats.total_tasks) * 100) : 0
  const pInProgress = stats.total_tasks > 0 ? Math.round((stats.tasks_in_progress / stats.total_tasks) * 100) : 0
  const pReview = stats.total_tasks > 0 ? Math.round((stats.tasks_review / stats.total_tasks) * 100) : 0
  const pDone = stats.total_tasks > 0 ? Math.round((stats.tasks_done / stats.total_tasks) * 100) : 0
  const kpiPercent = pDone

  return (
    <div className="space-y-6 dashboard-container">
      {/* Title + live indicator */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Control Center</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">OPERATIONAL STATUS AND KEY METRICS TODAY</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono select-none">
          <span
            className={`inline-block w-2 h-2 rounded-full transition-colors duration-300 ${
              pulse ? 'bg-green-400 scale-150' : connected ? 'bg-green-500' : 'bg-gray-400'
            }`}
            style={{ transition: 'all .3s' }}
          />
          <span className={connected ? 'text-green-600' : 'text-gray-500'}>
            {connected ? 'LIVE / REALTIME' : 'POLLING 30s'}
          </span>
          <span className="text-gray-400">SYNC {lastSync.toLocaleTimeString('id-ID')}</span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeModules.includes('attendance') && (
          <div className="liquid-glass p-6 border border-border rounded-lg flex flex-col justify-between h-36">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Today&apos;s Attendance Log</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-4xl font-extrabold text-foreground font-mono">{stats.attendance_today}</span>
              <span className="text-xs text-gray-500 font-mono">{stats.active_sessions} ON SHIFT NOW</span>
            </div>
            <a href={`/${slug}/attendance`} className="text-xs text-primary hover:underline font-mono uppercase mt-4 block">
              [Open Attendance Logs]
            </a>
          </div>
        )}

        {activeModules.includes('tasks') && (
          <div className="liquid-glass p-6 border border-border rounded-lg flex flex-col justify-between h-36">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Ongoing Tasks</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-4xl font-extrabold text-foreground font-mono">{stats.open_tasks}</span>
              <span className="text-xs text-gray-500 font-mono">PENDING COMPLETION</span>
            </div>
            <a href={`/${slug}/tasks`} className="text-xs text-primary hover:underline font-mono uppercase mt-4 block">
              [Open Kanban Board]
            </a>
          </div>
        )}

        {activeModules.includes('inventory') && (
          <div className="liquid-glass p-6 border border-border rounded-lg flex flex-col justify-between h-36">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Low Stock SKUs</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-4xl font-extrabold text-foreground font-mono">{stats.low_stock}</span>
              <span className="text-xs text-gray-500 font-mono">ITEMS UNDER LIMIT</span>
            </div>
            <a href={`/${slug}/inventory`} className="text-xs text-primary hover:underline font-mono uppercase mt-4 block">
              [Open Inventory]
            </a>
          </div>
        )}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="liquid-glass p-6 border border-border rounded-lg space-y-4">
          <div className="border-b border-border pb-2 flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-gray-500">Weekly Attendance Trend (%)</h2>
            <span className="text-[10px] font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
              Average: {averageAttendance}%
            </span>
          </div>

          <div className="h-32 w-full flex items-end justify-between pt-4 px-2 relative">
            <div className="absolute inset-x-0 top-4 border-t border-gray-100 border-dashed text-[9px] text-gray-400 font-mono pt-1">100%</div>
            <div className="absolute inset-x-0 top-14 border-t border-gray-100 border-dashed text-[9px] text-gray-400 font-mono pt-1">80%</div>
            <div className="absolute inset-x-0 top-24 border-t border-gray-100 border-dashed text-[9px] text-gray-400 font-mono pt-1">60%</div>

            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {areaD && <path d={areaD} fill="url(#areaGrad)" />}
              <path d={pathD} fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
              {chartPoints.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#F97316" stroke="#FFF" strokeWidth="2" />
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-gray-400 font-mono px-2 pt-1">
            {trendPoints.map((p, i) => (
              <span key={i}>{p.label}</span>
            ))}
          </div>
        </div>

        {/* Task Allocation */}
        <div className="liquid-glass p-6 border border-border rounded-lg space-y-4">
          <div className="border-b border-border pb-2 flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-gray-500">Team Workload &amp; Progress (%)</h2>
            <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Total: {stats.total_tasks} Tasks
            </span>
          </div>

          <div className="h-32 w-full flex items-center justify-center pt-2">
            <div className="flex w-full items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray={`${pDone} ${100 - pDone}`} strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray={`${pInProgress} ${100 - pInProgress}`} strokeDashoffset={`-${pDone}`} />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${pReview} ${100 - pReview}`} strokeDashoffset={`-${pDone + pInProgress}`} />
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
                    <span className="font-bold text-gray-800">{pDone}% ({stats.tasks_done})</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pDone}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>In Progress</span>
                    <span className="font-bold text-gray-800">{pInProgress}% ({stats.tasks_in_progress})</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pInProgress}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>In Review</span>
                    <span className="font-bold text-gray-800">{pReview}% ({stats.tasks_review})</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${pReview}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Todo</span>
                    <span className="font-bold text-gray-800">{pTodo}% ({stats.tasks_todo})</span>
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
            <p>COMPANY ID: <span className="text-gray-500">{companyId}</span></p>
            <p>MEMBERS: <span className="text-gray-500">{stats.total_members}</span></p>
            <p>INTEGRITY SLUG: <span className="text-gray-500">/{slug}</span></p>
          </div>
          <div className="space-y-2.5">
            <p>LAST SYNC: <span className="text-gray-500">{lastSync.toISOString()}</span></p>
            <p>CHANNEL: <span className={connected ? 'text-green-600 font-bold uppercase' : 'text-gray-500 uppercase'}>
              {connected ? 'REALTIME_LINK_ACTIVE' : 'POLLING_FALLBACK'}
            </span></p>
            <p>CONNECTION STATUS: <span className="text-green-600 font-bold uppercase">SYS_ONLINE</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
