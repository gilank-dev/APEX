export interface ShiftTemplateSummary {
  id?: string
  name: string
  start_time: string
  end_time: string
  overnight: boolean
}

export interface ShiftAssignmentSummary {
  user_id: string
  assignment_date: string
  shift_templates?: ShiftTemplateSummary | null
}

export interface AttendanceLogSummary {
  id: string
  user_id: string
  clock_in_time: string
  clock_out_time: string | null
}

export interface EmployeeSummary {
  id: string
  full_name: string
  email?: string
}

export interface EmployeeRecap {
  userId: string
  fullName: string
  totalDaysPresent: number
  lateCount: number
  lateMinutes: number
  overtimeHours: number
  absentDays: number
  totalHoursWorked: number
  hasMissingClockOut: boolean
  missingClockOutCount: number
}

// Extract YYYY-MM-DD from an ISO string or Date
export function getLocalDateString(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function computeMonthlyAttendanceRecap(
  month: string, // YYYY-MM
  employees: EmployeeSummary[],
  logs: AttendanceLogSummary[],
  assignments: ShiftAssignmentSummary[]
): EmployeeRecap[] {
  // Map assignments by `${user_id}_${assignment_date}`
  const assignmentMap = new Map<string, ShiftAssignmentSummary>()
  assignments.forEach((a) => {
    if (a.assignment_date.startsWith(month)) {
      assignmentMap.set(`${a.user_id}_${a.assignment_date}`, a)
    }
  })

  // Group logs by employee
  const logsByUser = new Map<string, AttendanceLogSummary[]>()
  logs.forEach((log) => {
    const logDate = getLocalDateString(log.clock_in_time)
    if (logDate.startsWith(month)) {
      const list = logsByUser.get(log.user_id) || []
      list.push(log)
      logsByUser.set(log.user_id, list)
    }
  })

  // Compute recap for each employee
  return employees.map((emp) => {
    const userLogs = logsByUser.get(emp.id) || []
    const presentDates = new Set<string>()

    let lateCount = 0
    let lateMinutes = 0
    let overtimeHours = 0
    let totalHoursWorked = 0
    let missingClockOutCount = 0

    userLogs.forEach((log) => {
      const logDate = getLocalDateString(log.clock_in_time)
      presentDates.add(logDate)

      const clockIn = new Date(log.clock_in_time)
      const assignment = assignmentMap.get(`${emp.id}_${logDate}`)

      // Late calculation: based on clock_in vs assigned shift start, tolerance 10 min
      if (assignment?.shift_templates?.start_time) {
        const [startH, startM] = assignment.shift_templates.start_time.split(':').map(Number)
        const shiftStart = new Date(
          clockIn.getFullYear(),
          clockIn.getMonth(),
          clockIn.getDate(),
          startH,
          startM,
          0,
          0
        )
        const diffMinutes = (clockIn.getTime() - shiftStart.getTime()) / (60 * 1000)

        // Tolerance: 10 minutes
        if (diffMinutes > 10) {
          lateCount++
          lateMinutes += Math.round(diffMinutes)
        }
      }

      // Hours worked & missing clock out
      if (!log.clock_out_time) {
        missingClockOutCount++
      } else {
        const clockOut = new Date(log.clock_out_time)
        const durationHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
        if (durationHours > 0) {
          totalHoursWorked += durationHours
        }

        // Overtime calculation: clock_out beyond shift end, when assigned; 0 when no shift
        if (assignment?.shift_templates?.end_time) {
          const [endH, endM] = assignment.shift_templates.end_time.split(':').map(Number)
          const isOvernight =
            assignment.shift_templates.overnight ||
            assignment.shift_templates.end_time < assignment.shift_templates.start_time

          const shiftEnd = new Date(
            clockIn.getFullYear(),
            clockIn.getMonth(),
            clockIn.getDate(),
            endH,
            endM,
            0,
            0
          )
          if (isOvernight) {
            shiftEnd.setDate(shiftEnd.getDate() + 1)
          }

          const otDiffHours = (clockOut.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60)
          if (otDiffHours > 0) {
            overtimeHours += otDiffHours
          }
        }
      }
    })

    // Absent calculation: assigned shifts with no log
    let absentDays = 0
    assignments.forEach((a) => {
      if (a.user_id === emp.id && a.assignment_date.startsWith(month) && a.shift_templates) {
        if (!presentDates.has(a.assignment_date)) {
          absentDays++
        }
      }
    })

    return {
      userId: emp.id,
      fullName: emp.full_name,
      totalDaysPresent: presentDates.size,
      lateCount,
      lateMinutes,
      overtimeHours: Number(overtimeHours.toFixed(1)),
      absentDays,
      totalHoursWorked: Number(totalHoursWorked.toFixed(1)),
      hasMissingClockOut: missingClockOutCount > 0,
      missingClockOutCount,
    }
  })
}

// Generate and trigger download of CSV with UTF-8 BOM and semicolon delimiter
export function exportAttendanceRecapToCsv(
  recap: EmployeeRecap[],
  month: string,
  companySlug: string
) {
  const headers = [
    'Nama Karyawan',
    'Bulan',
    'Hari Hadir',
    'Hari Mangkir (Alpha)',
    'Frekuensi Terlambat (kali)',
    'Total Keterlambatan (menit)',
    'Total Jam Lembur',
    'Total Jam Kerja',
    'Catatan Log',
  ]

  const rows = recap.map((item) => [
    `"${item.fullName.replace(/"/g, '""')}"`,
    month,
    item.totalDaysPresent,
    item.absentDays,
    item.lateCount,
    item.lateMinutes,
    item.overtimeHours.toLocaleString('id-ID'),
    item.totalHoursWorked.toLocaleString('id-ID'),
    item.hasMissingClockOut
      ? `"${item.missingClockOutCount} log tanpa clock out (dihitung 0 jam)"`
      : '"Lengkap"',
  ])

  const csvContent =
    '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `rekap-absensi-${companySlug}-${month}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
