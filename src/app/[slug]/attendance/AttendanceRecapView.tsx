'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Download,
  Calendar,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import {
  computeMonthlyAttendanceRecap,
  exportAttendanceRecapToCsv,
  EmployeeRecap,
  EmployeeSummary,
  AttendanceLogSummary,
  ShiftAssignmentSummary,
} from '@/lib/attendance-recap'

interface AttendanceRecapViewProps {
  companyId: string
  slug: string
  employees: EmployeeSummary[]
  isAdminOrManager: boolean
}

function getCurrentMonthString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function AttendanceRecapView({
  companyId,
  slug,
  employees,
  isAdminOrManager,
}: AttendanceRecapViewProps) {
  const supabase = createClient()
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString)
  const [logs, setLogs] = useState<AttendanceLogSummary[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignmentSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fetch logs and shift assignments for the selected month
  useEffect(() => {
    fetchMonthData()
  }, [selectedMonth, companyId])

  const fetchMonthData = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = `${selectedMonth}-01T00:00:00.000Z`
      // Last day of month
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`

      // 1. Fetch attendance logs for the month
      const { data: logData, error: logError } = await supabase
        .from('attendance_logs')
        .select('id, user_id, clock_in_time, clock_out_time')
        .eq('company_id', companyId)
        .gte('clock_in_time', startDate)
        .lte('clock_in_time', endDate)

      if (logData) {
        setLogs(logData as AttendanceLogSummary[])
      }

      // 2. Fetch shift assignments for the month
      const { data: assignData, error: assignError } = await supabase
        .from('shift_assignments')
        .select('user_id, assignment_date, shift_templates(name, start_time, end_time, overnight)')
        .eq('company_id', companyId)
        .gte('assignment_date', `${selectedMonth}-01`)
        .lte('assignment_date', `${selectedMonth}-${String(lastDay).padStart(2, '0')}`)

      if (assignData) {
        setAssignments(assignData as unknown as ShiftAssignmentSummary[])
      }
    } catch (err) {
      console.error('Error fetching monthly attendance data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Compute recap
  const recapData: EmployeeRecap[] = useMemo(() => {
    return computeMonthlyAttendanceRecap(selectedMonth, employees, logs, assignments)
  }, [selectedMonth, employees, logs, assignments])

  // Filtered recap for search
  const filteredRecap = useMemo(() => {
    if (!searchQuery.trim()) return recapData
    const q = searchQuery.toLowerCase()
    return recapData.filter((r) => r.fullName.toLowerCase().includes(q))
  }, [recapData, searchQuery])

  // Summary KPIs
  const summaryKpis = useMemo(() => {
    const totalPresent = recapData.reduce((acc, r) => acc + r.totalDaysPresent, 0)
    const totalOT = recapData.reduce((acc, r) => acc + r.overtimeHours, 0)
    const totalLate = recapData.reduce((acc, r) => acc + r.lateCount, 0)
    const missingLogs = recapData.reduce((acc, r) => acc + r.missingClockOutCount, 0)
    return {
      totalPresent,
      totalOT: Number(totalOT.toFixed(1)),
      totalLate,
      missingLogs,
    }
  }, [recapData])

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    const newY = d.getFullYear()
    const newM = String(d.getMonth() + 1).padStart(2, '0')
    setSelectedMonth(`${newY}-${newM}`)
  }

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    const newY = d.getFullYear()
    const newM = String(d.getMonth() + 1).padStart(2, '0')
    setSelectedMonth(`${newY}-${newM}`)
  }

  const formatMonthDisplay = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  const handleExportCsv = () => {
    exportAttendanceRecapToCsv(filteredRecap, selectedMonth, slug)
  }

  return (
    <div className="space-y-6">
      {/* Control Bar: Month Picker & Export Button */}
      <div className="liquid-glass p-4 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 border border-border rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-white rounded-md">
            <Calendar className="w-4 h-4 text-primary" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="text-xs font-mono font-semibold uppercase text-gray-900 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 border border-border rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            title="Bulan Selanjutnya"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>

          <span className="font-mono text-xs font-bold text-gray-800 ml-1">
            {formatMonthDisplay(selectedMonth)}
          </span>
        </div>

        {/* Search & Export CSV */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs font-sans border border-border rounded-md bg-white focus:outline-none focus:border-primary w-44"
          />

          <button
            onClick={handleExportCsv}
            disabled={loading || filteredRecap.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV (Excel)
          </button>
        </div>
      </div>

      {/* Monthly KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="liquid-glass p-4 border border-border rounded-lg">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
            Total Kehadiran
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-mono font-bold text-gray-900">
              {summaryKpis.totalPresent}
            </span>
            <span className="text-[10px] font-mono text-gray-400">orang-hari</span>
          </div>
        </div>

        <div className="liquid-glass p-4 border border-border rounded-lg">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
            Total Jam Lembur
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-mono font-bold text-primary">
              {summaryKpis.totalOT}
            </span>
            <span className="text-[10px] font-mono text-gray-400">jam</span>
          </div>
        </div>

        <div className="liquid-glass p-4 border border-border rounded-lg">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
            Kasus Terlambat
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-mono font-bold text-amber-600">
              {summaryKpis.totalLate}
            </span>
            <span className="text-[10px] font-mono text-gray-400">kali (&gt;10 min)</span>
          </div>
        </div>

        <div className="liquid-glass p-4 border border-border rounded-lg">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
            Log Tanpa Clock-Out
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-2xl font-mono font-bold ${
                summaryKpis.missingLogs > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {summaryKpis.missingLogs}
            </span>
            <span className="text-[10px] font-mono text-gray-400">sesi</span>
          </div>
        </div>
      </div>

      {/* Recap Table */}
      <div className="liquid-glass border border-border rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xs font-bold font-sans uppercase text-gray-900">
              Tabel Rekap Kehadiran Karyawan — {formatMonthDisplay(selectedMonth)}
            </h3>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">
              REKAP JAM KERJA, KETERLAMBATAN, DAN LEMBUR BULANAN
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Memuat data...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gray-50/70 border-b border-border text-[11px] font-mono text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-3 text-center">Hadir</th>
                <th className="py-3 px-3 text-center">Terlambat (&gt;10m)</th>
                <th className="py-3 px-3 text-center">Jam Lembur</th>
                <th className="py-3 px-3 text-center">Mangkir (Alpha)</th>
                <th className="py-3 px-4 text-right">Total Jam Kerja</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-border">
              {filteredRecap.map((row) => (
                <tr key={row.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{row.fullName}</div>
                    {row.hasMissingClockOut && (
                      <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-650 border border-red-200 text-[9px] font-mono">
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        <span>{row.missingClockOutCount} log tanpa clock out (0 jam)</span>
                      </div>
                    )}
                  </td>

                  {/* Days Present */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-800">
                    <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                      {row.totalDaysPresent} hari
                    </span>
                  </td>

                  {/* Late Count & Minutes */}
                  <td className="py-3.5 px-3 text-center font-mono">
                    {row.lateCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                        {row.lateCount}x ({row.lateMinutes} mnt)
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>

                  {/* Overtime Hours */}
                  <td className="py-3.5 px-3 text-center font-mono">
                    {row.overtimeHours > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-primary border border-primary/20 font-bold">
                        {row.overtimeHours} jam
                      </span>
                    ) : (
                      <span className="text-gray-400">0 jam</span>
                    )}
                  </td>

                  {/* Absent Days */}
                  <td className="py-3.5 px-3 text-center font-mono">
                    {row.absentDays > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                        {row.absentDays} hari
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>

                  {/* Total Hours Worked */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span
                      className={`font-bold ${
                        row.hasMissingClockOut ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {row.totalHoursWorked} jam
                    </span>
                  </td>
                </tr>
              ))}

              {filteredRecap.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-mono text-xs">
                    Tidak ada data rekap untuk periode {formatMonthDisplay(selectedMonth)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
