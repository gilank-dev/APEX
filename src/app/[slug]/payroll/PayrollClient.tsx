'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  Calendar,
  Download,
  Settings,
  Calculator,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import {
  computeMonthlyPayroll,
  exportPayrollRunToCsv,
  formatRupiah,
  EmployeePayrollSetting,
  PayrollRunItem,
} from '@/lib/payroll'
import { EmployeeSummary, AttendanceLogSummary, ShiftAssignmentSummary } from '@/lib/attendance-recap'
import { saveBulkPayrollSettingsAction } from '@/lib/payroll-actions'

interface PayrollClientProps {
  slug: string
  companyId: string
  isProOrTrial: boolean
  isAdminOrManager: boolean
  currentUserId: string
  employees: EmployeeSummary[]
  initialSettings: EmployeePayrollSetting[]
  logs: AttendanceLogSummary[]
  assignments: ShiftAssignmentSummary[]
}

function getCurrentMonthString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function PayrollClient({
  slug,
  companyId,
  isProOrTrial,
  isAdminOrManager,
  currentUserId,
  employees,
  initialSettings,
  logs,
  assignments,
}: PayrollClientProps) {
  const [activeTab, setActiveTab] = useState<'run' | 'settings'>('run')
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString)
  const [settingsList, setSettingsList] = useState<EmployeePayrollSetting[]>(initialSettings)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Inline edit state for Settings tab: map of userId -> { base_salary, overtime_rate_per_hour, active }
  const [editableSettings, setEditableSettings] = useState<
    Record<string, { base_salary: number; overtime_rate_per_hour: number; active: boolean }>
  >(() => {
    const map: Record<
      string,
      { base_salary: number; overtime_rate_per_hour: number; active: boolean }
    > = {}
    employees.forEach((emp) => {
      const existing = initialSettings.find((s) => s.user_id === emp.id)
      map[emp.id] = {
        base_salary: existing ? Number(existing.base_salary) : 0,
        overtime_rate_per_hour: existing ? Number(existing.overtime_rate_per_hour) : 0,
        active: existing ? existing.active : true,
      }
    })
    return map
  })
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false)

  // Compute payroll items for the current selected month
  const payrollItems: PayrollRunItem[] = useMemo(() => {
    return computeMonthlyPayroll(selectedMonth, employees, settingsList, logs, assignments)
  }, [selectedMonth, employees, settingsList, logs, assignments])

  // Aggregate stats
  const payrollStats = useMemo(() => {
    const totalPayroll = payrollItems.reduce((acc, p) => acc + p.totalSalary, 0)
    const totalOtPay = payrollItems.reduce((acc, p) => acc + p.otPay, 0)
    const totalOtHours = payrollItems.reduce((acc, p) => acc + p.otHours, 0)
    const activeEmployees = payrollItems.filter((p) => p.active).length
    return {
      totalPayroll,
      totalOtPay,
      totalOtHours: Number(totalOtHours.toFixed(1)),
      activeEmployees,
    }
  }, [payrollItems])

  // Single employee record if non-admin
  const myPayrollItem = useMemo(() => {
    return payrollItems.find((p) => p.userId === currentUserId) || null
  }, [payrollItems, currentUserId])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

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

  // Inline edit handlers
  const handleSettingChange = (
    userId: string,
    field: 'base_salary' | 'overtime_rate_per_hour' | 'active',
    value: any
  ) => {
    setEditableSettings((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }))
    setHasSettingsChanges(true)
  }

  // Save Settings Action
  const handleSaveSettings = () => {
    setFeedback(null)
    startTransition(async () => {
      const payload = Object.entries(editableSettings).map(([userId, data]) => ({
        user_id: userId,
        base_salary: data.base_salary,
        overtime_rate_per_hour: data.overtime_rate_per_hour,
        active: data.active,
      }))

      const res = await saveBulkPayrollSettingsAction(companyId, slug, payload)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setHasSettingsChanges(false)
        setSettingsList(
          payload.map((p) => ({
            company_id: companyId,
            user_id: p.user_id,
            base_salary: p.base_salary,
            overtime_rate_per_hour: p.overtime_rate_per_hour,
            active: p.active,
          }))
        )
        showNotification('success', 'Pengaturan gaji karyawan berhasil disimpan.')
      }
    })
  }

  const handleExportCsv = () => {
    exportPayrollRunToCsv(payrollItems, selectedMonth, slug)
  }

  // Pro Gating View
  if (!isProOrTrial) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
            Payroll-Lite
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            AUTOMATIC PAYROLL CALCULATION & SALARY SLIP ENGINE
          </p>
        </div>

        <div className="liquid-glass max-w-2xl mx-auto my-12 p-8 border border-primary/20 rounded-xl text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-sans uppercase text-gray-900">
              Fitur Payroll-Lite Tersedia di Paket Pro
            </h2>
            <p className="text-xs text-gray-600 font-sans max-w-md mx-auto leading-relaxed">
              Kompilasi gaji bulanan otomatis dari rekap absensi dan jam lembur karyawan tanpa rumus Excel rumit. Cetak slip gaji instan dengan upgrade ke paket Pro.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/${slug}/billing`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" /> Upgrade ke Paket Pro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
            Payroll-Lite
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            AUTOMATIC PAYROLL ENGINE & SALARY BREAKDOWN
          </p>
        </div>

        {/* Tab Controls (Only for Admin/Manager) */}
        {isAdminOrManager && (
          <div className="flex items-center gap-2 bg-surface p-1 border border-border rounded-lg">
            <button
              onClick={() => setActiveTab('run')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer ${
                activeTab === 'run'
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" /> Hitung Gaji
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Pengaturan Gaji
            </button>
          </div>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs font-mono flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EMPLOYEE ONLY VIEW: PERSONAL PAYSLIP SUMMARY                          */}
      {/* ==================================================================== */}
      {!isAdminOrManager && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Month Selector */}
          <div className="liquid-glass p-4 border border-border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 border border-border rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <span className="font-mono text-xs font-bold text-gray-800">
                {formatMonthDisplay(selectedMonth)}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 border border-border rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {myPayrollItem && (
              <Link
                href={`/${slug}/payroll/slip/${currentUserId}?month=${selectedMonth}`}
                target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-mono uppercase font-bold rounded-md transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Slip Gaji
              </Link>
            )}
          </div>

          {/* Payslip Card */}
          {myPayrollItem ? (
            <div className="liquid-glass p-6 border border-border rounded-xl space-y-6 shadow-sm bg-white">
              <div className="border-b border-border pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase">
                    SLIP GAJI BULANAN // APEX
                  </span>
                  <h2 className="text-xl font-bold font-sans uppercase text-gray-900 mt-1">
                    {myPayrollItem.fullName}
                  </h2>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">
                    Periode: {formatMonthDisplay(selectedMonth)}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 font-mono text-xs font-bold border border-green-200 uppercase">
                  {myPayrollItem.daysPresent} Hari Hadir
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Gaji Pokok:</span>
                  <span className="font-bold text-gray-900">
                    {formatRupiah(myPayrollItem.baseSalary)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">
                    Upah Lembur ({myPayrollItem.otHours} jam @ {formatRupiah(myPayrollItem.otRatePerHour)}/jam):
                  </span>
                  <span className="font-semibold text-primary">
                    + {formatRupiah(myPayrollItem.otPay)}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-border text-sm font-bold text-gray-900">
                  <span>TOTAL GAJI DITERIMA:</span>
                  <span className="text-primary text-base">
                    {formatRupiah(myPayrollItem.totalSalary)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 font-mono text-xs border border-border rounded-lg bg-surface">
              Data slip gaji Anda untuk periode {formatMonthDisplay(selectedMonth)} belum tersedia.
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADMIN TAB 1: RUN PAYROLL                                             */}
      {/* ==================================================================== */}
      {isAdminOrManager && activeTab === 'run' && (
        <div className="space-y-6">
          {/* Controls Bar: Month Picker & Export CSV */}
          <div className="liquid-glass p-4 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            <button
              onClick={handleExportCsv}
              disabled={payrollItems.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Payroll CSV
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="liquid-glass p-4 border border-border rounded-lg">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                Total Gaji Bersih
              </span>
              <div className="mt-1">
                <span className="text-xl font-mono font-bold text-gray-900">
                  {formatRupiah(payrollStats.totalPayroll)}
                </span>
              </div>
            </div>

            <div className="liquid-glass p-4 border border-border rounded-lg">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                Total Upah Lembur
              </span>
              <div className="mt-1">
                <span className="text-xl font-mono font-bold text-primary">
                  {formatRupiah(payrollStats.totalOtPay)}
                </span>
              </div>
            </div>

            <div className="liquid-glass p-4 border border-border rounded-lg">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                Total Jam Lembur
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-bold text-gray-900">
                  {payrollStats.totalOtHours}
                </span>
                <span className="text-[10px] font-mono text-gray-400">jam</span>
              </div>
            </div>

            <div className="liquid-glass p-4 border border-border rounded-lg">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                Karyawan Terhitung
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-bold text-gray-900">
                  {payrollStats.activeEmployees}
                </span>
                <span className="text-[10px] font-mono text-gray-400">orang</span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="liquid-glass border border-border rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="p-4 border-b border-border bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-sans uppercase text-gray-900">
                  Rincian Kompilasi Gaji Karyawan — {formatMonthDisplay(selectedMonth)}
                </h3>
                <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                  GAJI POKOK + (JAM LEMBUR x TARIF/JAM) = TOTAL GAJI
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-border text-[11px] font-mono text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Karyawan</th>
                    <th className="py-3 px-3 text-right">Gaji Pokok</th>
                    <th className="py-3 px-3 text-center">Jam Lembur</th>
                    <th className="py-3 px-3 text-right">Tarif OT / Jam</th>
                    <th className="py-3 px-3 text-right">Upah Lembur</th>
                    <th className="py-3 px-4 text-right">Total Gaji</th>
                    <th className="py-3 px-4 text-center">Slip Gaji</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border font-mono">
                  {payrollItems.map((item) => (
                    <tr key={item.userId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-gray-900">
                        <div>{item.fullName}</div>
                        <div className="text-[10px] font-mono text-gray-400">
                          {item.daysPresent} Hari Hadir
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right text-gray-700">
                        {formatRupiah(item.baseSalary)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {item.otHours > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-primary border border-primary/20 font-bold text-[10px]">
                            {item.otHours} jam
                          </span>
                        ) : (
                          <span className="text-gray-400">0 jam</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right text-gray-600">
                        {formatRupiah(item.otRatePerHour)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-primary">
                        + {formatRupiah(item.otPay)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 text-sm">
                        {formatRupiah(item.totalSalary)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/${slug}/payroll/slip/${item.userId}?month=${selectedMonth}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-gray-100 border border-border rounded text-[10px] font-mono uppercase text-gray-700 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Lihat Slip</span>
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {payrollItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-mono text-xs">
                        Belum ada karyawan terdaftar di workspace ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADMIN TAB 2: PAYROLL SETTINGS                                        */}
      {/* ==================================================================== */}
      {isAdminOrManager && activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="liquid-glass p-4 border border-border rounded-lg flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase text-gray-500">
                PENGATURAN BESARAN GAJI KARYAWAN
              </h2>
              <p className="text-[11px] text-gray-600 font-sans mt-0.5">
                Masukkan besaran Gaji Pokok bulanan dan Tarif Lembur per jam (Rp). Perubahan dapat disimpan sekaligus.
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isPending || !hasSettingsChanges}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-mono uppercase rounded-md font-bold transition-all cursor-pointer ${
                hasSettingsChanges
                  ? 'bg-primary hover:bg-primary-hover text-white shadow-sm hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isPending ? 'Menyimpan...' : hasSettingsChanges ? 'Simpan Pengaturan' : 'Tersimpan'}
            </button>
          </div>

          <div className="liquid-glass border border-border rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-border text-[11px] font-mono text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Karyawan</th>
                    <th className="py-3 px-4">Gaji Pokok Bulanan (Rp)</th>
                    <th className="py-3 px-4">Tarif Lembur / Jam (Rp)</th>
                    <th className="py-3 px-4 text-center">Status Payroll</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {employees.map((emp) => {
                    const setting = editableSettings[emp.id] || {
                      base_salary: 0,
                      overtime_rate_per_hour: 0,
                      active: true,
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-gray-900">
                          {emp.full_name}
                        </td>

                        {/* Base Salary Input */}
                        <td className="py-3 px-4">
                          <div className="relative max-w-xs">
                            <span className="absolute left-3 top-2 text-xs text-gray-400 font-mono">
                              Rp
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="50000"
                              value={setting.base_salary}
                              onChange={(e) =>
                                handleSettingChange(emp.id, 'base_salary', Number(e.target.value))
                              }
                              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-gray-800 bg-white"
                            />
                          </div>
                        </td>

                        {/* Overtime Rate Input */}
                        <td className="py-3 px-4">
                          <div className="relative max-w-xs">
                            <span className="absolute left-3 top-2 text-xs text-gray-400 font-mono">
                              Rp
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="5000"
                              value={setting.overtime_rate_per_hour}
                              onChange={(e) =>
                                handleSettingChange(
                                  emp.id,
                                  'overtime_rate_per_hour',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-gray-800 bg-white"
                            />
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleSettingChange(emp.id, 'active', !setting.active)
                            }
                            className={`px-3 py-1 rounded font-mono text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                              setting.active
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            {setting.active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
