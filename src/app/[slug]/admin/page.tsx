'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  updateModulesAction,
  createDummyAccountAction,
  resetDummyPasswordAction,
  regenerateInviteCodeAction,
  importEmployeesAction,
} from '@/lib/admin-actions'
import { parseCsv, rowsToEmployees } from '@/lib/csv'
import { useAppStore } from '@/lib/store'
import { CATEGORY_FEATURES } from '@/lib/features'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import { FileDown } from 'lucide-react'

interface UserRecord {
  id: string
  auth_id: string | null
  full_name: string
  email: string
  is_dummy_account: boolean
  roles: {
    name: string
    is_admin: boolean
  }
}

interface RoleRecord {
  id: string
  name: string
  invite_code: string
}

export default function AdminPage() {
  const supabase = createClient()
  const { setActiveModules } = useAppStore()
  const [isPending, startTransition] = useTransition()

  const [company, setCompany] = useState<any>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Module state
  const [modules, setModules] = useState<string[]>([])

  // UI state
  const [newDummyName, setNewDummyName] = useState('')
  const [selectedRoleName, setSelectedRoleName] = useState('Employee')
  const [generatedCreds, setGeneratedCreds] = useState<{ email: string; pass: string } | null>(null)
  const [resetPassResult, setResetPassResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // CSV Import State
  const [csvText, setCsvText] = useState('')
  const [importSummary, setImportSummary] = useState<{
    imported: number
    skipped: number
    quotaReached?: boolean
    errors: string[]
  } | null>(null)
  const [importFeedback, setImportFeedback] = useState<string | null>(null)

  const previewData = csvText.trim() ? rowsToEmployees(parseCsv(csvText), { limit: 200 }) : null
  const previewCount = previewData ? previewData.employees.length : 0

  const handleDownloadTemplate = () => {
    const csvContent = 'full_name,email,role_name\nBudi Santoso,budi@example.com,Employee\nSiti Rahma,,Employee\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'template_karyawan_apex.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text || '')
      setImportSummary(null)
      setImportFeedback(null)
    }
    reader.readAsText(file)
  }

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company?.id || !csvText.trim()) return

    setImportFeedback(null)
    setImportSummary(null)

    startTransition(async () => {
      const res = await importEmployeesAction(company.id, company.slug, csvText)
      if (res.error) {
        setImportFeedback(res.error)
      } else {
        setImportSummary({
          imported: res.imported || 0,
          skipped: res.skipped || 0,
          quotaReached: res.quotaReached,
          errors: res.errors || [],
        })
        setCsvText('')
        const { data: refreshedUsers } = await supabase
          .from('users')
          .select('*, roles(name, is_admin)')
          .eq('company_id', company.id)
        setUsers((refreshedUsers as any) || [])
      }
    })
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: uProfile } = await supabase
        .from('users')
        .select('*, roles(*), companies(*)')
        .eq('auth_id', user.id)
        .single()

      if (uProfile) {
        const comp = uProfile.companies as any
        setCompany(comp)
        setModules(comp.active_modules || [])

        // Fetch users profiles
        const { data: usersList } = await supabase
          .from('users')
          .select('*, roles(name, is_admin)')
          .eq('company_id', comp.id)
          .order('full_name', { ascending: true })

        if (usersList) setUsers(usersList as any[])

        // Fetch roles invite codes
        const { data: rolesList } = await supabase
          .from('roles')
          .select('id, name, invite_code')
          .eq('company_id', comp.id)

        if (rolesList) setRoles(rolesList as RoleRecord[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleModule = (mod: string) => {
    setModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    )
  }

  const handleSaveModules = () => {
    if (!company) return
    setError(null)

    startTransition(async () => {
      const res = await updateModulesAction(company.id, company.slug, modules)
      if (res?.error) {
        setError(res.error)
      } else {
        setActiveModules(modules)
        alert('Module settings updated successfully!')
        window.location.reload()
      }
    })
  }

  const handleCreateDummy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company || !newDummyName) return
    setError(null)
    setGeneratedCreds(null)

    startTransition(async () => {
      const res = await createDummyAccountAction(company.id, company.slug, newDummyName, selectedRoleName)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success && res.email && res.password) {
        setGeneratedCreds({ email: res.email, pass: res.password })
        setNewDummyName('')
        fetchAdminData()
      }
    })
  }

  const handleResetPassword = async (userId: string) => {
    if (!company) return
    setError(null)
    setResetPassResult(null)

    if (!confirm('Are you sure you want to reset the password for this user?')) return

    startTransition(async () => {
      const res = await resetDummyPasswordAction(userId, company.slug)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success && res.password) {
        setResetPassResult(`New password generated successfully: ${res.password}`)
        fetchAdminData()
      }
    })
  }

  const handleRegenerateCode = async (roleId: string) => {
    if (!company) return
    if (!confirm('Buat ulang kode undangan ini? Kode lama tidak akan berlaku lagi.')) return
    setError(null)

    startTransition(async () => {
      const res = await regenerateInviteCodeAction(roleId, company.slug)
      if (res?.error) {
        setError(res.error)
      } else {
        alert('Kode undangan berhasil diperbarui!')
        fetchAdminData()
      }
    })
  }

  if (loading && !company) {
    return <SkeletonLoader type="admin" />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Admin Setting</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">INTEGRATED CONTROL SYSTEM AND MEMBER MANAGEMENT</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module Management & Invite Codes (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Module Activation Toggles */}
          <div className="liquid-glass p-6 border border-border rounded-md shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h2 className="text-xs font-mono uppercase text-gray-500">
                FEATURE ACTIVATION ({company?.category?.toUpperCase() || 'CORPORATE'})
              </h2>
              <span className="px-2 py-0.5 bg-red-50 text-[10px] font-mono text-primary rounded-md uppercase border border-primary/10">
                {modules.length} Active
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              <div>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 font-bold">
                  Modul Utama & Pro
                </p>
                <div className="space-y-1.5">
                  {[
                    { id: 'attendance', name: 'Presensi & Kehadiran', description: 'Pencatatan absensi selfie dan rekap kehadiran' },
                    { id: 'shifts', name: 'Jadwal Shift & Roster (Pro)', description: 'Template shift bergilir dan pembagian roster mingguan' },
                    { id: 'leave', name: 'Cuti & Izin', description: 'Pengajuan cuti/izin/sakit karyawan dengan persetujuan admin' },
                    { id: 'payroll', name: 'Payroll-Lite (Pro)', description: 'Kompilasi gaji otomatis berbasis rekap kehadiran & lembur' },
                    { id: 'tasks', name: 'Manajemen Tugas (Task Board)', description: 'Papan Kanban penugasan dan monitoring operasional' },
                    { id: 'inventory', name: 'Inventaris Stok', description: 'Pencatatan aset barang dan stok barang' },
                  ].map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-start gap-3 cursor-pointer p-2.5 bg-surface hover:bg-surface-hover rounded-md border border-border transition-colors block"
                    >
                      <input
                        type="checkbox"
                        checked={modules.includes(mod.id)}
                        onChange={() => handleToggleModule(mod.id)}
                        disabled={isPending}
                        className="mt-0.5 w-4 h-4 bg-transparent border-border text-primary focus:ring-0 focus:ring-offset-0 rounded-md cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground font-sans tracking-wide truncate">{mod.name}</p>
                        <p className="text-[11px] text-gray-500 leading-normal mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 font-bold">
                  Fitur Industri ({company?.category?.toUpperCase() || 'CORPORATE'})
                </p>
                <div className="space-y-1.5">
                  {(CATEGORY_FEATURES[company?.category || 'corporate'] || CATEGORY_FEATURES.corporate).map((feat) => (
                    <label
                      key={feat.id}
                      className="flex items-start gap-3 cursor-pointer p-2.5 bg-surface hover:bg-surface-hover rounded-md border border-border transition-colors block"
                    >
                      <input
                        type="checkbox"
                        checked={modules.includes(feat.id)}
                        onChange={() => handleToggleModule(feat.id)}
                        disabled={isPending}
                        className="mt-0.5 w-4 h-4 bg-transparent border-border text-primary focus:ring-0 focus:ring-offset-0 rounded-md cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground font-sans tracking-wide truncate">{feat.name}</p>
                        <p className="text-[11px] text-gray-500 leading-normal mt-0.5">
                          {feat.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveModules}
              disabled={isPending}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer active:scale-[0.98]"
            >
              {isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Invite Codes Display */}
          <div className="liquid-glass p-6 border border-border rounded-md shadow-sm space-y-4">
            <h2 className="text-xs font-mono uppercase text-gray-500 border-b border-border pb-2">
              INVITATION CODE
            </h2>

            <div className="space-y-3 font-mono">
              {roles.map((role) => (
                <div key={role.id} className="p-3 bg-gray-50 border border-border rounded-md">
                  <span className="text-[11px] text-gray-500 uppercase">{role.name} ROLE</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-foreground tracking-widest">{role.invite_code}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(role.invite_code)
                          alert('Invitation code copied!')
                        }}
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        [Copy]
                      </button>
                      <button
                        onClick={() => handleRegenerateCode(role.id)}
                        disabled={isPending}
                        className="text-xs text-amber-600 hover:underline cursor-pointer disabled:opacity-50"
                        title="Generate Ulang Kode"
                      >
                        [Generate Ulang Kode]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management & Dummy Accounts (Right Column) */}
        <div className="lg:col-span-8 space-y-6">
          {/* User List Table */}
          <div className="liquid-glass p-6 border border-border rounded-md shadow-sm">
            <h2 className="text-xs font-mono uppercase text-gray-500 border-b border-border pb-2 mb-4">
              EMPLOYEE ACCESS & MANAGEMENT
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Username / Email</th>
                    <th className="py-2.5 px-3">Access Role</th>
                    <th className="py-2.5 px-3">Account Type</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 font-sans text-gray-700 font-semibold">{user.full_name}</td>
                      <td className="py-3 px-3 font-mono text-gray-600 text-xs">{user.email}</td>
                      <td className="py-3 px-3 font-mono text-gray-600 uppercase">{user.roles?.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] uppercase border ${
                            user.is_dummy_account
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-green-50 text-green-600 border-green-200'
                          }`}
                        >
                          {user.is_dummy_account ? 'Dummy' : 'Primary'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {user.is_dummy_account && (
                          <button
                            onClick={() => handleResetPassword(user.auth_id!)}
                            className="text-xs text-primary hover:underline font-mono uppercase cursor-pointer"
                          >
                            [Reset Password]
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Karyawan (CSV) Card */}
          <div className="liquid-glass p-6 border border-border rounded-md shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
              <h2 className="text-xs font-mono uppercase text-gray-500">
                IMPORT KARYAWAN (CSV)
              </h2>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-mono uppercase hover:underline cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" /> Download template CSV
              </button>
            </div>

            <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
              Impor banyak karyawan sekaligus dengan format CSV (header: <code>full_name,email,role_name</code>). Email dapat dikosongkan untuk akun dummy (lapangan). Maksimal 200 baris per impor.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <label className="block text-[11px] font-mono text-gray-500 uppercase mb-1">
                    Upload File CSV:
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isPending}
                    className="text-xs font-mono text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-mono file:bg-surface hover:file:bg-surface-hover cursor-pointer"
                  />
                </div>
                {previewCount > 0 && (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-xs font-semibold">
                    Preview: {previewCount} Karyawan Terdeteksi
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-500 uppercase mb-1">
                  Atau Tempel (Paste) Teks CSV di Bawah:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={4}
                  placeholder={`full_name,email,role_name\nBudi Santoso,budi@example.com,Employee\nSiti Rahma,,Employee`}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary text-foreground resize-y"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending || !csvText.trim()}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
                >
                  {isPending ? 'Mengimpor Data...' : 'Import Karyawan'}
                </button>
              </div>
            </form>

            {/* Result Summary */}
            {importSummary && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md font-mono text-xs text-green-700 space-y-2">
                <p className="font-bold border-b border-green-200 pb-1 uppercase">
                  RINGKASAN HASIL IMPOR
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p>Berhasil Diimpor: <span className="font-bold text-gray-900">{importSummary.imported} Orang</span></p>
                  <p>Dilewati: <span className="font-bold text-gray-900">{importSummary.skipped} Orang</span></p>
                </div>
                {importSummary.quotaReached && (
                  <p className="text-amber-700 font-bold bg-amber-50 p-2 rounded border border-amber-200">
                    * Kuota karyawan paket langganan telah tercapai.
                  </p>
                )}
                {importSummary.errors.length > 0 && (
                  <div className="mt-2 text-[11px] text-red-600 space-y-1">
                    <p className="font-bold">Catatan / Peringatan:</p>
                    {importSummary.errors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {importFeedback && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded-md">
                {importFeedback}
              </div>
            )}
          </div>

          {/* Create Dummy Account Panel */}
          <div className="liquid-glass p-6 border border-border rounded-md shadow-sm space-y-4">
            <h2 className="text-xs font-mono uppercase text-gray-500 border-b border-border pb-2">
              CREATE DUMMY EMPLOYEE ACCOUNT
            </h2>

            <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
              Useful for registering field employees who do not have a personal email address. Accounts are generated instantly without email verification.
            </p>

            <form onSubmit={handleCreateDummy} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newDummyName}
                  onChange={(e) => setNewDummyName(e.target.value)}
                  placeholder="Employee Full Name"
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <select
                  value={selectedRoleName}
                  onChange={(e) => setSelectedRoleName(e.target.value)}
                  disabled={isPending}
                  className="px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isPending || !newDummyName}
                className="px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
              >
                {isPending ? 'Processing...' : 'Create Account'}
              </button>
            </form>

            {generatedCreds && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md font-mono text-xs text-green-600 space-y-2">
                <p className="font-bold border-b border-green-200 pb-1.5 mb-1.5 uppercase">
                  DUMMY ACCOUNT CREATED SUCCESSFULLY
                </p>
                <p>USERNAME / EMAIL: <span className="text-gray-900 select-all font-semibold">{generatedCreds.email}</span></p>
                <p>TEMPORARY PASSWORD: <span className="text-gray-900 select-all font-semibold">{generatedCreds.pass}</span></p>
                <p className="text-xs text-green-650 leading-normal mt-2">
                  *RECORD THE CREDENTIALS ABOVE. THIS PASSWORD WILL ONLY BE SHOWN ONCE.
                </p>
              </div>
            )}

            {resetPassResult && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md font-mono text-xs text-primary">
                <p className="font-bold border-b border-red-200 pb-1.5 mb-1.5 uppercase">
                  PASSWORD RESET SELESAI
                </p>
                <p className="text-gray-900 select-all font-semibold">{resetPassResult}</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs font-mono rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
