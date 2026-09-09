'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { CATEGORY_FEATURES } from '@/lib/features'

interface SidebarLinksProps {
  slug: string
  activeModules: string[]
  isAdminOrManager: boolean
  category?: string
}

export default function SidebarLinks({ slug, activeModules, isAdminOrManager, category = 'corporate' }: SidebarLinksProps) {
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

  // Build list of active dynamic features under "Additional Feature" header
  // Note: we exclude the core module IDs ('attendance', 'tasks', 'inventory') if they are in the list
  const dynamicLinks = industryFeatures
    .filter((feat) => activeModules.includes(feat.id) && !['attendance', 'tasks', 'inventory'].includes(feat.id))
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
    <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Core Links */}
      <div className="space-y-1">
        {coreLinks
          .filter((link) => link.visible)
          .map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`flex items-center px-3 py-2 text-xs font-mono uppercase rounded-md transition-all border-l-2 ${
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

      {/* Additional Features Section */}
      {dynamicLinks.length > 0 && (
        <div className="space-y-1 pt-3 border-t border-border">
          <p className="px-3 text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 font-bold">
            Additional Feature
          </p>
          {dynamicLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`flex items-center px-3 py-2 text-xs font-mono uppercase rounded-md transition-all border-l-2 ${
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

      {/* Footer Settings & Billing */}
      <div className="space-y-1 pt-3 border-t border-border">
        {footerLinks
          .filter((link) => link.visible)
          .map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`flex items-center px-3 py-2 text-xs font-mono uppercase rounded-md transition-all border-l-2 ${
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
    </div>
  )
}
