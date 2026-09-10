'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingFaq() {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Apakah data absensi dan payroll kami aman?',
      a: 'Data disimpan di database dengan kebijakan Row Level Security (RLS), artinya perusahaan lain tidak mungkin bisa melihat atau mengubah data kamu. Koneksi dienkripsi SSL/TLS, dan log absensi tidak bisa diubah atau dihapus setelah tercatat supaya rekap gaji bisa dipercaya untuk audit.'
    },
    {
      q: 'Bagaimana cara mulai gratis?',
      a: 'Klik tombol Coba Gratis, daftar, dan langsung dapat akses free tier untuk 15 anggota tim selamanya. Semua paket baru juga dapat trial Pro 14 hari tanpa kartu kredit.'
    },
    {
      q: 'Bisa integrasi dengan software lain?',
      a: 'Ada REST API dan webhook terverifikasi HMAC untuk menarik data absensi dan payroll ke sistem lain yang sudah kamu pakai. Untuk kebutuhan khusus, bisa langsung dibahas via WhatsApp dengan developer-nya.'
    },
    {
      q: 'Selfie karyawan dipakai untuk apa saja?',
      a: 'Hanya untuk verifikasi kehadiran. Foto dikompres di perangkat sebelum dikirim, tersimpan terisolasi per perusahaan, dan tidak dibagikan ke pihak ketiga untuk keperluan apa pun.'
    },
    {
      q: 'Kami tidak paham teknis, apakah bisa dibantu?',
      a: 'Bisa. Impor data karyawan dari Excel/CSV dibantu langsung sampai jalan. Kalau ada kendala, tanya via WhatsApp dan dijawab oleh orang yang membangun aplikasinya, bukan call center.'
    }
  ]

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => {
        const isOpen = selectedFaq === idx
        return (
          <div key={idx} className="border border-border rounded-lg bg-white overflow-hidden transition-all">
            <button
              onClick={() => setSelectedFaq(isOpen ? null : idx)}
              className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-gray-950 uppercase tracking-wide">{faq.q}</span>
              <span className="text-xs text-primary font-mono font-bold">{isOpen ? '[-]' : '[+]'}</span>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-gray-50"
                >
                  <p className="px-6 py-4 text-xs text-gray-600 leading-relaxed border-t border-border">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
