'use client'

import { useState, useTransition } from 'react'
import { registerTenantAction } from '@/lib/actions'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Breadcrumbs from '@/components/shared/Breadcrumbs'

export default function RegisterClient() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await registerTenantAction(null, formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success && res.slug) {
        window.location.href = `/${res.slug}/admin`
      }
    })
  }

  return (
    <div className="flex min-h-[100dvh] w-full bg-background font-sans text-foreground">
      {/* Left side panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-border bg-gradient-to-br from-orange-50/60 to-background">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-primary flex items-center justify-center rounded-md font-mono text-xs font-bold text-primary">
            AP
          </div>
          <span className="font-mono tracking-widest text-sm font-semibold uppercase text-foreground">APEX</span>
        </div>
        <div className="max-w-md space-y-4">
          <div className="inline-block px-3 py-1 bg-orange-50 border border-primary/20 rounded-md font-mono text-[11px] text-primary uppercase tracking-widest font-semibold">
            Multi-Tenant Isolation
          </div>
          <p className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Multi-tenant B2B platform built for remote workflows, selfie verification, and precise resource tracking.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Register your company workspace and get complete control over schedules, timesheets, payroll reports, and inventory assets.
          </p>
        </div>
        <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          SECURE SECTOR // MULTI-TENANT ISOLATION v1.0
        </div>
      </div>

      {/* Right side panel - Registration Form */}
      <div 
        className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 sm:p-12 relative overflow-hidden bg-background"
        style={{ backgroundImage: 'radial-gradient(rgba(249, 115, 22, 0.05) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}
      >
        {/* Glow circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Background Typography Watermarks */}
        <div className="absolute right-8 top-12 font-mono text-[90px] font-extrabold text-gray-100/40 leading-none select-none tracking-tighter pointer-events-none uppercase hidden sm:block">APEX</div>
        <div className="absolute left-8 bottom-12 font-mono text-[90px] font-extrabold text-gray-100/40 leading-none select-none tracking-tighter pointer-events-none uppercase hidden sm:block">CREATE</div>

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6 select-none">
          <div className="w-7 h-7 border border-primary flex items-center justify-center rounded-[2px] font-mono text-xs font-bold text-primary bg-white shadow-sm shadow-primary/10">
            AP
          </div>
          <span className="font-mono tracking-widest text-sm font-bold uppercase text-foreground">APEX</span>
        </div>

        <div className="w-full max-w-md mb-3">
          <Breadcrumbs items={[{ label: 'Register', href: '/register' }]} />
        </div>

        <div className="w-full max-w-md bg-white border border-border/80 rounded-lg shadow-xl shadow-gray-100/40 p-8 z-10 relative">
          <div className="absolute -top-3 left-6 px-2 py-0.5 bg-orange-50 border border-primary/20 text-primary text-[8px] font-mono font-bold tracking-widest uppercase rounded-[1px] select-none">
            Provisioning Node
          </div>

          <div className="mb-8 text-left">
            {/* Single Clear H1 Heading */}
            <h1 className="text-xl font-bold tracking-tight text-foreground uppercase font-sans">
              Create Workspace Node
            </h1>
            <p className="text-xs text-gray-500 mt-1">Register your enterprise workspace for full operational control.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="companyName">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                disabled={isPending}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="Acme Corporation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="slug">
                  Company Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary disabled:opacity-50 text-foreground placeholder:text-gray-300"
                  placeholder="acme-corp"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="category">
                  Industry Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                >
                  <option value="corporate">Corporate</option>
                  <option value="school">School</option>
                  <option value="fnb">Food & Beverage</option>
                  <option value="retail">Retail</option>
                  <option value="clinic">Clinic</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="adminName">
                Administrator Name
              </label>
              <input
                id="adminName"
                name="adminName"
                type="text"
                required
                disabled={isPending}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="Primary Administrator"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="email">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-orange-50 border border-primary/20 text-primary text-xs font-mono rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-mono uppercase text-xs font-semibold rounded-md transition-colors focus:outline-none disabled:opacity-50 mt-4 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isPending ? 'Processing...' : 'Register Company'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center flex flex-col gap-2">
            <Link href="/login" className="text-xs text-primary hover:underline font-mono uppercase font-bold">
              ALREADY REGISTERED? SIGN IN
            </Link>
            <Link href="/join" className="text-xs text-gray-500 hover:text-foreground hover:underline font-mono uppercase">
              HAVE AN INVITATION CODE? JOIN AS EMPLOYEE
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
