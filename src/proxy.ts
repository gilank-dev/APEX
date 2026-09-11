import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createRateLimiterPersistent } from '@/lib/security'

// Rate limiting for sensitive API endpoints (merged from middleware.ts —
// Next.js 16 allows ONLY proxy.ts, not both files).
const apiRateLimiter = createRateLimiterPersistent({
  maxAttempts: 20,
  windowMs: 60 * 1000, // 20 requests per minute per IP for sensitive /api/* endpoints
})

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const pathParts = pathname.split('/').filter(Boolean)

  // Apply rate limiting for sensitive API endpoints
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const checkResult = await apiRateLimiter.check(`api:${pathname}:${ip}`)
    if (!checkResult.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan (rate limit exceeded). Silakan coba beberapa saat lagi.' },
        { status: 429, headers: { 'Retry-After': String(checkResult.retryAfterSec) } }
      )
    }
  }

  // Skip static assets and public landing page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_not-found') ||
    pathname.startsWith('/404') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/llms') ||
    pathname.startsWith('/site.webmanifest') ||
    pathname.startsWith('/opengraph-image') ||
    pathParts.length === 0
  ) {
    return NextResponse.next({ request })
  }

  // Blacklist checking - skip validation for these paths
  const blacklist = [
    'admin',
    'api',
    'auth',
    'login',
    'register',
    'join',
    'dashboard',
    'billing',
    'support',
    'public',
    'super-admin',
    'pricing',
  ]
  const firstPart = pathParts[0]
  if (blacklist.includes(firstPart)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )



  // Fetch authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const companySlug = user.user_metadata?.company_slug

  if (!companySlug) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Cross-tenant protection: redirect if slug mismatches user's company slug
  if (firstPart !== companySlug) {
    const url = request.nextUrl.clone()
    url.pathname = `/${companySlug}/dashboard`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
