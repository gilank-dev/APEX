export const SITE_CONFIG = {
  name: 'APEX',
  fullName: 'Apex — Enterprise Operations Control Node',
  tagline: 'Automated Workflows, Biometric Attendance & Inventory Telemetry',
  description: 'High-performance B2B multi-tenant SaaS platform designed for unified telemetry control, offline-first biometric attendance verification, Kanban task boards, and low-stock SKU tracking.',
  domain: 'apex.lankdev.com',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://apex.lankdev.com',
  company: {
    name: 'Apex Operations by Lankdev',
    legalName: 'PT Lankdev Multi Teknologi',
    address: 'Jl. Jenderal Sudirman Kav. 45, Jakarta Selatan',
    city: 'Jakarta',
    region: 'DKI Jakarta',
    postalCode: '12190',
    country: 'ID',
    phone: '+62-821-2415-3732',
    email: 'support@apex.internal',
    whatsapp: 'https://wa.me/6282124153732',
    coordinates: {
      latitude: -6.2088,
      longitude: 106.8456,
    },
  },
  social: {
    github: 'https://github.com/theclipperss1-create/APEX',
  },
} as const
