import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Sign In — Apex Operations Control',
  description: 'Sign in to your organization workspace to access attendance telemetry, task boards, and inventory control.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In — Apex Operations Control',
    description: 'Sign in to your organization workspace to access attendance telemetry, task boards, and inventory control.',
  },
}

export default function LoginPage() {
  return <LoginClient />
}
