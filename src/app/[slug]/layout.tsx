import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveEntitledModules } from '@/lib/entitlements'
import OfflineSyncProvider from '@/components/shared/OfflineSyncProvider'
import Link from 'next/link'
import SidebarLinks from '@/components/shared/SidebarLinks'
import MobileNav from '@/components/shared/MobileNav'
import Breadcrumbs from '@/components/shared/Breadcrumbs'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch full user profile along with role and company
  const { data: profile, error } = await supabase
    .from('users')
    .select('*, roles(*), companies(*)')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (error || !profile) {
    // If auth session exists but user is not in database, sign out
    await supabase.auth.signOut()
    redirect('/login')
  }

  const company = profile.companies as any
  const role = profile.roles as any

  // Deactivated employees are signed out immediately at the layout gate
  if (profile.is_active === false) {
    await supabase.auth.signOut()
    redirect('/login?deactivated=1')
  }

  if (company.slug !== slug) {
    redirect(`/${company.slug}/dashboard`)
  }

  // Entitlement-filtered modules: a Free company never sees Pro module links,
  // even if active_modules was somehow set in the DB.
  const activeModules = resolveEntitledModules(company)
  const isAdminOrManager = role.is_admin || role.name === 'Manager'

  return (
    <OfflineSyncProvider>
      <div className="flex min-h-[100dvh] bg-background text-foreground font-sans">
        {/* Sidebar Nav */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface">
          <div className="flex items-center gap-2 p-6 border-b border-border">
            <div className="w-6 h-6 border border-primary flex items-center justify-center rounded-md font-mono text-xs font-bold text-primary">
              AP
            </div>
            <span className="font-mono tracking-widest text-sm font-semibold uppercase text-foreground">APEX</span>
          </div>

          <SidebarLinks slug={slug} activeModules={activeModules} isAdminOrManager={isAdminOrManager} category={company.category} />

          <div className="p-4 border-t border-border flex flex-col gap-2">
            <div className="px-3 py-2">
              <p className="text-sm font-bold text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-xs font-mono text-gray-400 truncate uppercase mt-0.5">
                {role.name}{' // '}{company.name}
              </p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full text-left px-3 py-2 text-xs font-mono uppercase text-red-600 hover:text-red-700 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Navigation */}
          <MobileNav
            slug={slug}
            activeModules={activeModules}
            isAdminOrManager={isAdminOrManager}
            fullName={profile.full_name}
            roleName={role.name}
            companyName={company.name}
            category={company.category}
          />

          {/* Desktop Topbar */}
          <header className="hidden md:flex justify-between items-center h-14 px-6 border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-mono uppercase font-semibold text-gray-900 tracking-wider">
                {company.name}{' // '}{slug}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-gray-400 uppercase">SYS_OK</span>
            </div>
          </header>

          <div className="px-6 pt-3">
            <Breadcrumbs items={[{ label: company.name || slug, href: `/${slug}/dashboard` }]} />
          </div>

          <main className="flex-1 p-6 pt-3 overflow-y-auto">{children}</main>
        </div>
      </div>
    </OfflineSyncProvider>
  )
}
