export const SITE_CONFIG = {
  name: 'APEX',
  fullName: 'Apex — Absensi, Payroll & Inventaris',
  tagline: 'Absensi Selfie, Payroll Otomatis & Inventaris dalam Satu Aplikasi',
  description: 'Platform HRIS untuk bisnis berbasis shift di Indonesia: absensi selfie terverifikasi dengan GPS, rekap gaji otomatis dari kehadiran, cuti dan tukar shift dengan approval, serta catat stok. Gratis 14 hari, tanpa kartu kredit.',
  domain: 'apex.lankdev.my.id',
  url: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://apex.lankdev.my.id'),
  company: {
    name: 'Apex by Lankdev',
    // legalName: diisi hanya jika badan hukum sudah resmi ada. Jangan pakai
    // nama PT fiktif di metadata publik (footer, schema.org, legal pages).
    legalName: 'Gilank Putra Ramadhan',
    address: 'South Tangerang, Banten',
    city: 'South Tangerang',
    region: 'Banten',
    postalCode: '',
    country: 'ID',
    phone: '+62-821-2415-3732',
    email: 'gilankdev@gmail.com',
    whatsapp: 'https://wa.me/6282124153732',
    // No fake geo coordinates for a non-existent office location.
  },
  social: {
    github: 'https://github.com/gilank-dev/APEX',
  },
} as const
