import { SITE_CONFIG } from '@/lib/site'

export default function JsonLd() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.fullName,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All modern web browsers, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'Multi-Tenant Workspace Isolation',
      'Biometric Selfie Attendance with Geolocation Stamping',
      'Offline-First Synchronous IndexedDB Storage',
      'Kanban Board Status Management',
      'Low-Stock SKU Telemetry Tracking',
      'Fail-Closed HMAC-Verified Webhooks',
    ],
    // No aggregateRating: self-serving review markup violates Google's
    // structured data guidelines and risks a manual action. Revisit only
    // once genuine first-party reviews exist.
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.company.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icon.png`,
    email: SITE_CONFIG.company.email,
    telephone: SITE_CONFIG.company.phone,
    // No fake street address, postal code, or geo coordinates:
    // SaaS produk, bukan lokasi fisik. Google validasi alamat LocalBusiness.
    sameAs: [SITE_CONFIG.social.github],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/login`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
