import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Masuk — Apex',
  description: 'Masuk ke workspace Apex kamu untuk cek absensi, approval cuti, jadwal shift, dan slip gaji karyawan.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Masuk — Apex',
    description: 'Masuk ke workspace Apex kamu untuk cek absensi, approval cuti, jadwal shift, dan slip gaji karyawan.',
  },
}

export default function LoginPage() {
  return <LoginClient />
}
