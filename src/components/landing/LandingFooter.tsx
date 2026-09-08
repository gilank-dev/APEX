'use client'

import { useState } from 'react'
import Link from 'next/link'
import LegalModal from './LegalModal'

export default function LandingFooter() {
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null)

  return (
    <>
      <footer className="bg-white border-t border-border mt-32">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border border-primary flex items-center justify-center rounded-[2px] font-mono text-[10px] font-bold text-primary">
                AP
              </div>
              <span className="font-mono tracking-widest text-xs font-semibold uppercase text-foreground">APEX</span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
              Unified SaaS Node for Operations, Attendance Logs, Task Boards, and Precision Inventories.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest mb-4">Core Solutions</h4>
            <ul className="text-xs text-gray-500 font-mono space-y-2">
              <li><Link href="#fitur" className="hover:text-primary transition-colors duration-200">Payroll Engine</Link></li>
              <li><Link href="#fitur" className="hover:text-primary transition-colors duration-200">Selfie Attendance</Link></li>
              <li><Link href="#fitur" className="hover:text-primary transition-colors duration-200">Task Board</Link></li>
              <li><Link href="#fitur" className="hover:text-primary transition-colors duration-200">Inventory Stock</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest mb-4">Company</h4>
            <ul className="text-xs text-gray-500 font-mono space-y-2">
              <li><Link href="/pricing" className="hover:text-primary transition-colors duration-200">Harga / Pricing</Link></li>
              <li><Link href="#tentang-kami" className="hover:text-primary transition-colors duration-200">About Us</Link></li>
              <li>
                <a 
                  href="https://wa.me/6282124153732?text=Halo%20Apex%2C%20saya%20tertarik%20dengan%20peluang%20karir%20di%20perusahaan." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors duration-200"
                >
                  Karir / Careers
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/6282124153732?text=Halo%20Apex%2C%20saya%20ingin%20berbicara%20dengan%20tim%20sales." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors duration-200"
                >
                  Contact Sales
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/6282124153732?text=Halo%20Apex%2C%20saya%20tertarik%20bekerja%20sama%20sebagai%20mitra%20bisnis." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors duration-200"
                >
                  Partnerships
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest mb-4">Contact Us</h4>
            <p className="text-xs text-gray-500 font-mono leading-relaxed">
              Apex Operations by Lankdev<br />
              WhatsApp:{' '}
              <a 
                href="https://wa.me/6282124153732" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors underline decoration-dotted"
              >
                +62 821-2415-3732
              </a>
            </p>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider text-center sm:text-left">
            <span>© 2026 Apex Operations by Lankdev. All rights reserved.</span>
            <div className="flex gap-4">
              <button 
                onClick={() => setLegalType('privacy')} 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>/</span>
              <button 
                onClick={() => setLegalType('terms')} 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      <LegalModal 
        isOpen={legalType !== null} 
        onClose={() => setLegalType(null)} 
        type={legalType || 'privacy'} 
      />
    </>
  )
}
