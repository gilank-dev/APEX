'use client'

import { useState, useTransition } from 'react'
import {
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  CalendarClock,
  BadgeCheck,
} from 'lucide-react'
import {
  createKasbonRequestAction,
  decideKasbonRequestAction,
  markKasbonRepaymentPaidAction,
  KasbonRequest,
  KasbonRepayment,
} from '@/lib/kasbon-actions'

interface KasbonClientProps {
  slug: string
  companyId: string
  isAdminOrManager: boolean
  currentUserId: string
  initialRequests: KasbonRequest[]
  initialRepayments: KasbonRepayment[]
  members: { id: string; full_name: string }[]
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function KasbonClient({
  slug,
  companyId,
  isAdminOrManager,
  currentUserId,
  initialRequests,
  initialRepayments,
  members,
}: KasbonClientProps) {
  const [requests, setRequests] = useState<KasbonRequest[]>(initialRequests)
  const [repayments, setRepayments] = useState<KasbonRepayment[]>(initialRepayments)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [targetUserId, setTargetUserId] = useState(currentUserId)
  const [amount, setAmount] = useState('')
  const [installments, setInstallments] = useState('3')
  const [reason, setReason] = useState('')

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'mine'>('all')

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    startTransition(async () => {
      const res = await createKasbonRequestAction(companyId, slug, {
        user_id: targetUserId,
        amount: Number(amount),
        installment_count: Number(installments),
        reason: reason.trim() || undefined,
      })

      if (res.error) {
        showNotification('error', res.error)
      } else if (res.kasbon) {
        setRequests((prev) => [res.kasbon as KasbonRequest, ...prev])
        setAmount('')
        setReason('')
        showNotification('success', 'Pengajuan kasbon berhasil dikirim.')
      }
    })
  }

  const handleDecide = (kasbonId: string, decision: 'approved' | 'rejected') => {
    setFeedback(null)

    startTransition(async () => {
      const res = await decideKasbonRequestAction(companyId, slug, kasbonId, decision)

      if (res.error) {
        showNotification('error', res.error)
      } else {
        // Refresh state locally from the decision result
        setRequests((prev) =>
          prev.map((r) =>
            r.id === kasbonId
              ? { ...r, status: decision, decided_by: currentUserId, decided_at: new Date().toISOString() }
              : r
          )
        )
        if (decision === 'approved') {
          // Refetch repayments so the new schedule shows (simplest correct path)
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: fresh } = await supabase
            .from('kasbon_repayments')
            .select('*')
            .eq('company_id', companyId)
            .order('due_date', { ascending: true })
          if (fresh) setRepayments(fresh as KasbonRepayment[])
        }
        showNotification(
          'success',
          decision === 'approved' ? 'Kasbon disetujui. Jadwal cicilan otomatis dibuat.' : 'Pengajuan kasbon ditolak.'
        )
      }
    })
  }

  const handleTogglePaid = (repaymentId: string, currentlyPaid: boolean) => {
    setFeedback(null)

    startTransition(async () => {
      const res = await markKasbonRepaymentPaidAction(companyId, slug, repaymentId, !currentlyPaid)

      if (res.error) {
        showNotification('error', res.error)
      } else {
        setRepayments((prev) =>
          prev.map((r) =>
            r.id === repaymentId
              ? { ...r, paid_at: currentlyPaid ? null : new Date().toISOString() }
              : r
          )
        )
        showNotification('success', currentlyPaid ? 'Status cicilan dibatalkan.' : 'Cicilan tercatat lunas.')
      }
    })
  }

  const filtered = requests.filter((r) => {
    if (filterTab === 'pending') return r.status === 'pending'
    if (filterTab === 'mine') return r.user_id === currentUserId
    return true
  })

  const repaymentsFor = (kasbonId: string) => repayments.filter((r) => r.kasbon_id === kasbonId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
          Kasbon
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          PENGAJUAN KASBON KARYAWAN & JADWAL PEMBAYARAN CICILAN
        </p>
      </div>

      {/* Feedback */}
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
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="border-b border-border pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                Ajukan Kasbon
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isAdminOrManager && (
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">
                    Karyawan
                  </label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-white text-xs font-sans"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="cth: 1500000"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">
                  Jumlah Cicilan
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-white text-xs font-sans"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}x — {formatRupiah(Number(amount || 0) / n)} / bulan
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">
                  Alasan (opsional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="cth: biaya medis mendadak"
                  className="w-full px-3 py-2 border border-border rounded-md bg-white text-xs font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !amount}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Kirim Pengajuan
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            {(['all', 'pending', 'mine'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTab(t)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-mono uppercase border transition-colors ${
                  filterTab === t
                    ? 'bg-primary text-white border-primary font-bold'
                    : 'bg-white text-gray-600 border-border hover:border-primary/40'
                }`}
              >
                {t === 'all' ? 'Semua' : t === 'pending' ? 'Menunggu' : 'Milik Saya'}
              </button>
            ))}
          </div>

          {/* Requests */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="liquid-glass border border-border rounded-lg p-8 text-center">
                <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-mono uppercase">Belum ada pengajuan kasbon</p>
              </div>
            )}

            {filtered.map((k) => {
              const schedule = repaymentsFor(k.id)
              const paidCount = schedule.filter((r) => r.paid_at).length
              return (
                <div key={k.id} className="liquid-glass border border-border rounded-lg p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold font-sans text-gray-900">
                        {k.user?.full_name ?? 'Karyawan'}
                      </p>
                      <p className="text-xs font-mono text-gray-500">
                        {formatRupiah(Number(k.amount))} • {k.installment_count}x cicilan
                        {k.reason ? ` • ${k.reason}` : ''}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold ${
                        k.status === 'pending'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : k.status === 'approved'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : k.status === 'rejected'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-green-50 text-green-600 border border-green-200'
                      }`}
                    >
                      {k.status === 'pending'
                        ? 'Menunggu'
                        : k.status === 'approved'
                          ? 'Aktif'
                          : k.status === 'rejected'
                            ? 'Ditolak'
                            : 'Lunas'}
                    </span>
                  </div>

                  {/* Approve/Reject for pending (manager only) */}
                  {k.status === 'pending' && isAdminOrManager && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleDecide(k.id, 'approved')}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase rounded-md transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                      </button>
                      <button
                        onClick={() => handleDecide(k.id, 'rejected')}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase rounded-md transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}

                  {/* Installment schedule for approved */}
                  {(k.status === 'approved' || k.status === 'fully_repaid') && schedule.length > 0 && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5" /> Jadwal Cicilan
                        </p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {paidCount}/{schedule.length} lunas
                        </p>
                      </div>
                      {schedule.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between bg-gray-50 border border-border rounded-md px-3 py-2"
                        >
                          <div className="text-[11px] font-mono text-gray-600">
                            <span className="font-bold">{r.due_date}</span> — {formatRupiah(Number(r.amount))}
                          </div>
                          <button
                            onClick={() => handleTogglePaid(r.id, !!r.paid_at)}
                            disabled={isPending || !isAdminOrManager}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase border transition-colors disabled:opacity-40 cursor-pointer ${
                              r.paid_at
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-white text-gray-500 border-border hover:border-green-300'
                            }`}
                          >
                            <BadgeCheck className="w-3 h-3" />
                            {r.paid_at ? 'Lunas' : 'Tandai Bayar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
