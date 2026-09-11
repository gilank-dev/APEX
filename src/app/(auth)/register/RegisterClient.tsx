'use client'

import { useState, useTransition } from 'react'
import { registerTenantAction } from '@/lib/actions'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function RegisterClient() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const handleCompanyName = (value: string) => {
    setCompanyName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await registerTenantAction(null, formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success && res.slug) {
        window.location.href = `/${res.slug}/admin`
      }
    })
  }

  return (
    <div className="flex min-h-[100dvh] w-full bg-background font-sans text-foreground">
      {/* Left side panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-border bg-gradient-to-br from-orange-50/60 to-background">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-primary flex items-center justify-center rounded-md font-mono text-xs font-bold text-primary">
            AP
          </div>
          <span className="font-mono tracking-widest text-sm font-semibold uppercase text-foreground">APEX</span>
        </div>
        <div className="max-w-md space-y-4">
          <div className="inline-block px-3 py-1 bg-orange-50 border border-primary/20 rounded-md font-mono text-[11px] text-primary uppercase tracking-widest font-semibold">
            Gratis 14 hari, tanpa kartu kredit
          </div>
          <p className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Absensi, gaji, dan stok tim kamu. Beres dalam satu tempat.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Setelah daftar, kamu langsung dibawa ke dashboard admin. Impor data karyawan dari Excel, atur shift, dan undang tim lewat kode undangan. Data tiap perusahaan terisolasi, tidak bisa dilihat perusahaan lain.
          </p>
        </div>
        <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          Dibangun di Indonesia // support bahasa Indonesia
        </div>
      </div>

      {/* Right side panel - Registration Form */}
      <div 
        className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 sm:p-12 relative overflow-hidden bg-background"
        style={{ backgroundImage: 'radial-gradient(rgba(249, 115, 22, 0.05) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}
      >
        {/* Glow circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6 select-none">
          <div className="w-7 h-7 border border-primary flex items-center justify-center rounded-[2px] font-mono text-xs font-bold text-primary bg-white shadow-sm shadow-primary/10">
            AP
          </div>
          <span className="font-mono tracking-widest text-sm font-bold uppercase text-foreground">APEX</span>
        </div>

        <div className="w-full max-w-md bg-white border border-border/80 rounded-lg shadow-xl shadow-gray-100/40 p-8 z-10 relative">
          <div className="mb-8 text-left">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
              Daftar workspace baru
            </h1>
            <p className="text-xs text-gray-500 mt-1">Cuma butuh 1 menit. Langsung bisa dipakai setelah ini.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="companyName">
                Nama Perusahaan / Usaha
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                disabled={isPending}
                value={companyName}
                onChange={(e) => handleCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="Contoh: Laundry Berkah Jaya"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="slug">
                  Alamat Workspace
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  disabled={isPending}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary disabled:opacity-50 text-foreground placeholder:text-gray-300"
                  placeholder="laundry-berkah"
                />
                <p className="text-[10px] text-gray-400 mt-1">Otomatis dari nama usaha, boleh diedit. Huruf kecil + angka.</p>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="category">
                  Jenis Usaha
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                >
                  <option value="fnb">Kuliner / F&B</option>
                  <option value="retail">Retail / Toko</option>
                  <option value="school">Sekolah / Kursus</option>
                  <option value="clinic">Klinik / Kesehatan</option>
                  <option value="ngo">Organisasi / Komunitas</option>
                  <option value="corporate">Kantor / Perusahaan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="adminName">
                Nama Kamu (Pemilik / Admin)
              </label>
              <input
                id="adminName"
                name="adminName"
                type="text"
                required
                disabled={isPending}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="Nama lengkap"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="kamu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  disabled={isPending}
                  className="w-full px-3 py-2 pr-10 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Minimal 8 karakter. Boleh paste, tidak perlu simbol aneh.</p>
            </div>

            {error && (
              <div className="p-3 bg-orange-50 border border-primary/20 text-primary text-xs font-mono rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-white font-mono uppercase text-xs font-semibold rounded-md transition-colors focus:outline-none disabled:opacity-50 mt-4 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isPending ? 'Menyiapkan workspace...' : 'Daftar Sekarang'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-3 font-mono">
              Gratis 14 hari, tanpa kartu kredit. Data kamu aman dan bisa diexport kapan pun.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center flex flex-col gap-2">
            <Link href="/login" className="text-xs text-primary hover:underline font-mono uppercase font-bold">
              Sudah punya akun? Masuk di sini
            </Link>
            <Link href="/join" className="text-xs text-gray-500 hover:text-foreground hover:underline font-mono uppercase">
              Dapat kode undangan? Gabung sebagai karyawan
            </Link>
            <a
              href="https://lankdev.my.id/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 hover:text-gray-500 hover:underline font-mono uppercase"
            >
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
