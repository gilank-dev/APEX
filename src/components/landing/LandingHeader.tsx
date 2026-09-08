'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function LandingHeader() {
  const [activeMenu, setActiveMenu] = useState<'fitur' | 'solusi' | 'resources' | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header 
      className="sticky top-4 mx-auto w-[90%] max-w-6xl z-50 transition-all duration-300"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="liquid-glass px-6 py-4 flex justify-between items-center rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 border border-primary flex items-center justify-center rounded-[2px] font-mono text-[10px] font-bold text-primary">
              AP
            </div>
            <span className="font-mono tracking-widest text-xs font-semibold uppercase text-foreground">APEX</span>
          </Link>

          {/* Desktop Mega-Menu Nav triggers */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-gray-600">
            <button 
              onMouseEnter={() => setActiveMenu('fitur')}
              className={`hover:text-primary transition-colors cursor-pointer ${activeMenu === 'fitur' ? 'text-primary font-bold' : ''}`}
            >
              Fitur
            </button>
            <button 
              onMouseEnter={() => setActiveMenu('solusi')}
              className={`hover:text-primary transition-colors cursor-pointer ${activeMenu === 'solusi' ? 'text-primary font-bold' : ''}`}
            >
              Solusi
            </button>
            <button 
              onMouseEnter={() => setActiveMenu('resources')}
              className={`hover:text-primary transition-colors cursor-pointer ${activeMenu === 'resources' ? 'text-primary font-bold' : ''}`}
            >
              Resources
            </button>
            <Link
              href="/pricing"
              onMouseEnter={() => setActiveMenu(null)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Harga
            </Link>
          </nav>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-foreground transition-colors cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-[2px] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            Coba Gratis
          </Link>
        </div>

        {/* Mobile Hamburg Menu Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-gray-600 hover:text-foreground hover:bg-gray-100/50 rounded-md transition-colors cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="md:hidden overflow-hidden bg-white border border-border rounded-lg shadow-lg mt-2 p-5 space-y-4"
          >
            <div className="flex flex-col gap-3 font-mono text-xs uppercase tracking-wider text-gray-600">
              <Link 
                href="#fitur" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="hover:text-primary py-2 border-b border-gray-100 font-bold"
              >
                Fitur
              </Link>
              <Link 
                href="#tentang-kami" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="hover:text-primary py-2 border-b border-gray-100 font-bold"
              >
                Solusi
              </Link>
              <Link 
                href="/pricing" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="hover:text-primary py-2 border-b border-gray-100 font-bold"
              >
                Harga
              </Link>
              <Link 
                href="#tentang-kami" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="hover:text-primary py-2 border-b border-gray-100 font-bold"
              >
                Tentang Kami
              </Link>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-bold text-gray-600 border border-border hover:bg-gray-50 rounded-[2px] font-mono uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-center bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-[2px] shadow-sm font-mono"
              >
                Coba Gratis
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mega-Menu Dropdown Panel */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-border rounded-lg shadow-xl overflow-hidden z-40 p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {activeMenu === 'fitur' && (
              <>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Core Features</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Payroll Engine</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Compute allowances, tax, and insurance automatically.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Payroll Reports</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Access high-fidelity records for fast audits.</p>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Payouts & Slips</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Direct Deposit</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Automate bank transfers to thousands of employees in one click.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Digital Payslips</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Secure e-slips dispatched directly to the employee portal.</p>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Claims & Expenses</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Reimbursement Logs</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Approve and disburse claims with single-action workflows.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Travel Allowance</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Request and log business trip travel expenses directly.</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'solusi' && (
              <>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">By Industry</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Hospitality</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Dynamic shifts and front-camera attendance logs.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Retail & Commerce</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Distributed staff monitoring and overtime loggers.</p>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Business Scale</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Enterprise</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Row Level Security (RLS) active across every entity.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Startups & SMBs</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Flexible pricing tiers and rapid node activation.</p>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">By Role</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">For HR Managers</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Automate payroll computations with zero stress.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">For Directors & CEOs</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">High-level manpower telemetry and real-time costs.</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'resources' && (
              <>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Calculation Tools</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Net Salary Calculator</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Estimate clean take-home pay structures for staff.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Bonus & THR Estimator</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Calculate annual bonus figures based on tenure.</p>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Resources & Compliance</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">HR Dictionary</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">A comprehensive glossary of 100+ HR industry terms.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Blog & Insights</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Guides on compliance and labor standards.</p>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-border pb-1.5">Overtime Logic</h4>
                  <div className="space-y-3">
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Overtime Calculator</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Calculate legal overtime compensation rates easily.</p>
                      </Link>
                    </div>
                    <div className="group cursor-pointer">
                      <Link href="/register" className="block">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors uppercase">Guides & Ebooks</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 normal-case leading-snug">Best practices on managing remote field operations.</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
