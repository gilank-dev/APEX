import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const formatted = slug.toUpperCase()
  return {
    title: `Task Board (${formatted})`,
    description: `Kanban workflow, backlog prioritization, and team task tracking for ${slug}.`,
    alternates: {
      canonical: `/${slug}/tasks`,
    },
  }
}

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return children
}
