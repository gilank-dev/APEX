'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

// Zero framer-motion: dropdowns animate with pure CSS.
// - Mega menu: always-rendered, class-toggled opacity/translate (smooth in+out).
// - Mobile menu: conditional render + .accordion-panel (grid-rows 0fr→1fr,
//   @starting-style handles the mount transition in globals.css).

export default function LandingHeader() {
  const [activeMenu, setActiveMenu] = useState<'fitur' | 'solusi' | 'resources' | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-4 mx-auto w-[90%] max-w-6xl z-50 transition-all duration-300"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="liquid-glass px-6 py-4 flex justify-between items-center rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 border border-primary flex items-center justify-center rounded-[2px] font-mono text-[10px] font-bold text-primary">
              AP
            </div>
            <span className="font-mono tracking-widest text-xs font-semibold uppercase text-foreground">APEX</span>
          </Link>

          {/* Desktop Mega-Menu Nav triggers */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-gray-600">
            <button
              onMouseEnter={() => setActiveMenu('fitur')}
              className={`hover:text-primary transition-colors cursor-pointer ${activeMenu === 'fitur' ? 'text-primary font-bold' : ''}`}
            >
              Fitur
            </button>
            <button
              onMouseEnter={() => setActiveMenu('solusi')}
              className={`hover:text-primary transition-colors cursor-pointer ${activeMenu === 'solusi' ? 'text-primary font-bold' : ''}`}
            >
              Solusi
            </button>
            <Link
              href="/pricing"
              onMouseEnter={() => setActiveMenu(null)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Harga
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-foreground transition-colors cursor-pointer"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-[2px] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            Coba Gratis
          </Link>
        </div>

        {/* Mobile Hamburg Menu Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-gray-600 hover:text-foreground hover:bg-gray-100/50 rounded-md transition-colors cursor-pointer"
            aria-label="Toggle Mobile Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="accordion-panel md:hidden grid transition-[grid-template-rows] duration-200 ease-out">
          <div className="overflow-hidden">
            <div className="bg-white border border-border rounded-lg shadow-lg mt-2 p-5 space-y-4">
              <div className="flex flex-col gap-3 font-mono text-xs uppercase tracking-wider text-gray-600">
                <Link
                  href="#fitur"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-primary py-2 border-b border-gray-100 font-bold"
                >
                  Fitur
                </Link>
                <Link
                  href="#tentang-kami"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-primary py-2 border-b border-gray-100 font-bold"
                >
                  Tentang Kami
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-primary py-2 border-b border-gray-100 font-bold"
                >
                  Harga
                </Link>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-gray-600 border border-border hover:bg-gray-50 rounded-[2px] font-mono uppercase"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-[2px] shadow-sm font-mono"
                >
                  Coba Gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mega-Menu Dropdown Panel (always rendered, CSS-toggled) */}
      <div
        aria-hidden={!activeMenu}
        className={`absolute left-0 right-0 top-full mt-2 bg-white border border-border rounded-lg shadow-xl overflow-hidden z-40 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 transition-[opacity,translate] duration-150 ease-out
          ${activeMenu ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-2 invisible pointer-events-none'}`}
      >
        {activeMenu === 'fitur' && (
          <>
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Absensi</h4>
              <div className="space-y-3">
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Absensi Selfie</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Verifikasi selfie plus titik lokasi GPS, anti titip absen.</p>
                  </Link>
                </div>
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Rekap Kehadiran</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Rekap bulanan jam kerja, keterlambatan, dan lembur otomatis.</p>
                  </Link>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Gaji</h4>
              <div className="space-y-3">
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Payroll Otomatis</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Kompilasi gaji berbasis rekap kehadiran dan lembur.</p>
                  </Link>
                </div>
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Slip Gaji Digital</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Slip gaji per karyawan bisa dibuka langsung dari aplikasi.</p>
                  </Link>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Operasional</h4>
              <div className="space-y-3">
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Tugas &amp; Inventaris</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Papan tugas tim dan catat stok barang dari satu tempat.</p>
                  </Link>
                </div>
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Cuti &amp; Tukar Shift</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Pengajuan cuti dengan approval dan pertukaran shift antar karyawan.</p>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'solusi' && (
          <>
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Untuk Bisnis</h4>
              <div className="space-y-3">
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Retail &amp; Kuliner</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Shift pagi-malam dan absensi karyawan cabang.</p>
                  </Link>
                </div>
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Bengkel &amp; Jasa</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Rekap kehadiran teknisi dan stok spare part.</p>
                  </Link>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Skala Tim</h4>
              <div className="space-y-3">
                <div className="group cursor-pointer">
                  <Link href="/pricing" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Tim Kecil</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Gratis sampai 15 anggota, selamanya.</p>
                  </Link>
                </div>
                <div className="group cursor-pointer">
                  <Link href="/pricing" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Tim Menengah</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Paket Pro untuk sampai 100 anggota dengan payroll penuh.</p>
                  </Link>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Peran</h4>
              <div className="space-y-3">
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Untuk HR &amp; Admin</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Rekap otomatis, approval cuti, impor karyawan dari CSV.</p>
                  </Link>
                </div>
                <div className="group cursor-pointer">
                  <Link href="#fitur" className="block">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Untuk Pemilik Usaha</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Lihat kehadiran, gaji, dan stok semua cabang dari satu layar.</p>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
