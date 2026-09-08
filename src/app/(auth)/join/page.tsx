import type { Metadata } from 'next'
import JoinClient from './JoinClient'

export const metadata: Metadata = {
  title: 'Join Workspace — Apex Operations Control',
  description: 'Enter your workspace invitation code to register your profile and access attendance telemetry.',
  alternates: {
    canonical: '/join',
  },
  openGraph: {
    title: 'Join Workspace — Apex Operations Control',
    description: 'Enter your workspace invitation code to register your profile and access attendance telemetry.',
  },
}

export default function JoinPage() {
  return <JoinClient />
}
