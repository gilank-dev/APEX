'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingFaq() {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Is our attendance and payroll data secure?',
      a: 'Absolutely. All data is encrypted via SSL/TLS end-to-end and stored securely using Row Level Security policies. Daily automated backups are performed to guarantee zero data loss.'
    },
    {
      q: 'How do I start using the platform for free?',
      a: 'Simply click the Get Started button to register a new tenant space. You will instantly receive free-tier access supporting up to 15 team members forever.'
    },
    {
      q: 'Can it integrate with third-party software or biometric hardware?',
      a: 'Yes. We provide custom integration protocols and secure REST APIs to pull logic records from hardware devices or external payroll accounts directly to our cloud.'
    }
  ]

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => {
        const isOpen = selectedFaq === idx
        return (
          <div key={idx} className="border border-border rounded-lg bg-white overflow-hidden transition-all">
            <button
              onClick={() => setSelectedFaq(isOpen ? null : idx)}
              className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-gray-950 uppercase tracking-wide">{faq.q}</span>
              <span className="text-xs text-primary font-mono font-bold">{isOpen ? '[-]' : '[+]'}</span>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-gray-50"
                >
                  <p className="px-6 py-4 text-xs text-gray-600 leading-relaxed border-t border-border">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
