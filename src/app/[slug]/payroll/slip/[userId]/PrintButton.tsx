'use client'

import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrintButton({ backHref }: { backHref: string }) {
  return (
    <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Payroll
      </Link>

      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-mono uppercase font-bold rounded-md shadow transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      >
        <Printer className="w-3.5 h-3.5" /> Cetak Slip Gaji (PDF / Print)
      </button>
    </div>
  )
}
