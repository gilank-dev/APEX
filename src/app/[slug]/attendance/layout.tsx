import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const formatted = slug.toUpperCase()
  return {
    title: `Attendance Telemetry (${formatted})`,
    description: `Biometric selfie verification, geofencing, and real-time attendance logging for ${slug}.`,
    alternates: {
      canonical: `/${slug}/attendance`,
    },
  }
}

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return children
}
