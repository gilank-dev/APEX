'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowLeftRight,
} from 'lucide-react'
import {
  createShiftTemplateAction,
  updateShiftTemplateAction,
  deleteShiftTemplateAction,
  saveWeeklyRosterAction,
  seedDefaultShiftTemplatesAction,
  createSwapRequestAction,
  decideSwapRequestAction,
  cancelSwapRequestAction,
} from '@/lib/shift-actions'

export interface ShiftTemplate {
  id: string
  company_id: string
  name: string
  start_time: string
  end_time: string
  overnight: boolean
  created_at: string
}

export interface ShiftAssignment {
  id: string
  company_id: string
  user_id: string
  shift_template_id: string
  assignment_date: string
  shift_templates?: ShiftTemplate
}

export interface ShiftSwapRequest {
  id: string
  company_id: string
  requester_id: string
  target_id: string
  requester_assignment_id: string
  target_assignment_id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  decided_by: string | null
  decided_at: string | null
  created_at: string
}

export interface Employee {
  id: string
  full_name: string
  email?: string
  roles?: {
    name: string
    is_admin: boolean
  }
}

interface ShiftsClientProps {
  slug: string
  companyId: string
  isProOrTrial: boolean
  isAdminOrManager: boolean
  currentUserId?: string
  initialTemplates: ShiftTemplate[]
  employees: Employee[]
  initialAssignments: ShiftAssignment[]
  initialSwaps?: ShiftSwapRequest[]
}

function isOvernightShift(startTime: string, endTime: string): boolean {
  return endTime < startTime
}

// Helpers for ISO date string YYYY-MM-DD
function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
  date.setHours(0, 0, 0, 0)
  date.setDate(diff)
  return date
}

