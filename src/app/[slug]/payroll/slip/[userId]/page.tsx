// ponytail: no PPh21/BPJS — add when a paying customer asks

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeMonthlyPayroll, formatRupiah } from '@/lib/payroll'
import { ShiftAssignmentSummary } from '@/lib/attendance-recap'
import PrintButton from './PrintButton'

interface SlipPageProps {
  params: Promise<{ slug: string; userId: string }>
  searchParams: Promise<{ month?: string }>
}

function getCurrentMonthString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default async function PayslipPage({ params, searchParams }: SlipPageProps) {
  const { slug, userId } = await params
  const { month: qMonth } = await searchParams
  const month = qMonth || getCurrentMonthString()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current logged-in user profile
  const { data: currentProfile, error: profileError } = await supabase
    .from('users')
    .select('*, roles(*), companies(*)')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (profileError || !currentProfile) {
    redirect('/login')
  }

  const company = currentProfile.companies as any
  const role = currentProfile.roles as any

  if (company.slug !== slug) {
    redirect(`/${company.slug}/dashboard`)
  }

  const isAdminOrManager = !!role.is_admin || role.name === 'Manager'

  // Security check: Employee can only view their own slip
  if (!isAdminOrManager && currentProfile.id !== userId) {
    redirect(`/${slug}/payroll`)
  }

  // Fetch target employee profile
  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('id, full_name, email, roles(name)')
    .eq('id', userId)
    .eq('company_id', company.id)
    .maybeSingle()

  if (targetError || !targetUser) {
    notFound()
  }

  // Fetch target employee payroll setting
  const { data: settingData } = await supabase
    .from('employee_payroll_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', company.id)
    .maybeSingle()

  const setting = settingData || {
    company_id: company.id,
    user_id: userId,
    base_salary: 0,
    overtime_rate_per_hour: 0,
    active: true,
  }

  // Fetch attendance logs for target user in this month
  const [year, mNum] = month.split('-')
  const startDate = `${month}-01T00:00:00.000Z`
  const lastDay = new Date(Number(year), Number(mNum), 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`

  const { data: logsData } = await supabase
    .from('attendance_logs')
    .select('id, user_id, clock_in_time, clock_out_time')
    .eq('user_id', userId)
    .gte('clock_in_time', startDate)
    .lte('clock_in_time', endDate)

  const { data: assignData } = await supabase
    .from('shift_assignments')
    .select('user_id, assignment_date, shift_templates(name, start_time, end_time, overnight)')
    .eq('user_id', userId)
    .gte('assignment_date', `${month}-01`)
    .lte('assignment_date', `${month}-${String(lastDay).padStart(2, '0')}`)

  // ponytail: no PPh21/BPJS — add when a paying customer asks
  const payrollResults = computeMonthlyPayroll(
    month,
    [{ id: targetUser.id, full_name: targetUser.full_name, email: targetUser.email }],
    [setting as any],
    (logsData as any[]) || [],
    (assignData as unknown as ShiftAssignmentSummary[]) || []
  )

  const slip = payrollResults[0] || {
    fullName: targetUser.full_name,
    baseSalary: 0,
    otHours: 0,
    otRatePerHour: 0,
    otPay: 0,
    totalSalary: 0,
    daysPresent: 0,
  }

  const [y, m] = month.split('-').map(Number)
  const periodLabel = new Date(y, m - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans text-gray-900 print:bg-white print:p-0">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .printable-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <PrintButton backHref={`/${slug}/payroll`} />

        {/* Printable Slip Card */}
        <div className="printable-card bg-white border border-gray-300 rounded-lg p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-primary flex items-center justify-center rounded font-mono text-xs font-bold text-primary">
                  AP
                </div>
                <span className="font-mono text-lg font-extrabold uppercase tracking-wider text-gray-900">
                  {company.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-1">
                SYSTEM ID: {company.slug.toUpperCase()} // OFFICIAL PAYSLIP
              </p>
            </div>

            <div className="text-right">
              <h1 className="text-lg font-bold font-sans uppercase tracking-tight text-gray-900">
                Slip Gaji Karyawan
              </h1>
              <p className="text-xs font-mono font-semibold text-primary mt-0.5">
                Periode: {periodLabel}
              </p>
            </div>
          </div>

          {/* Employee Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-50 p-4 rounded border border-gray-200">
            <div>
              <span className="text-gray-500 uppercase text-[10px]">Nama Karyawan</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{targetUser.full_name}</p>
            </div>
            <div>
              <span className="text-gray-500 uppercase text-[10px]">Jabatan / Role</span>
              <p className="font-semibold text-gray-800 text-sm mt-0.5">
                {(targetUser.roles as any)?.name || 'Employee'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 uppercase text-[10px]">Email / Username</span>
              <p className="text-gray-700 mt-0.5">{targetUser.email || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 uppercase text-[10px]">Kehadiran Terverifikasi</span>
              <p className="font-bold text-green-700 mt-0.5">{slip.daysPresent} Hari Kerja</p>
            </div>
          </div>

          {/* Earnings Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200 pb-1">
              Rincian Pendapatan (Earnings)
            </h3>

            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-[10px] uppercase">
                  <th className="py-2 text-left">Komponen Gaji</th>
                  <th className="py-2 text-center">Kuantitas / Jam</th>
                  <th className="py-2 text-right">Tarif Satuan</th>
                  <th className="py-2 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 font-semibold text-gray-900">Gaji Pokok Bulanan</td>
                  <td className="py-3 text-center text-gray-500">1 Bulan</td>
                  <td className="py-3 text-right text-gray-500">{formatRupiah(slip.baseSalary)}</td>
                  <td className="py-3 text-right font-bold text-gray-900">{formatRupiah(slip.baseSalary)}</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-gray-900">
                    Upah Lembur (Overtime)
                  </td>
                  <td className="py-3 text-center text-primary font-bold">
                    {slip.otHours} Jam
                  </td>
                  <td className="py-3 text-right text-gray-500">
                    {formatRupiah(slip.otRatePerHour)}
                  </td>
                  <td className="py-3 text-right font-bold text-primary">
                    + {formatRupiah(slip.otPay)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay Box */}
          <div className="p-4 bg-orange-50/60 border border-primary/20 rounded-md flex justify-between items-center font-mono">
            <div>
              <span className="text-[10px] uppercase text-gray-600 font-bold tracking-wider">
                Total Gaji Diterima (Take Home Pay)
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                *Telah ditransfer atau dibayarkan sesuai kesepakatan
              </p>
            </div>
            <div className="text-xl font-extrabold text-primary">
              {formatRupiah(slip.totalSalary)}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-mono text-gray-600">
            <div>
              <p className="text-[10px] uppercase text-gray-400 mb-14">Penerima (Karyawan)</p>
              <div className="border-t border-gray-400 mx-8 pt-1">
                <p className="font-bold text-gray-900">{targetUser.full_name}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-400 mb-14">Disetujui Oleh (HR / Keuangan)</p>
              <div className="border-t border-gray-400 mx-8 pt-1">
                <p className="font-bold text-gray-900">{company.name}</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-gray-200 text-center text-[10px] font-mono text-gray-400">
            Dokumen ini dicetak secara resmi melalui sistem APEX HR SaaS (https://apex.lankdev.my.id) pada{' '}
            {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}.
          </div>
        </div>
      </div>
    </div>
  )
}
