import Link from 'next/link'
import { Home, KeyRound, SearchX } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan — Apex',
  description:
    'Halaman atau tautan yang kamu tuju tidak ditemukan. Kembali ke beranda Apex atau masuk ke workspace kamu.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0C111D] text-white p-6 relative overflow-hidden font-sans select-none">
      {/* Background ambient gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        {/* Brand identifier */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 border border-primary flex items-center justify-center rounded-[2px] font-mono text-xs font-black text-primary bg-primary/10">
            AP
          </div>
          <span className="font-mono tracking-widest text-sm font-bold uppercase text-white">Apex</span>
        </div>

        {/* Diagnostic badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-[2px] text-orange-400 font-mono text-xs uppercase tracking-widest">
          <SearchX className="w-3.5 h-3.5" />
          <span>404 — Halaman Tidak Ditemukan</span>
        </div>

        {/* Primary page heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Halaman Ini Tidak Ada
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          Tautan yang kamu buka mungkin salah ketik, sudah dipindahkan, atau workspace-nya sudah
          tidak aktif. Coba kembali ke beranda atau masuk ke workspace kamu.
        </p>

        {/* Hint box */}
        <div className="text-left bg-black/40 border border-white/10 rounded-[2px] p-4 font-mono text-[11px] text-gray-400 space-y-1.5">
          <div className="text-gray-500">{'// PETUNJUK'}</div>
          <div className="text-gray-300">Pastikan tautan undangan atau alamat workspace benar.</div>
          <div className="text-gray-300">Halaman workspace selalu berbentuk: apex.lankdev.my.id/[nama-perusahaan]/...</div>
          <div className="text-gray-500">Butuh bantuan? Hubungi support via WhatsApp di halaman beranda.</div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-mono text-xs font-bold uppercase rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <KeyRound className="w-4 h-4" />
            Masuk Workspace
          </Link>
        </div>

        <div className="pt-6 border-t border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          © 2026 Apex by Lankdev
        </div>
      </div>
    </div>
  )
}