export default function ShiftsClient({
  slug,
  companyId,
  isProOrTrial,
  isAdminOrManager,
  currentUserId,
  initialTemplates,
  employees,
  initialAssignments,
  initialSwaps,
}: ShiftsClientProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'templates' | 'swaps'>('roster')
  const [templates, setTemplates] = useState<ShiftTemplate[]>(initialTemplates)
  const [swaps, setSwaps] = useState<ShiftSwapRequest[]>(initialSwaps || [])
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // --- Swap State ---
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [selectedReqAssignment, setSelectedReqAssignment] = useState<ShiftAssignment | null>(null)
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [targetAssignmentId, setTargetAssignmentId] = useState<string>('')

  // --- Roster State ---
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()))
  // Key: `${userId}_${dateStr}` -> templateId (or empty string for OFF)
  const [rosterGrid, setRosterGrid] = useState<Record<string, string>>(() => {
    const grid: Record<string, string> = {}
    initialAssignments.forEach((a) => {
      grid[`${a.user_id}_${a.assignment_date}`] = a.shift_template_id
    })
    return grid
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // --- Template Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null)
  const [formName, setFormName] = useState('')
  const [formStartTime, setFormStartTime] = useState('07:00')
  const [formEndTime, setFormEndTime] = useState('15:00')

  // Week days array (Monday through Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(currentMonday)
    day.setDate(currentMonday.getDate() + i)
    return day
  })

  const dayNamesIndo = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

  // Paginated employees
  const totalEmployees = employees.length
  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize))
  const paginatedEmployees = employees.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  // --- Week navigation ---
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday)
    prev.setDate(prev.getDate() - 7)
    setCurrentMonday(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(currentMonday)
    next.setDate(next.getDate() + 7)
    setCurrentMonday(next)
  }

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()))
  }

  // --- Cell Assignment Change ---
  const handleCellChange = (userId: string, dateStr: string, templateId: string) => {
    if (!isAdminOrManager) return
    setRosterGrid((prev) => ({
      ...prev,
      [`${userId}_${dateStr}`]: templateId,
    }))
    setHasUnsavedChanges(true)
  }

  // --- Save Weekly Roster ---
  const handleSaveRoster = () => {
    setFeedback(null)
    startTransition(async () => {
      // Build assignment list for current week
      const assignments = []
      for (const emp of employees) {
        for (const day of weekDays) {
          const dateStr = toDateString(day)
          const key = `${emp.id}_${dateStr}`
          const tId = rosterGrid[key] || null
          assignments.push({
            user_id: emp.id,
            assignment_date: dateStr,
            shift_template_id: tId || null,
          })
        }
      }

      const res = await saveWeeklyRosterAction(companyId, slug, assignments)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setHasUnsavedChanges(false)
        showNotification('success', 'Jadwal roster mingguan berhasil disimpan.')
      }
    })
  }

  // --- Template Modal Open/Close ---
  const handleOpenCreateModal = () => {
    setEditingTemplate(null)
    setFormName('')
    setFormStartTime('07:00')
    setFormEndTime('15:00')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (tmpl: ShiftTemplate) => {
    setEditingTemplate(tmpl)
    setFormName(tmpl.name)
    setFormStartTime(tmpl.start_time.slice(0, 5))
    setFormEndTime(tmpl.end_time.slice(0, 5))
    setIsModalOpen(true)
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    startTransition(async () => {
      if (editingTemplate) {
        const res = await updateShiftTemplateAction(editingTemplate.id, companyId, slug, {
          name: formName,
          start_time: formStartTime,
          end_time: formEndTime,
        })
        if (res.error) {
          showNotification('error', res.error)
        } else {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === editingTemplate.id
                ? {
                    ...t,
                    name: formName.trim(),
                    start_time: formStartTime,
                    end_time: formEndTime,
                    overnight: isOvernightShift(formStartTime, formEndTime),
                  }
                : t
            )
          )
          setIsModalOpen(false)
          showNotification('success', 'Template shift berhasil diperbarui.')
        }
      } else {
        const res = await createShiftTemplateAction(companyId, slug, {
          name: formName,
          start_time: formStartTime,
          end_time: formEndTime,
        })
        if (res.error) {
          showNotification('error', res.error)
        } else if (res.template) {
          setTemplates((prev) => [...prev, res.template!])
          setIsModalOpen(false)
          showNotification('success', 'Template shift baru berhasil ditambahkan.')
        }
      }
    })
  }

  const handleDeleteTemplate = (templateId: string, name: string) => {
    if (!confirm(`Hapus template shift "${name}"? Assignment yang menggunakan template ini akan terhapus.`)) {
      return
    }

    startTransition(async () => {
      const res = await deleteShiftTemplateAction(templateId, companyId, slug)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId))
        showNotification('success', `Template shift "${name}" telah dihapus.`)
      }
    })
  }

  const handleSeedDefaults = () => {
    startTransition(async () => {
      const res = await seedDefaultShiftTemplatesAction(companyId, slug)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        showNotification('success', 'Default template shift berhasil dimuat.')
        window.location.reload()
      }
    })
  }

  // --- Swap Handlers ---
  const handleOpenSwapModal = (assignment: ShiftAssignment) => {
    setSelectedReqAssignment(assignment)
    setTargetUserId('')
    setTargetAssignmentId('')
    setIsSwapModalOpen(true)
  }

  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReqAssignment || !targetUserId || !targetAssignmentId) return

    startTransition(async () => {
      const res = await createSwapRequestAction(
        companyId,
        slug,
        targetUserId,
        selectedReqAssignment.id,
        targetAssignmentId
      )
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setIsSwapModalOpen(false)
        showNotification('success', 'Permintaan tukar shift berhasil dikirim.')
        window.location.reload()
      }
    })
  }

  const handleDecideSwap = (swapId: string, decision: 'approved' | 'rejected') => {
    startTransition(async () => {
      const res = await decideSwapRequestAction(companyId, slug, swapId, decision)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setSwaps((prev) =>
          prev.map((s) =>
            s.id === swapId
              ? {
                  ...s,
                  status: decision,
                  decided_by: currentUserId || null,
                  decided_at: new Date().toISOString(),
                }
              : s
          )
        )
        showNotification(
          'success',
          decision === 'approved'
            ? 'Pertukaran shift berhasil disetujui.'
            : 'Pertukaran shift telah ditolak.'
        )
        if (decision === 'approved') {
          window.location.reload()
        }
      }
    })
  }

  const handleCancelSwap = (swapId: string) => {
    startTransition(async () => {
      const res = await cancelSwapRequestAction(companyId, slug, swapId)
      if (res.error) {
        showNotification('error', res.error)
      } else {
        setSwaps((prev) =>
          prev.map((s) => (s.id === swapId ? { ...s, status: 'cancelled' } : s))
        )
        showNotification('success', 'Permintaan tukar shift berhasil dibatalkan.')
      }
    })
  }

  // --- Pro Gate Banner if company is Free and not in trial ---
  if (!isProOrTrial) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
            Jadwal Shift & Roster
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            ROSTER SCHEDULING AND SHIFT TEMPLATE MANAGEMENT
          </p>
        </div>

        <div className="liquid-glass max-w-2xl mx-auto my-12 p-8 border border-primary/20 rounded-xl text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-sans uppercase text-gray-900">
              Fitur Jadwal Shift Tersedia di Paket Pro
            </h2>
            <p className="text-xs text-gray-600 font-sans max-w-md mx-auto leading-relaxed">
              Atur shift bergilir (Pagi, Siang, Malam), buat jadwal mingguan karyawan tanpa batas, dan rekap jam kerja otomatis dengan upgrade ke paket Pro.
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
            Jadwal Shift & Roster
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            WEEKLY SHIFT SCHEDULING AND TEMPLATE ROSTER ENGINE
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-surface p-1 border border-border rounded-lg">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Roster Mingguan
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Template Shift ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`px-4 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer ${
              activeTab === 'swaps'
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Tukar Shift {swaps.filter((s) => s.status === 'pending').length > 0 ? `(${swaps.filter((s) => s.status === 'pending').length})` : ''}
          </button>
        </div>
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
      {/* TAB 1: WEEKLY ROSTER GRID                                            */}
      {/* ==================================================================== */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Week Navigation & Save Bar */}
          <div className="liquid-glass p-4 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 border border-border rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="px-3 py-1.5 border border-border rounded-md text-xs font-mono uppercase hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Minggu Ini
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1.5 border border-border rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                title="Minggu Selanjutnya"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>

              <div className="ml-2 font-mono text-xs font-semibold text-gray-800">
                {weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} —{' '}
                {weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {templates.length === 0 && (
                <button
                  onClick={handleSeedDefaults}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-mono uppercase bg-amber-50 text-amber-800 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Muat Template Bawaan (Pagi/Siang/Malam)
                </button>
              )}

              {isAdminOrManager && (
                <button
                  onClick={handleSaveRoster}
                  disabled={isPending || !hasUnsavedChanges}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase rounded-md font-bold transition-all cursor-pointer ${
                    hasUnsavedChanges
                      ? 'bg-primary hover:bg-primary-hover text-white shadow-sm hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isPending ? 'Menyimpan...' : hasUnsavedChanges ? 'Simpan Perubahan' : 'Tersimpan'}
                </button>
              )}
            </div>
          </div>

          {/* Weekly Roster Table */}
          <div className="liquid-glass border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-border text-[11px] font-mono text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-52 sticky left-0 bg-gray-50 z-10 border-r border-border">
                      Karyawan
                    </th>
                    {weekDays.map((day, idx) => {
                      const isToday = toDateString(day) === toDateString(new Date())
                      return (
                        <th
                          key={toDateString(day)}
                          className={`py-3 px-3 text-center border-r border-border last:border-r-0 ${
                            isToday ? 'bg-orange-50/50 text-primary font-bold' : ''
                          }`}
                        >
                          <div>{dayNamesIndo[idx]}</div>
                          <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                            {day.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-3 px-4 sticky left-0 bg-surface z-10 border-r border-border">
                        <div className="font-semibold text-gray-900 truncate">{emp.full_name}</div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">
                          {emp.roles?.name || 'Employee'}
                        </div>
                      </td>

                      {weekDays.map((day) => {
                        const dateStr = toDateString(day)
                        const key = `${emp.id}_${dateStr}`
                        const currentTemplateId = rosterGrid[key] || ''
                        const currentTmpl = templates.find((t) => t.id === currentTemplateId)

                        return (
                          <td
                            key={dateStr}
                            className="p-1.5 border-r border-border last:border-r-0 text-center align-middle"
                          >
                            {isAdminOrManager ? (
                              <select
                                value={currentTemplateId}
                                onChange={(e) => handleCellChange(emp.id, dateStr, e.target.value)}
                                className={`w-full py-1.5 px-2 text-[11px] font-mono rounded border transition-colors cursor-pointer text-center focus:outline-none focus:ring-1 focus:ring-primary ${
                                  !currentTemplateId
                                    ? 'bg-transparent border-transparent text-gray-400 hover:border-gray-200'
                                    : currentTmpl?.overnight
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
                                    : currentTmpl?.name.toLowerCase().includes('pagi')
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
                                }`}
                              >
                                <option value="">— OFF —</option>
                                {templates.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.start_time.slice(0, 5)}-{t.end_time.slice(0, 5)})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div
                                className={`py-1.5 px-2 text-[11px] font-mono rounded text-center ${
                                  !currentTemplateId
                                    ? 'text-gray-400'
                                    : currentTmpl?.overnight
                                    ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                                    : currentTmpl?.name.toLowerCase().includes('pagi')
                                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                                }`}
                              >
                                {currentTmpl
                                  ? `${currentTmpl.name} (${currentTmpl.start_time.slice(0, 5)}-${currentTmpl.end_time.slice(0, 5)})`
                                  : 'OFF'}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {paginatedEmployees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 font-mono text-xs">
                        Belum ada karyawan terdaftar di workspace ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls if employees > 20 */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between font-mono text-xs text-gray-600 bg-gray-50/50">
                <div>
                  Halaman {currentPage} dari {totalPages} ({totalEmployees} Karyawan)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-border rounded bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-border rounded bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SHIFT TEMPLATES CRUD                                          */}
      {/* ==================================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                  Daftar Template Shift
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  DEFINISI JAM KERJA BERGILIR PERUSAHAAN
                </p>
              </div>

              <div className="flex items-center gap-3">
                {templates.length === 0 && (
                  <button
                    onClick={handleSeedDefaults}
                    disabled={isPending}
                    className="px-3 py-2 text-xs font-mono uppercase bg-amber-50 text-amber-800 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Seed Bawaan (Pagi, Siang, Malam)
                  </button>
                )}
                {isAdminOrManager && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-mono uppercase font-bold rounded-md transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" /> Tambah Template
                  </button>
                )}
              </div>
            </div>

            {/* Template List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Nama Shift</th>
                    <th className="py-2.5 px-3">Jam Masuk</th>
                    <th className="py-2.5 px-3">Jam Keluar</th>
                    <th className="py-2.5 px-3">Tipe Shift</th>
                    {isAdminOrManager && <th className="py-2.5 px-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {templates.map((tmpl) => (
                    <tr key={tmpl.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-sans font-semibold text-gray-900">
                        {tmpl.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-700">
                        {tmpl.start_time.slice(0, 5)} WIB
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-700">
                        {tmpl.end_time.slice(0, 5)} WIB
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase border ${
                            tmpl.overnight
                              ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {tmpl.overnight ? 'Lintas Hari (Overnight)' : 'Reguler'}
                        </span>
                      </td>
                      {isAdminOrManager && (
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(tmpl)}
                              className="p-1 text-gray-500 hover:text-primary transition-colors cursor-pointer"
                              title="Edit Template"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Hapus Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400 font-mono text-xs">
                        Belum ada template shift. Klik &quot;Tambah Template&quot; atau &quot;Seed Bawaan&quot;.
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
      {/* TAB 3: SHIFT SWAP (TUKAR SHIFT)                                       */}
      {/* ==================================================================== */}
      {activeTab === 'swaps' && (
        <div className="space-y-6">
          {/* Section: Pending Swaps for Manager / Admin */}
          {isAdminOrManager && (
            <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                    Antrean Persetujuan Tukar Shift (Admin / Manager)
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    PERSETUJUAN PERMINTAAN TUKAR SHIFT ANTAR KARYAWAN
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono text-xs font-bold">
                  {swaps.filter((s) => s.status === 'pending').length} Menunggu
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Pemohon</th>
                      <th className="py-2.5 px-3">Rekan Dituju</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Persetujuan</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-border">
                    {swaps
                      .filter((s) => s.status === 'pending')
                      .map((swap) => {
                        const reqEmp = employees.find((e) => e.id === swap.requester_id)
                        const tgtEmp = employees.find((e) => e.id === swap.target_id)
                        const reqAssign = initialAssignments.find((a) => a.id === swap.requester_assignment_id)
                        const tgtAssign = initialAssignments.find((a) => a.id === swap.target_assignment_id)
                        const reqTmpl = templates.find((t) => t.id === reqAssign?.shift_template_id)
                        const tgtTmpl = templates.find((t) => t.id === tgtAssign?.shift_template_id)

                        return (
                          <tr key={swap.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-3">
                              <p className="font-sans font-semibold text-gray-900">
                                {reqEmp?.full_name || 'Pemohon'}
                              </p>
                              <p className="text-[11px] font-mono text-gray-500">
                                {reqAssign?.assignment_date} ({reqTmpl?.name || 'Shift'})
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-sans font-semibold text-gray-900">
                                {tgtEmp?.full_name || 'Target'}
                              </p>
                              <p className="text-[11px] font-mono text-gray-500">
                                {tgtAssign?.assignment_date} ({tgtTmpl?.name || 'Shift'})
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                MENUNGGU
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDecideSwap(swap.id, 'approved')}
                                  disabled={isPending}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleDecideSwap(swap.id, 'rejected')}
                                  disabled={isPending}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}

                    {swaps.filter((s) => s.status === 'pending').length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 font-mono text-xs">
                          Tidak ada permohonan tukar shift yang menunggu persetujuan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section: Employee's Own Shifts This Week */}
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                Shift Saya Minggu Ini
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                PILIH SHIFT UNTUK MENGAJUKAN PERTUKARAN DENGAN REKAN KERJA
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {weekDays.map((day) => {
                const dateStr = toDateString(day)
                const currentAssign = initialAssignments.find(
                  (a) => a.user_id === currentUserId && a.assignment_date === dateStr
                )
                const tmpl = templates.find((t) => t.id === currentAssign?.shift_template_id)
                const dayIndex = (day.getDay() + 6) % 7 // Monday = 0

                return (
                  <div
                    key={dateStr}
                    className="p-3.5 border border-border rounded-lg bg-surface flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono text-gray-500 mb-1">
                        <span className="font-bold">{dayNamesIndo[dayIndex]}</span>
                        <span>{day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {tmpl ? (
                        <div className="mt-1">
                          <p className="font-sans font-bold text-sm text-foreground">{tmpl.name}</p>
                          <p className="font-mono text-xs text-gray-600">
                            {tmpl.start_time.slice(0, 5)} - {tmpl.end_time.slice(0, 5)} WIB
                          </p>
                        </div>
                      ) : (
                        <p className="font-mono text-xs text-gray-400 mt-2">Libur (OFF)</p>
                      )}
                    </div>

                    {tmpl && currentAssign && (
                      <button
                        onClick={() => handleOpenSwapModal(currentAssign)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-orange-50 text-primary border border-primary/30 rounded-md text-xs font-mono uppercase font-bold transition-all cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Minta Tukar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: Incoming Swaps (Requests waiting for current user's consent) */}
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                Permintaan Tukar Masuk (Menunggu Konfirmasi Anda)
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                REKAN KERJA MENGAJUKAN PERTUKARAN SHIFT DENGAN ANDA
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rekan Pengaju</th>
                    <th className="py-2.5 px-3">Shift Ditawarkan</th>
                    <th className="py-2.5 px-3">Shift Anda yang Diminta</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {swaps
                    .filter((s) => s.target_id === currentUserId && s.status === 'pending')
                    .map((swap) => {
                      const reqEmp = employees.find((e) => e.id === swap.requester_id)
                      const reqAssign = initialAssignments.find((a) => a.id === swap.requester_assignment_id)
                      const tgtAssign = initialAssignments.find((a) => a.id === swap.target_assignment_id)
                      const reqTmpl = templates.find((t) => t.id === reqAssign?.shift_template_id)
                      const tgtTmpl = templates.find((t) => t.id === tgtAssign?.shift_template_id)

                      return (
                        <tr key={swap.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 font-sans font-semibold text-gray-900">
                            {reqEmp?.full_name || 'Rekan Kerja'}
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-700">
                            {reqAssign?.assignment_date} ({reqTmpl?.name || 'Shift'})
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-700">
                            {tgtAssign?.assignment_date} ({tgtTmpl?.name || 'Shift'})
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleDecideSwap(swap.id, 'approved')}
                                disabled={isPending}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleDecideSwap(swap.id, 'rejected')}
                                disabled={isPending}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                  {swaps.filter((s) => s.target_id === currentUserId && s.status === 'pending').length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 font-mono text-xs">
                        Tidak ada permintaan tukar shift masuk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: History of My Swap Requests */}
          <div className="liquid-glass p-6 border border-border rounded-lg shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold font-sans uppercase text-gray-900">
                Riwayat Pengajuan Tukar Shift Saya
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                STATUS PERMINTAAN TUKAR SHIFT YANG PERNAH ANDA AJUKAN
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rekan Dituju</th>
                    <th className="py-2.5 px-3">Shift Saya</th>
                    <th className="py-2.5 px-3">Shift Rekan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {swaps
                    .filter((s) => s.requester_id === currentUserId)
                    .map((swap) => {
                      const tgtEmp = employees.find((e) => e.id === swap.target_id)
                      const reqAssign = initialAssignments.find((a) => a.id === swap.requester_assignment_id)
                      const tgtAssign = initialAssignments.find((a) => a.id === swap.target_assignment_id)
                      const reqTmpl = templates.find((t) => t.id === reqAssign?.shift_template_id)
                      const tgtTmpl = templates.find((t) => t.id === tgtAssign?.shift_template_id)

                      const badgeClass =
                        swap.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : swap.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : swap.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'

                      const statusLabel =
                        swap.status === 'approved'
                          ? 'DISETUJUI'
                          : swap.status === 'rejected'
                          ? 'DITOLAK'
                          : swap.status === 'cancelled'
                          ? 'DIBATALKAN'
                          : 'MENUNGGU'

                      return (
                        <tr key={swap.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 font-sans font-semibold text-gray-900">
                            {tgtEmp?.full_name || 'Rekan Kerja'}
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-700">
                            {reqAssign?.assignment_date} ({reqTmpl?.name || 'Shift'})
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-700">
                            {tgtAssign?.assignment_date} ({tgtTmpl?.name || 'Shift'})
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border ${badgeClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {swap.status === 'pending' && (
                              <button
                                onClick={() => handleCancelSwap(swap.id)}
                                disabled={isPending}
                                className="px-2.5 py-1 text-gray-600 hover:text-red-600 border border-border rounded font-mono text-[10px] uppercase transition-colors cursor-pointer"
                              >
                                Batalkan
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}

                  {swaps.filter((s) => s.requester_id === currentUserId).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 font-mono text-xs">
                        Anda belum pernah mengajukan tukar shift.
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
      {/* MODAL: ADD / EDIT TEMPLATE                                           */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold font-sans uppercase text-gray-900">
                {editingTemplate ? 'Edit Template Shift' : 'Tambah Template Shift Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-mono uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                  Nama Shift
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Pagi, Siang, Malam, Part-Time"
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs font-sans focus:outline-none focus:border-primary text-foreground bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-foreground bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-foreground bg-white"
                  />
                </div>
              </div>

              {/* Auto-detected overnight indicator */}
              <div className="p-3 bg-gray-50 border border-border rounded-md text-[11px] font-mono text-gray-600 flex items-center justify-between">
                <span>Deteksi Lintas Hari (Overnight):</span>
                {isOvernightShift(formStartTime, formEndTime) ? (
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                    YA (Melewati 24:00)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">TIDAK</span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase border border-border rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !formName.trim()}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-mono uppercase font-bold rounded-md transition-colors cursor-pointer"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: SWAP SHIFT DIALOG                                             */}
      {/* ==================================================================== */}
      {isSwapModalOpen && selectedReqAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold font-sans uppercase text-gray-900">
                Pengajuan Tukar Shift
              </h3>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-mono uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSwap} className="space-y-4">
              {/* Selected requester assignment details */}
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-md text-xs font-mono space-y-1">
                <p className="font-bold text-primary uppercase">Shift Anda yang Ditukar:</p>
                <p className="text-gray-700">Tanggal: {selectedReqAssignment.assignment_date}</p>
                <p className="text-gray-700">
                  Shift:{' '}
                  {templates.find((t) => t.id === selectedReqAssignment.shift_template_id)?.name || 'Shift'}
                  {' '}(
                  {templates.find((t) => t.id === selectedReqAssignment.shift_template_id)?.start_time.slice(0, 5)} -{' '}
                  {templates.find((t) => t.id === selectedReqAssignment.shift_template_id)?.end_time.slice(0, 5)} WIB)
                </p>
              </div>

              {/* Select target employee */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                  Pilih Rekan Kerja
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => {
                    setTargetUserId(e.target.value)
                    setTargetAssignmentId('')
                  }}
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs font-sans focus:outline-none focus:border-primary text-foreground bg-white"
                >
                  <option value="">— Pilih Rekan Kerja —</option>
                  {employees
                    .filter((emp) => emp.id !== currentUserId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Select target assignment */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-600 mb-1">
                  Pilih Shift Rekan Kerja (Minggu Ini)
                </label>
                <select
                  value={targetAssignmentId}
                  onChange={(e) => setTargetAssignmentId(e.target.value)}
                  required
                  disabled={isPending || !targetUserId}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs font-sans focus:outline-none focus:border-primary text-foreground bg-white"
                >
                  <option value="">— Pilih Shift Tujuan —</option>
                  {initialAssignments
                    .filter(
                      (a) =>
                        a.user_id === targetUserId &&
                        a.assignment_date !== selectedReqAssignment.assignment_date &&
                        !!a.shift_template_id
                    )
                    .map((a) => {
                      const tmpl = templates.find((t) => t.id === a.shift_template_id)
                      return (
                        <option key={a.id} value={a.id}>
                          {a.assignment_date} — {tmpl?.name || 'Shift'} ({tmpl?.start_time.slice(0, 5)}-{tmpl?.end_time.slice(0, 5)})
                        </option>
                      )
                    })}
                </select>
                {targetUserId &&
                  initialAssignments.filter(
                    (a) =>
                      a.user_id === targetUserId &&
                      a.assignment_date !== selectedReqAssignment.assignment_date &&
                      !!a.shift_template_id
                  ).length === 0 && (
                    <p className="text-[11px] text-amber-600 font-mono mt-1">
                      Rekan kerja ini tidak memiliki shift lain di tanggal berbeda minggu ini.
                    </p>
                  )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase border border-border rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !targetUserId || !targetAssignmentId}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-mono uppercase font-bold rounded-md transition-colors cursor-pointer"
                >
                  {isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
