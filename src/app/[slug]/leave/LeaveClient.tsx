'use client'

import { useState, useTransition } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  UserCheck,
} from 'lucide-react'
import {
  createLeaveRequestAction,
  decideLeaveRequestAction,
  LeaveRequest,
} from '@/lib/leave-actions'

interface LeaveClientProps {
  slug: string
  companyId: string
  isAdminOrManager: boolean
  currentUserId: string
  initialRequests: LeaveRequest[]
}

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function LeaveClient({
  slug,
  companyId,
  isAdminOrManager,
  currentUserId,
  initialRequests,
}: LeaveClientProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form State
  const [leaveType, setLeaveType] = useState<string>('cuti')
  const [startDate, setStartDate] = useState<string>(getTodayString())
  const [endDate, setEndDate] = useState<string>(getTodayString())
  const [reason, setReason] = useState<string>('')

  // Tab State for Admin/Manager
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'my'>('all')

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    startTransition(async () => {
      const res = await createLeaveRequestAction(companyId, slug, {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || undefined,
      })

      if (res.error) {
        showNotification('error', res.error)
      } else if (res.leaveRequest) {
        setRequests((prev) => [res.leaveRequest as LeaveRequest, ...prev])
        setReason('')
        showNotification('success', 'Pengajuan cuti/izin berhasil dikirim.')
      }
    })
  }

  const handleDecision = (requestId: string, decision: 'approved' | 'rejected') => {
    setFeedback(null)

    startTransition(async () => {
      const res = await decideLeaveRequestAction(companyId, slug, requestId, decision)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: decision,
                  decided_by: currentUserId,
                  decided_at: new Date().toISOString(),
                }
              : r
          )
        )
        showNotification(
          'success',
          decision === 'approved'
            ? 'Pengajuan cuti berhasil disetujui.'
            : 'Pengajuan cuti telah ditolak.'
        )
      }
    })
  }

  // Filter requests based on tab
  const displayedRequests = requests.filter((r) => {
    if (filterTab === 'my') return r.user_id === currentUserId
    if (filterTab === 'pending') return r.status === 'pending'
    return true
  })

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'DISETUJUI'
      case 'rejected':
        return 'DITOLAK'
      case 'pending':
      default:
        return 'MENUNGGU'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cuti':
        return 'Cuti Tahunan'
      case 'izin':
        return 'Izin Keperluan'
      case 'sakit':
        return 'Sakit'
      default:
        return type.toUpperCase()
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
          Cuti & Izin
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          PENGAJUAN CUTI, IZIN, DAN SAKIT KARYAWAN DENGAN PERSETUJUAN
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Permohonan Cuti (Self-Service) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="border-b border-border pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                Formulir Pengajuan Cuti
              </h2>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                  Jenis Pengajuan
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs font-sans focus:outline-none focus:border-primary text-foreground bg-white"
                >
                  <option value="cuti">Cuti Tahunan</option>
                  <option value="izin">Izin Keperluan</option>
                  <option value="sakit">Sakit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={getTodayString()}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-foreground bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || getTodayString()}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-foreground bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                  Alasan / Keterangan (Maks. 500 Karakter)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Tuliskan keterangan pengajuan cuti atau izin Anda..."
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs font-sans focus:outline-none focus:border-primary text-foreground bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-mono uppercase font-bold rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-3.5 h-3.5" />
                {isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Daftar Riwayat & Antrean Persetujuan */}
        <div className="lg:col-span-8 space-y-6">
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                  Daftar Pengajuan Cuti & Izin
                </h2>
              </div>

              {/* Filter Tabs */}
              {isAdminOrManager && (
                <div className="flex items-center gap-1 bg-surface p-1 border border-border rounded-md">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 text-xs font-mono uppercase rounded transition-colors cursor-pointer ${
                      filterTab === 'all'
                        ? 'bg-primary text-white font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Semua ({requests.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('pending')}
                    className={`px-3 py-1 text-xs font-mono uppercase rounded transition-colors cursor-pointer ${
                      filterTab === 'pending'
                        ? 'bg-amber-500 text-white font-bold'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    Menunggu ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFilterTab('my')}
                    className={`px-3 py-1 text-xs font-mono uppercase rounded transition-colors cursor-pointer ${
                      filterTab === 'my'
                        ? 'bg-primary text-white font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Milik Saya
                  </button>
                </div>
              )}
            </div>

            {/* Table of Leave Requests */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                    {isAdminOrManager && <th className="py-2.5 px-3">Karyawan</th>}
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Rentang Tanggal</th>
                    <th className="py-2.5 px-3">Alasan</th>
                    <th className="py-2.5 px-3">Status</th>
                    {isAdminOrManager && <th className="py-2.5 px-3 text-right">Persetujuan</th>}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {displayedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      {isAdminOrManager && (
                        <td className="py-3 px-3">
                          <p className="font-sans font-semibold text-gray-900">
                            {req.user?.full_name || 'Karyawan'}
                          </p>
                          <p className="text-[11px] font-mono text-gray-400">{req.user?.email}</p>
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <span className="font-sans font-medium text-gray-800">
                          {getTypeLabel(req.leave_type)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-700 whitespace-nowrap">
                        {req.start_date} s/d {req.end_date}
                      </td>
                      <td className="py-3 px-3 font-sans text-gray-600 max-w-[200px] truncate" title={req.reason || ''}>
                        {req.reason || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase border font-bold ${getBadgeStyle(
                            req.status
                          )}`}
                        >
                          {getStatusLabel(req.status)}
                        </span>
                      </td>
                      {isAdminOrManager && (
                        <td className="py-3 px-3 text-right">
                          {req.status === 'pending' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleDecision(req.id, 'approved')}
                                disabled={isPending}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleDecision(req.id, 'rejected')}
                                disabled={isPending}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-gray-400">
                              {req.decided_at ? new Date(req.decided_at).toLocaleDateString('id-ID') : 'Selesai'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}

                  {displayedRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={isAdminOrManager ? 6 : 4}
                        className="py-10 text-center text-gray-400 font-mono text-xs"
                      >
                        Belum ada pengajuan cuti atau izin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
