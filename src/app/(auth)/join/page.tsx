import type { Metadata } from 'next'
import JoinClient from './JoinClient'

export const metadata: Metadata = {
  title: 'Gabung Tim — Apex',
  description: 'Masukkan kode undangan dari perusahaan kamu untuk bikin akun karyawan dan langsung absen selfie dari HP.',
  alternates: {
    canonical: '/join',
  },
  openGraph: {
    title: 'Gabung Tim — Apex',
    description: 'Masukkan kode undangan dari perusahaan kamu untuk bikin akun karyawan dan langsung absen selfie dari HP.',
  },
}

export default function JoinPage() {
  return <JoinClient />
}
