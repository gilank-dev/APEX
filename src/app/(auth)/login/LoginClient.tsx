'use client'

import { useState, useTransition } from 'react'
import { loginAdminAction } from '@/lib/actions'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginClient() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await loginAdminAction(null, formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success && res.slug) {
        if (res.slug === 'super-admin') {
          window.location.href = '/super-admin'
        } else {
          window.location.href = `/${res.slug}/dashboard`
        }
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
            Masuk ke workspace kamu
          </div>
          <p className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Cek absensi, tugas, dan stok tim kamu hari ini.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Satu akun untuk semua: rekap kehadiran, approval cuti, jadwal shift, sampai slip gaji karyawan.
          </p>
        </div>
        <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          Dibangun di Indonesia // support bahasa Indonesia
        </div>
      </div>

      {/* Right side panel - Login Form */}
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
              Masuk
            </h1>
            <p className="text-xs text-gray-500 mt-1">Pakai email dan password yang kamu daftarkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
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
                  disabled={isPending}
                  className="w-full px-3 py-2 pr-10 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                  placeholder="Password kamu"
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
            </div>

            {error && (
              <div className="p-3 bg-orange-50 border border-primary/20 text-primary text-xs font-mono rounded-md">
                {error}
                <span className="block mt-1 text-gray-500">
                  Lupa password? WhatsApp kami di <a href="https://wa.me/6282124153732" target="_blank" rel="noopener noreferrer" className="underline">+62 821-2415-3732</a>, dibantu reset.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-mono uppercase text-xs font-semibold rounded-md transition-colors focus:outline-none disabled:opacity-50 mt-4 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isPending ? 'Memproses...' : 'Masuk'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center flex flex-col gap-2">
            <Link href="/register" className="text-xs text-primary hover:underline font-mono uppercase font-bold">
              Belum punya akun? Daftar gratis
            </Link>
            <Link href="/join" className="text-xs text-gray-500 hover:text-foreground hover:underline font-mono uppercase">
              Karyawan? Gabung lewat kode undangan
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
