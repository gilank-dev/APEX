// ponytail: no PPh21/BPJS — add when a paying customer asks

import {
  computeMonthlyAttendanceRecap,
  EmployeeSummary,
  AttendanceLogSummary,
  ShiftAssignmentSummary,
} from './attendance-recap'

export interface EmployeePayrollSetting {
  id?: string
  company_id: string
  user_id: string
  base_salary: number
  overtime_rate_per_hour: number
  active: boolean
}

export interface PayrollRunItem {
  userId: string
  fullName: string
  baseSalary: number
  otHours: number
  otRatePerHour: number
  otPay: number
  totalSalary: number
  daysPresent: number
  active: boolean
}

// Compute payroll for a company in a given month
export function computeMonthlyPayroll(
  month: string, // YYYY-MM
  employees: EmployeeSummary[],
  settings: EmployeePayrollSetting[],
  logs: AttendanceLogSummary[],
  assignments: ShiftAssignmentSummary[]
): PayrollRunItem[] {
  // Map settings by user_id
  const settingsMap = new Map<string, EmployeePayrollSetting>()
  settings.forEach((s) => settingsMap.set(s.user_id, s))

  // 1. Get recap attendance OT hours from Job 2 logic
  const attendanceRecap = computeMonthlyAttendanceRecap(month, employees, logs, assignments)
  const recapMap = new Map<string, { otHours: number; daysPresent: number }>()
  attendanceRecap.forEach((r) => {
    recapMap.set(r.userId, { otHours: r.overtimeHours, daysPresent: r.totalDaysPresent })
  })

  // 2. Compute payroll per employee
  // ponytail: no PPh21/BPJS — add when a paying customer asks
  return employees.map((emp) => {
    const setting = settingsMap.get(emp.id)
    const baseSalary = setting ? Number(setting.base_salary) : 0
    const otRate = setting ? Number(setting.overtime_rate_per_hour) : 0
    const active = setting ? setting.active : true

    const recap = recapMap.get(emp.id) || { otHours: 0, daysPresent: 0 }
    const otHours = recap.otHours
    const otPay = Math.round(otHours * otRate)
    const totalSalary = Math.round(baseSalary + otPay)

    return {
      userId: emp.id,
      fullName: emp.full_name,
      baseSalary,
      otHours,
      otRatePerHour: otRate,
      otPay,
      totalSalary,
      daysPresent: recap.daysPresent,
      active,
    }
  })
}

// Format Rupiah currency
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Export payroll run table to CSV
export function exportPayrollRunToCsv(
  items: PayrollRunItem[],
  month: string,
  companySlug: string
) {
  const headers = [
    'Nama Karyawan',
    'Bulan',
    'Hari Hadir',
    'Gaji Pokok (Rp)',
    'Jam Lembur',
    'Tarif Lembur per Jam (Rp)',
    'Upah Lembur (Rp)',
    'Total Gaji (Rp)',
    'Status Karyawan',
  ]

  const rows = items.map((item) => [
    `"${item.fullName.replace(/"/g, '""')}"`,
    month,
    item.daysPresent,
    item.baseSalary,
    item.otHours.toLocaleString('id-ID'),
    item.otRatePerHour,
    item.otPay,
    item.totalSalary,
    item.active ? '"Aktif"' : '"Nonaktif"',
  ])

  const csvContent =
    '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `payroll-${companySlug}-${month}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
