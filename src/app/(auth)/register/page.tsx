import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Create Tenant Workspace — Apex Operations Control',
  description: 'Provision a dedicated multi-tenant enterprise workspace with automated workflows, payroll rules, and biometric attendance.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Create Tenant Workspace — Apex Operations Control',
    description: 'Provision a dedicated multi-tenant enterprise workspace with automated workflows, payroll rules, and biometric attendance.',
  },
}

export default function RegisterPage() {
  return <RegisterClient />
}
