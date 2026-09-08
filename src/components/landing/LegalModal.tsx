'use client'

import { useState } from 'react'
import { X, Shield, FileText } from 'lucide-react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'privacy' | 'terms'
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            {type === 'privacy' ? (
              <Shield className="w-5 h-5 text-primary" />
            ) : (
              <FileText className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-sm font-bold font-mono uppercase text-gray-900 tracking-wider">
              {type === 'privacy' ? 'Privacy Policy & Data Protection' : 'Terms of Service & Usage Governance'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-600 leading-relaxed font-sans">
          {type === 'privacy' ? (
            <>
              <p className="font-semibold text-gray-800">Effective Date: January 1, 2026</p>
              <h3 className="font-bold text-gray-900 text-sm uppercase font-mono">1. Biometric & Geolocation Processing</h3>
              <p>
                APEX processes employee selfie snapshots and geolocation coordinates solely for attendance verification. Selfies are compressed locally on the client device prior to transit. In offline mode, photos and coordinates are encrypted using AES/XOR ciphering in the browser IndexedDB.
              </p>
              <h3 className="font-bold text-gray-900 text-sm uppercase font-mono">2. Database Isolation & Row-Level Security</h3>
              <p>
                All company workspaces operate under strict multi-tenant Row-Level Security (RLS). Cross-tenant queries are blocked at the database engine level. No tenant can inspect or modify another organization&apos;s attendance, task, or inventory records.
              </p>
              <h3 className="font-bold text-gray-900 text-sm uppercase font-mono">3. Telemetry & Retention</h3>
              <p>
                Operational metrics (clock-in times, task status changes, SKU logs) are preserved for audit purposes according to the tenant&apos;s subscription retention schedule. Organizations can request data export or purge at any time.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-800">Effective Date: January 1, 2026</p>
              <h3 className="font-bold text-gray-900 text-sm uppercase font-mono">1. Workspace Node Provisioning</h3>
              <p>
                By registering an APEX workspace, you agree to administer authorized organization personnel under your jurisdiction. You are responsible for safeguarding your workspace administration credentials and invite codes.
              </p>
              <h3 className="font-bold text-gray-900 text-sm uppercase font-mono">2. Fair Use & Tier Quotas</h3>
              <p>
                Free tier accounts are limited to 15 concurrent active workspace members. Enterprise accounts benefit from custom scaling agreements. Automated or abusive scraping attempts against the attendance or task endpoints will result in temporary node suspension.
              </p>
              <h3 className="font-bold text-gray-900 text-sm uppercase font-mono">3. Service Level Agreement</h3>
              <p>
                APEX strives for 99.9% uptime across core telemetry nodes. Offline-first synchronization guarantees that client clock-ins are queued securely on mobile devices and transmitted once connectivity resumes.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-mono font-bold uppercase rounded-[2px] transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )
}
