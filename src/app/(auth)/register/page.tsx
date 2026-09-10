import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Daftar Gratis — Apex',
  description: 'Daftar workspace Apex gratis 14 hari tanpa kartu kredit. Absensi selfie, payroll otomatis, cuti, shift, dan stok dalam satu aplikasi.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Daftar Gratis — Apex',
    description: 'Daftar workspace Apex gratis 14 hari tanpa kartu kredit. Absensi selfie, payroll otomatis, cuti, shift, dan stok dalam satu aplikasi.',
  },
}

export default function RegisterPage() {
  return <RegisterClient />
}
