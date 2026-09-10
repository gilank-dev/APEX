import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Shield, Sparkles, Zap, ArrowRight } from 'lucide-react'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { SITE_CONFIG } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Harga & Paket Apex — Free, Pro Rp 249.000/bulan, Enterprise',
  description:
    'Lihat harga Apex transparan: paket Free selamanya, Pro Rp 249.000/bulan, Enterprise custom. Absensi selfie, payroll otomatis, dan inventaris dalam satu aplikasi. Coba gratis 14 hari.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Harga Apex — Mulai Gratis, Pro Rp 249rb/bulan',
    description:
      'Lihat harga Apex transparan: paket Free selamanya, Pro Rp 249.000/bulan, Enterprise custom. Absensi selfie, payroll otomatis, dan inventaris dalam satu aplikasi. Coba gratis 14 hari.',
    url: `${SITE_CONFIG.url}/pricing`,
  },
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      description: 'Untuk tim kecil yang baru mulai digitalisasi absensi & operasional.',
      price: 'Rp 0',
      period: 'selamanya',
      subtext: null,
      badge: '100% Free',
      icon: <Shield className="w-5 h-5 text-gray-400" />,
      features: [
        'Up to 15 Workspace Members',
        '90-Day Attendance Log Retention',
        'Access to Attendance & Task Board',
        'Absensi selfie + rekap kehadiran',
      ],
      cta: 'Mulai Gratis',
      href: '/register',
      isExternal: false,
      recommended: false,
      dark: false,
      style: 'border-border bg-white text-gray-900',
      btnStyle:
        'bg-white hover:bg-gray-50 text-gray-700 border border-border hover:border-gray-400 active:scale-[0.98]',
    },
    {
      name: 'Pro',
      description: 'Solusi lengkap efisiensi absensi, payroll, dan produktivitas tim.',
      price: 'Rp 249.000',
      period: 'bulan',
      subtext: 'atau Rp 1.990.000 / tahun (hemat 33%)',
      badge: 'Paling Hemat',
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      features: [
        'Up to 100 Workspace Members',
        '1-Year Attendance Log Retention',
        'Full Access to All Features',
        'Priority WhatsApp Support',
        'Payroll otomatis + lembur dari rekap kehadiran',
      ],
      cta: 'Coba Gratis 14 Hari',
      href: '/register',
      isExternal: false,
      recommended: true,
      dark: false,
      style:
        'border-primary bg-white text-gray-900 shadow-lg shadow-primary/5 ring-1 ring-primary/20',
      btnStyle:
        'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10 active:scale-[0.98]',
    },
    {
      name: 'Enterprise',
      description: 'Keamanan enterprise, kapasitas tanpa batas & performa khusus.',
      price: 'Hubungi Kami',
      period: '',
      subtext: null,
      badge: 'Custom Scale',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      features: [
        'Unlimited Workspace Members',
        'Infinite Attendance Log Retention',
        'All Features & Custom API Access',
        '24/7 Support & Dedicated Account Manager',
        'Isolated Tenant Sub-Node',
      ],
      cta: 'Chat WhatsApp',
      href: 'https://wa.me/6282124153732?text=Halo%2C%20saya%20tertarik%20paket%20Enterprise%20Apex.%20Bisa%20info%20lebih%20lanjut%3F',
      isExternal: true,
      recommended: false,
      dark: true,
      style: 'border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-950/20',
      btnStyle:
        'bg-white hover:bg-gray-100 text-slate-950 hover:shadow-lg shadow-white/5 active:scale-[0.98]',
    },
  ]

  const faqs = [
    {
      question: 'Berapa lama trial gratis?',
      answer: '14 hari akses penuh fitur Pro. Tanpa kartu kredit.',
    },
    {
      question: 'Bagaimana cara upgrade ke Pro?',
      answer: 'Daftar gratis, coba 14 hari, lalu hubungi admin via WhatsApp dari halaman billing.',
    },
    {
      question: 'Bisa berhenti kapan saja?',
      answer: 'Ya. Tanpa kontrak, tanpa penalti.',
    },
  ]

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background font-sans text-foreground overflow-x-hidden relative selection:bg-primary/20 selection:text-primary">
      {/* Top Header Banner */}
      <div className="bg-primary text-white py-2 z-50 overflow-hidden relative w-full border-b border-white/10">
        <div className="flex gap-x-12 w-max animate-marquee whitespace-nowrap text-[10px] font-mono font-bold uppercase tracking-wider select-none">
          {[1, 2, 3].map((_, idx) => (
            <span key={idx} className="flex items-center gap-x-12">
              <span>Apex Campaign 2026 • Absensi Selfie, Payroll Otomatis, dan Inventaris dalam Satu Aplikasi</span>
              <span className="text-white/40">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Floating Glass Navbar */}
      <LandingHeader />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-20 z-10 flex flex-col gap-16 md:gap-24 overflow-x-hidden">
        {/* Title Block */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-block px-3 py-1 bg-orange-50 border border-primary/20 rounded-[2px] font-mono text-[10px] text-primary uppercase tracking-widest font-semibold">
            PRICING
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Harga jelas, tanpa kejutan.
          </h1>

          <p className="text-gray-500 text-sm md:text-base max-w-[55ch] mx-auto leading-relaxed">
            Semua rencana termasuk trial Pro 14 hari gratis. Tanpa kartu kredit, berhenti kapan saja.
          </p>
        </section>

        {/* Plan Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full pt-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 min-h-[480px] ${plan.style}`}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-extrabold text-white bg-primary rounded-full uppercase tracking-widest shadow-sm">
                  Most Popular
                </span>
              )}

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2
                      className={`text-base font-extrabold tracking-wide uppercase ${
                        plan.dark ? 'text-amber-400' : 'text-gray-900'
                      }`}
                    >
                      {plan.name}
                    </h2>
                    <p
                      className={`text-[11px] mt-1.5 leading-relaxed ${
                        plan.dark ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${
                      plan.dark
                        ? 'bg-slate-900 border border-slate-800'
                        : 'bg-gray-50 border border-border'
                    }`}
                  >
                    {plan.icon}
                  </div>
                </div>

                <div className="border-b border-border/10 pb-6 space-y-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap h-5">
                    {plan.badge && (
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider ${
                          plan.dark
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : plan.name === 'Free'
                            ? 'bg-orange-100 text-primary'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-extrabold tracking-tight ${
                        plan.dark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={`text-[10px] font-mono uppercase ${
                          plan.dark ? 'text-slate-500' : 'text-gray-400'
                        }`}
                      >
                        / {plan.period}
                      </span>
                    )}
                  </div>

                  {plan.subtext && (
                    <p className="text-[11px] text-primary font-mono font-semibold pt-1">
                      {plan.subtext}
                    </p>
                  )}
                </div>

                <ul className="space-y-3.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs leading-normal">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.dark ? 'text-amber-400' : 'text-primary'
                        }`}
                      />
                      <span className={plan.dark ? 'text-slate-300' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-border/5">
                {plan.isExternal ? (
                  <a
                    href={plan.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full inline-block text-center py-3 font-mono text-xs font-bold uppercase rounded-[4px] transition-all cursor-pointer ${plan.btnStyle}`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href={plan.href}
                    className={`w-full inline-block text-center py-3 font-mono text-xs font-bold uppercase rounded-[4px] transition-all cursor-pointer ${plan.btnStyle}`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Payment Trust Note */}
        <div className="max-w-2xl mx-auto w-full text-center p-4 bg-orange-50/70 border border-orange-200/70 rounded-xl text-xs text-gray-700 leading-relaxed font-sans shadow-sm">
          <p>
            <span className="font-mono font-bold text-primary mr-1.5 uppercase text-[10px] tracking-wider">
              Info Pembayaran:
            </span>
            Pembayaran manual via WhatsApp. Setelah konfirmasi transfer, paket aktif maksimal 1x24 jam.
          </p>
        </div>

        {/* Static FAQ Section */}
        <section className="max-w-3xl mx-auto w-full space-y-8 border-t border-border pt-16">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-semibold">
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs text-gray-500">
              Hal penting seputar uji coba, metode pembayaran, dan aktivasi paket.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-2 transition-colors hover:border-primary/20"
              >
                <h3 className="text-sm md:text-base font-bold text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Band */}
        <section className="bg-primary text-white rounded-lg p-8 md:p-16 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-hover to-primary opacity-50 -z-10" />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold bg-white/10 px-3 py-1 border border-white/20 rounded-[2px]">
            Coba Sekarang
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Masih ragu? Lihat sendiri dulu.
          </h2>
          <p className="text-white/80 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Semua rencana termasuk trial Pro 14 hari gratis. Tanpa kartu kredit, berhenti kapan saja.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="px-6 py-3.5 bg-white text-primary font-mono text-[11px] font-bold uppercase rounded-[2px] transition-all hover:bg-gray-50 shadow-md cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Coba Gratis Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://wa.me/6282124153732?text=Halo%2C%20saya%20tertarik%20demo%20Apex.%20Bisa%20lihat%20tampilannya%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-white/10 text-white border border-white/20 font-mono text-[11px] font-bold uppercase rounded-[2px] transition-all hover:bg-white/20 text-center cursor-pointer active:scale-[0.98]"
            >
              Chat WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <LandingFooter />
    </div>
  )
}
