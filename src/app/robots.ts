import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/join'],
        disallow: ['/api/', '/super-admin/', '/*/*/'],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  }
}
