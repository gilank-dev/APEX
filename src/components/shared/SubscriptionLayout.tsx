'use client'

import { useState } from 'react'
import { Check, Sparkles, Shield, Zap, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Company {
  id: string
  slug: string
  name: string
  tier: string
  trial_ends_at?: string | null
}

interface SubscriptionLayoutProps {
  company: Company
}

function generateRequestCode(slug: string): string {
  const cleanSlug = (slug || 'APEX')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X')
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `APX-${cleanSlug}-${randomPart}`
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
}

export default function SubscriptionLayout({ company }: SubscriptionLayoutProps) {
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; value: string } | null>(null)
  const [requestCode, setRequestCode] = useState('')
  const [requestDate, setRequestDate] = useState('')

  const plans = [
    {
      name: 'Free Tier',
      description: 'For small teams initiating digital operations.',
      price: 'Rp 0',
      crossedOutPrice: 'Rp 99,000',
      period: 'Forever',
      value: 'free',
      icon: <Shield className="w-5 h-5 text-gray-400" />,
      features: [
        'Up to 15 Workspace Members',
        '90-Day Attendance Log Retention',
        'Access to Attendance & Task Board',
        'Daily Automated Backups'
      ],
      cta: 'Activate Now',
      style: 'border-border bg-white text-gray-900'
    },
    {
      name: 'Pro Tier',
      description: 'Complete solution for field and office team efficiency.',
      price: isYearly ? 'Rp 1,990,000' : 'Rp 249,000',
      crossedOutPrice: isYearly ? 'Rp 2,988,000' : 'Rp 349,000',
      period: isYearly ? 'Year' : 'Month',
      value: 'pro',
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      features: [
        'Up to 100 Workspace Members',
        '1-Year Attendance Log Retention',
        'Full Access to All Features',
        'Priority WhatsApp Support',
        'Overtime & Bonus Calculator'
      ],
      cta: 'Upgrade to Pro',
      recommended: true,
      style: 'border-primary bg-white text-gray-900 shadow-lg shadow-primary/5 ring-1 ring-primary/20'
    },
    {
      name: 'Enterprise Tier',
      description: 'Enterprise-grade security, unlimited scalability & performance.',
      price: isYearly ? 'Rp 11,990,000' : 'Rp 1,499,000',
      crossedOutPrice: isYearly ? 'Rp 17,988,000' : 'Rp 1,999,000',
      period: isYearly ? 'Year' : 'Month',
      value: 'enterprise',
      icon: <Zap className="w-5 h-5 text-amber-400 animate-pulse" />,
      features: [
        'Unlimited Workspace Members',
        'Infinite Attendance Log Retention',
        'All Features & Custom API Access',
        '24/7 Support & Dedicated Account Manager',
        'Isolated Tenant Sub-Node'
      ],
      cta: 'Go Enterprise',
      dark: true,
      style: 'border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-950/20'
    }
  ]

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.value === company.tier) return
    if (plan.value === 'free') return
    const code = generateRequestCode(company.slug)
    const dateStr = getFormattedDate()
    setRequestCode(code)
    setRequestDate(dateStr)
    setSelectedPlan({ name: plan.name, price: plan.price, value: plan.value })
  }

  const periodLabel = isYearly ? 'Tahunan' : 'Bulanan'
  const currentTierLabel = (company.tier || 'free').charAt(0).toUpperCase() + (company.tier || 'free').slice(1)
  const targetPlanName = selectedPlan ? selectedPlan.name.replace(/ Tier$/i, '') : ''

  const waMessage = selectedPlan
    ? `Halo Admin Apex, saya mau upgrade paket.\n\nKode Request: ${requestCode}\nPerusahaan: ${company.name} (${company.id})\nSlug: ${company.slug}\nPaket: ${currentTierLabel} → ${targetPlanName}\nHarga: ${selectedPlan.price} / ${periodLabel}\n\nMohon info pembayarannya. Terima kasih.`
    : ''

  const waUrl = selectedPlan
    ? `https://wa.me/6282124153732?text=${encodeURIComponent(waMessage)}`
    : ''

  return (
    <div className="space-y-8">
      {/* Google AI Pro / Gemini-style Selector Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Choose the level of control that fits your operations.
        </h2>
        <p className="text-sm text-gray-500 max-w-[55ch] mx-auto leading-relaxed">
          All plans include bank-grade encryption, offline-first access, and daily backups.
        </p>

        {/* Monthly / Yearly Switch */}
        <div className="inline-flex items-center gap-3 p-1 bg-gray-100 border border-border rounded-full mt-4">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold font-sans transition-all cursor-pointer ${
              !isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Yearly
            <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
              Save 33%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-4">
        {plans.map((plan) => {
          const isActive = company.tier === plan.value
          const isSelected = selectedPlan?.value === plan.value

          return (
            <motion.div
              key={plan.value}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 min-h-[480px] ${plan.style} ${
                isSelected ? 'ring-4 ring-primary/20 border-primary' : ''
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-extrabold text-white bg-primary rounded-full uppercase tracking-widest shadow-sm">
                  Most Popular
                </span>
              )}

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-base font-extrabold tracking-wide uppercase ${plan.dark ? 'text-amber-400' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-[11px] mt-1.5 leading-relaxed ${plan.dark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${plan.dark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-50 border border-border'}`}>
                    {plan.icon}
                  </div>
                </div>

                <div className="border-b border-border/10 pb-6 space-y-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap h-5">
                    {plan.crossedOutPrice && (
                      <span className="text-xs line-through text-red-500/80 font-bold font-mono">
                        {plan.crossedOutPrice}
                      </span>
                    )}
                    {plan.value !== 'free' && isYearly && (
                      <span className="bg-green-100 text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider animate-pulse">
                        Best Value (Save 33%)
                      </span>
                    )}
                    {plan.value === 'free' && (
                      <span className="bg-orange-100 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider">
                        100% Free Gift
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={plan.price}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className={`text-3xl font-extrabold tracking-tight ${plan.dark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {plan.price}
                      </motion.span>
                    </AnimatePresence>
                    <span className={`text-[10px] font-mono uppercase ${plan.dark ? 'text-slate-500' : 'text-gray-400'}`}>
                      / {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs leading-normal">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.dark ? 'text-amber-400' : 'text-primary'}`} />
                      <span className={plan.dark ? 'text-slate-300' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-border/5">
                {isActive ? (
                  <button
                    disabled
                    className="w-full text-center py-3 bg-green-50 border border-green-200 text-green-600 font-mono text-xs uppercase rounded-[4px] font-bold tracking-wider"
                  >
                    Active Now
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full text-center py-3 font-mono text-xs font-bold uppercase rounded-[4px] transition-all cursor-pointer ${
                      plan.dark
                        ? 'bg-white hover:bg-gray-100 text-slate-950 hover:shadow-lg shadow-white/5 active:scale-[0.98]'
                        : isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/10 active:scale-[0.98]'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-border hover:border-gray-400 active:scale-[0.98]'
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* WhatsApp Upgrade Request Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setSelectedPlan(null)}
          />

          {/* Modal Container */}
          <div className="bg-white border border-border rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full relative z-10 animate-in fade-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-gray-50 transition-colors active:scale-90 cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Header */}
            <div className="border-b border-border pb-4 pr-6">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold text-primary uppercase bg-orange-50 border border-primary/20 px-2 py-0.5 rounded-[2px] tracking-wide">
                  {requestCode}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {requestDate}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mt-2 font-sans">
                Permintaan Upgrade {selectedPlan.name}
              </h3>
            </div>

            {/* Body Explanation */}
            <div className="bg-orange-50/50 border border-orange-200/60 rounded-xl p-4 text-xs text-gray-700 leading-relaxed">
              Pembayaran dilakukan manual via WhatsApp. Setelah konfirmasi transfer, admin akan mengaktifkan paket Anda (maks. 1x24 jam).
            </div>

            {/* Detail Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-gray-50 text-xs">
              <div className="divide-y divide-border">
                <div className="grid grid-cols-3 px-4 py-2.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px]">Perusahaan</span>
                  <span className="col-span-2 font-semibold text-gray-900">{company.name}</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px]">Slug</span>
                  <span className="col-span-2 font-mono text-gray-700">{company.slug}</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px]">ID Perusahaan</span>
                  <span className="col-span-2 font-mono text-gray-700 truncate" title={company.id}>{company.id}</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px]">Paket</span>
                  <span className="col-span-2 font-bold text-primary">
                    {currentTierLabel} → {targetPlanName}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px]">Harga</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedPlan.price}</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px]">Periode</span>
                  <span className="col-span-2 font-semibold text-gray-800">{periodLabel}</span>
                </div>
              </div>
            </div>

            {/* Step List */}
            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p className="text-[11px] font-mono uppercase font-bold text-gray-400 tracking-wider">Langkah Pembayaran:</p>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 shrink-0 bg-primary/10 text-primary font-extrabold text-[10px] flex items-center justify-center rounded-full mt-0.5">1</span>
                <span>Klik tombol WhatsApp di bawah (pesan terisi otomatis)</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 shrink-0 bg-primary/10 text-primary font-extrabold text-[10px] flex items-center justify-center rounded-full mt-0.5">2</span>
                <span>Admin kirim detail pembayaran</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 shrink-0 bg-primary/10 text-primary font-extrabold text-[10px] flex items-center justify-center rounded-full mt-0.5">3</span>
                <span>Setelah transfer dikonfirmasi, paket aktif dan notifikasi dikirim</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block text-center py-3.5 bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold uppercase rounded-[4px] transition-colors cursor-pointer shadow-md shadow-green-100 active:scale-[0.98]"
              >
                Lanjut ke WhatsApp
              </a>
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-full text-center py-3 bg-white hover:bg-gray-50 text-gray-500 font-mono text-xs uppercase rounded-[4px] border border-border hover:border-gray-400 transition-colors cursor-pointer active:scale-[0.98]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
