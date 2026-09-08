import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const fullItems: BreadcrumbItem[] = [
    { label: 'Apex', href: '/' },
    ...items,
  ]

  const breadcrumbListSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? (item.href.startsWith('http') ? item.href : `${SITE_CONFIG.url}${item.href}`) : undefined,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListSchema) }}
      />
      <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-mono text-gray-500 py-2 ${className}`}>
        <ol className="flex items-center flex-wrap gap-1.5">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1
            return (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                {index === 0 && <Home className="w-3 h-3 text-primary shrink-0 mr-0.5" />}
                {isLast || !item.href ? (
                  <span className="font-semibold text-gray-900 uppercase tracking-wider truncate max-w-[200px]" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors uppercase tracking-wider truncate max-w-[150px]"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
