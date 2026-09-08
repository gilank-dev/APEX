import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; feature: string }>
}): Promise<Metadata> {
  const { slug, feature } = await params
  const cleanTitle = feature
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const formattedSlug = slug.toUpperCase()

  return {
    title: `${cleanTitle} (${formattedSlug})`,
    description: `Specialized operations module for ${cleanTitle} inside the ${slug} workspace node.`,
    alternates: {
      canonical: `/${slug}/${feature}`,
    },
  }
}

export default function FeatureLayout({ children }: { children: React.ReactNode }) {
  return children
}
