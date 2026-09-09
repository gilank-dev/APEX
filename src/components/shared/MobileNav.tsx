'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'

import { CATEGORY_FEATURES } from '@/lib/features'

interface MobileNavProps {
  slug: string
  activeModules: string[]
  isAdminOrManager: boolean
  fullName: string
  roleName: string
  companyName: string
  category?: string
}

export default function MobileNav({
  slug,
  activeModules,
  isAdminOrManager,
  fullName,
  roleName,
  companyName,
  category = 'corporate'
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // 1. Core Modules
  const coreLinks = [
    {
      href: `/${slug}/dashboard`,
      label: 'Control Center',
      visible: true
    },
    {
      href: `/${slug}/attendance`,
      label: 'Attendance Log',
      visible: activeModules.includes('attendance')
    },
    {
      href: `/${slug}/shifts`,
      label: 'Jadwal Shift',
      visible: activeModules.includes('shifts')
    },
    {
      href: `/${slug}/leave`,
      label: 'Cuti & Izin',
      visible: activeModules.includes('leave')
    },
    {
      href: `/${slug}/payroll`,
      label: 'Payroll',
      visible: activeModules.includes('payroll')
    },
    {
      href: `/${slug}/tasks`,
      label: 'Task Board',
      visible: activeModules.includes('tasks')
    },
    {
      href: `/${slug}/inventory`,
      label: 'Inventory Stock',
      visible: activeModules.includes('inventory')
    }
  ]

  // 2. Admin & Billing Links (Bottom Group)
  const footerLinks = [
    {
      href: `/${slug}/admin`,
      label: 'Admin Setting',
      visible: isAdminOrManager
    },
    {
      href: `/${slug}/billing`,
      label: 'Subscription',
      visible: true
    }
  ]

  // Get current industry features list
  const industryFeatures = CATEGORY_FEATURES[category] || CATEGORY_FEATURES.corporate

  // Build active dynamic links under "Additional Feature" header
  // Excluding core modules
  const dynamicLinks = industryFeatures
    .filter((feat) => activeModules.includes(feat.id) && !['attendance', 'tasks', 'inventory', 'leave'].includes(feat.id))
    .map((feat) => {
      let mappedHref = `/${slug}/${feat.id}`
      
      const attendanceKeywords = ['attendance', 'presensi', 'clock-in']
      const tasksKeywords = ['task', 'roster', 'scheduling', 'swap']
      const inventoryKeywords = ['inventory', 'sku', 'consumables', 'asset', 'equipment']

      if (attendanceKeywords.some(kw => feat.id.includes(kw))) {
        mappedHref = `/${slug}/attendance`
      } else if (tasksKeywords.some(kw => feat.id.includes(kw))) {
        mappedHref = `/${slug}/tasks`
      } else if (inventoryKeywords.some(kw => feat.id.includes(kw))) {
        mappedHref = `/${slug}/inventory`
      }

      return {
        href: mappedHref,
        label: feat.name
      }
    })

  return (
    <>
      {/* Mobile Topbar */}
      <header className="md:hidden flex justify-between items-center h-16 px-4 border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 flex items-center justify-center border border-border rounded-md hover:bg-gray-50 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 border border-primary flex items-center justify-center rounded-md font-mono text-[10px] font-bold text-primary">
              AP
            </div>
            <span className="font-mono tracking-wider text-xs font-bold uppercase text-foreground">{companyName}</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          SYS_ONLINE
        </div>
      </header>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Menu */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 max-w-[80vw] bg-surface border-r border-border shadow-2xl flex flex-col justify-between z-50">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border border-primary flex items-center justify-center rounded-md font-mono text-xs font-bold text-primary">
                    AP
                  </div>
                  <span className="font-mono tracking-widest text-sm font-semibold uppercase text-foreground">APEX</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center border border-border rounded-md hover:bg-gray-50 active:scale-95 transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Core links */}
                <div className="space-y-1">
                  {coreLinks
                    .filter((link) => link.visible)
                    .map((link) => {
                      const isActive = pathname === link.href
                      return (
                        <Link
                          key={link.href + link.label}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center px-4 py-2.5 text-xs font-mono uppercase rounded-md transition-all border-l-2 ${
                            isActive
                              ? 'border-primary bg-orange-50/30 text-primary font-bold'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                          }`}
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                </div>

                {/* Additional Features */}
                {dynamicLinks.length > 0 && (
                  <div className="space-y-1 pt-3 border-t border-border">
                    <p className="px-4 text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 font-bold">
                      Additional Feature
                    </p>
                    {dynamicLinks.map((link) => {
                      const isActive = pathname === link.href
                      return (
                        <Link
                          key={link.href + link.label}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center px-4 py-2.5 text-xs font-mono uppercase rounded-md transition-all border-l-2 ${
                            isActive
                              ? 'border-primary bg-orange-50/30 text-primary font-bold'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                          }`}
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Footer links */}
                <div className="space-y-1 pt-3 border-t border-border">
                  {footerLinks
                    .filter((link) => link.visible)
                    .map((link) => {
                      const isActive = pathname === link.href
                      return (
                        <Link
                          key={link.href + link.label}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center px-4 py-2.5 text-xs font-mono uppercase rounded-md transition-all border-l-2 ${
                            isActive
                              ? 'border-primary bg-orange-50/30 text-primary font-bold'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                          }`}
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                </div>
              </nav>
            </div>

            {/* User Profile & Sign Out Footer */}
            <div className="p-4 border-t border-border bg-gray-50 space-y-3">
              <div>
                <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                <p className="text-xs font-mono text-gray-400 truncate uppercase mt-0.5">
                  {roleName} // {companyName}
                </p>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono uppercase text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 bg-white rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
