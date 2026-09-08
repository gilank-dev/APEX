import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const formatted = slug.toUpperCase()
  return {
    title: `Admin Settings (${formatted})`,
    description: `Workspace administration, invite code generation, and team permissions for ${slug}.`,
    alternates: {
      canonical: `/${slug}/admin`,
    },
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
