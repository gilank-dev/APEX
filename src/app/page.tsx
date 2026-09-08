import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Settings, Compass, MessageSquare, ShieldCheck } from 'lucide-react'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingHeroVisual from '@/components/landing/LandingHeroVisual'
import LandingBentoGrid from '@/components/landing/LandingBentoGrid'
import LandingFaq from '@/components/landing/LandingFaq'
import LandingFooter from '@/components/landing/LandingFooter'
import { SITE_CONFIG } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Apex — Enterprise Operations Control Node | Workforce, Tasks & Inventory',
  description: 'Empower your workforce with high-performance operations control: automated workflows, biometric selfie attendance verification, Kanban tasks, and low-stock SKU tracking.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Apex — Enterprise Operations Control Node',
    description: 'Empower your workforce with high-performance operations control: automated workflows, selfie attendance, and inventory telemetry.',
    url: SITE_CONFIG.url,
  },
}

export default function Home() {
  const services = [
    {
      title: 'Enterprise Deployment',
      description: 'Large-scale deployment services featuring secure database migrations and on-site technical coordination.',
      icon: <Settings className="w-6 h-6 text-primary" />
    },
    {
      title: 'Custom Integration',
      description: 'Connect core operations with hardware biometric devices, legacy payroll bank networks, or custom REST APIs.',
      icon: <Compass className="w-6 h-6 text-primary" />
    },
    {
      title: '24/7 Dedicated Support',
      description: 'Instant issue resolution and technical support via WhatsApp with a Dedicated Account Manager.',
      icon: <MessageSquare className="w-6 h-6 text-primary" />
    }
  ]

  const stats = [
    { value: 'Gratis 14 Hari', label: 'Free 14-day Pro trial' },
    { value: '3 Modul', label: 'Absensi / Tugas / Inventaris' },
    { value: 'Multi-Tenant', label: 'Isolated workspace per company' },
    { value: '24/7', label: 'WhatsApp support response' }
  ]

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background font-sans text-foreground overflow-x-hidden relative selection:bg-primary/20 selection:text-primary">
      
      {/* Top Header Banner */}
      <div className="bg-primary text-white py-2 z-50 overflow-hidden relative w-full border-b border-white/10">
        <div className="flex gap-x-12 w-max animate-marquee whitespace-nowrap text-[10px] font-mono font-bold uppercase tracking-wider select-none">
          {[1, 2, 3].map((_, idx) => (
            <span key={idx} className="flex items-center gap-x-12">
              <span>Apex Campaign 2026 // Upgrade the Speed and Accuracy of Your Enterprise Operations</span>
              <span className="text-white/40">//</span>
            </span>
          ))}
        </div>
      </div>

      {/* Floating Glass Navbar */}
      <LandingHeader />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-20 z-10 flex flex-col gap-24 md:gap-32 overflow-x-hidden">
        
        {/* Section 1: Hero (Masthead) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-full overflow-hidden">
          <div className="lg:col-span-7 space-y-6 text-left w-full max-w-full">
            <div className="inline-block px-3 py-1 bg-orange-50 border border-primary/20 rounded-[2px] font-mono text-[10px] text-primary uppercase tracking-widest font-semibold max-w-full truncate">
              AUTOMATED WORKFLOWS, PAYROLL, & INVENTORY
            </div>
            
            {/* Single Clear H1 Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight max-w-full break-words">
              Scale your enterprise operations with lightning-fast automation.
            </h1>

            <p className="text-gray-500 text-sm md:text-base max-w-[55ch] leading-relaxed break-words">
              Empower your workforce. Simplify administration. Reconcile real-time attendance logs, process error-free payroll runs, and monitor inventory items from a single dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full max-w-full">
              <Link
                href="/register"
                className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-mono text-[11px] font-bold uppercase rounded-[2px] transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-md shadow-primary/10 active:scale-[0.98] w-full sm:w-auto shrink-0"
              >
                Coba Gratis Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://wa.me/6282124153732?text=Halo%20Apex%2C%20saya%20tertarik%20dengan%20layanan%20demo%20sistem%20HRIS%20perusahaan."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-border font-mono text-[11px] font-bold uppercase rounded-[2px] transition-all text-center cursor-pointer active:scale-[0.98] w-full sm:w-auto shrink-0"
              >
                WhatsApp Sales
              </a>
            </div>

            <div className="pt-6 border-t border-border flex flex-wrap gap-6 items-center w-full max-w-full">
              <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider break-all">
                ✓ Bank-grade Security Encryption
              </div>
            </div>
          </div>

          {/* Elevated Floating Dashboard Preview */}
          <LandingHeroVisual />
        </section>

        {/* Section 3: Core Features (Bento Grid) */}
        <section id="fitur" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-semibold">ENTERPRISE INTEGRATION</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">All-in-One Operations Control Center</h2>
            <p className="text-xs text-gray-500 leading-normal">A high-density Bento Grid interface consolidating real-time telemetry, automated calculations, and inventory monitoring.</p>
          </div>

          <LandingBentoGrid />
        </section>

        {/* Section 4: About & Vision */}
        <section id="tentang-kami" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-border pt-24">
          <div className="space-y-6">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-semibold">Our Vision & Mission</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Digitizing operations with absolute clarity.</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              We believe B2B execution stems from deterministic, audit-ready data. Our mission is to deliver clean, secure, and selfie-verified workflows that drive productivity.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Apex Vision</h4>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">To be the standard workflow and operations panel for high-growth enterprises globally.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Apex Mission</h4>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">To deliver transparent payroll computing, real-time SKU inventory logs, and rapid selfie verification.</p>
              </div>
            </div>
          </div>
          <div className="relative p-6 bg-gray-50 border border-border rounded-lg flex flex-col justify-center min-h-[300px]">
            <div className="absolute top-4 left-4 text-[9px] font-mono text-gray-400 uppercase tracking-widest">Platform Highlights</div>
            <div className="grid grid-cols-2 gap-6 p-6">
              {stats.map((st, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-2xl font-extrabold text-primary tracking-tight">{st.value}</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider leading-snug">{st.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Services Grid */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-semibold">PREMIUM SERVICES</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Enterprise Implementation Support</h2>
            <p className="text-xs text-gray-500 leading-normal">Professional onboarding, data migration, and technical configuration designed for seamless setup.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((srv, idx) => (
              <div
                key={idx}
                className="bg-white border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-orange-50 border border-primary/10 flex items-center justify-center mb-6">
                  {srv.icon}
                </div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{srv.title}</h3>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">{srv.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Security & Infrastructure */}
        <section className="bg-gray-50 border border-border rounded-lg p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Data Privacy Guaranteed</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Bank-Grade Cryptographic Security</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              We prioritize the privacy of your workforce and financial records. All connections are secured via end-to-end SSL/TLS encryption, backed by Row Level Security (RLS) policies, and immutable audit trails.
            </p>
            <div className="flex flex-wrap gap-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              <span>✓ Database Isolation</span>
              <span>✓ Real-time Sync Backup</span>
              <span>✓ Enkripsi data offline di perangkat</span>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="p-2 bg-white border border-border rounded-lg shadow-sm w-full max-w-sm overflow-hidden">
              <Image 
                src="/apex_payroll_illustration.png" 
                alt="Apex bank-grade cryptographic security architecture with Row-Level Security isolation and offline encrypted local storage" 
                width={500}
                height={350}
                className="w-full h-auto rounded-md object-cover"
              />
            </div>
          </div>
        </section>

        {/* Section 8: FAQ Accordion */}
        <section id="faq" className="max-w-3xl mx-auto space-y-12 border-t border-border pt-24">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-semibold">FAQ</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Frequently Asked Questions</h2>
          </div>

          <LandingFaq />
        </section>

        {/* Section 9: Global CTA */}
        <section className="bg-primary text-white rounded-lg p-8 md:p-16 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-hover to-primary opacity-50 -z-10" />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold bg-white/10 px-3 py-1 border border-white/20 rounded-[2px]">Get Started</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Optimize Your Business Operations?
          </h2>
          <p className="text-white/80 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Get started with a 14-day free trial. Connect field logs, automate payroll pipelines, and centralize resource tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="px-6 py-3.5 bg-white text-primary font-mono text-[11px] font-bold uppercase rounded-[2px] transition-all hover:bg-gray-50 shadow-md cursor-pointer active:scale-[0.98]"
            >
              Mulai Coba Gratis
            </Link>
            <a
              href="https://wa.me/6282124153732?text=Halo%20Apex%2C%20saya%20ingin%20jadwalkan%20layanan%20demo%20sistem%20Enterprise."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-white/10 text-white border border-white/20 font-mono text-[11px] font-bold uppercase rounded-[2px] transition-all hover:bg-white/20 text-center cursor-pointer active:scale-[0.98]"
            >
              Jadwalkan Demo
            </a>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <LandingFooter />
    </div>
  )
}
