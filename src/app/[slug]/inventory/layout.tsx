import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const formatted = slug.toUpperCase()
  return {
    title: `Inventory Stock (${formatted})`,
    description: `SKU management, quantity audits, and low-stock telemetry alerts for ${slug}.`,
    alternates: {
      canonical: `/${slug}/inventory`,
    },
  }
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
