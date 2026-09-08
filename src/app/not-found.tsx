import Link from 'next/link'
import { ArrowLeft, Home, KeyRound, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Node Not Found',
  description: 'The requested enterprise operations node or route could not be located in the cluster.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0C111D] text-white p-6 relative overflow-hidden font-sans select-none">
      {/* Background ambient gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        {/* Brand identifier */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 border border-primary flex items-center justify-center rounded-[2px] font-mono text-xs font-black text-primary bg-primary/10">
            AP
          </div>
          <span className="font-mono tracking-widest text-sm font-bold uppercase text-white">APEX NODE</span>
        </div>

        {/* Diagnostic badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-[2px] text-red-400 font-mono text-xs uppercase tracking-widest">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>STATUS // 404_ROUTE_UNRESOLVED</span>
        </div>

        {/* Primary Page Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight uppercase font-mono">
          404 - Node Not Found
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          The requested route, workspace cluster, or asset parameter does not exist or has been relocated to another shard.
        </p>

        {/* Telemetry Console Frame */}
        <div className="text-left bg-black/40 border border-white/10 rounded-[2px] p-4 font-mono text-[11px] text-gray-400 space-y-1.5">
          <div className="text-gray-500">// TELEMETRY DIAGNOSTIC</div>
          <div className="text-orange-400">CLUSTER: APEX_MAIN_GATEWAY_V1</div>
          <div className="text-gray-400">RESOLVER: SUBGRAPH_LOOKUP_FAILED</div>
          <div className="text-gray-500">RETRY_ACTION: RETURN_TO_CANONICAL_INDEX</div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Return to Base
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-mono text-xs font-bold uppercase rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <KeyRound className="w-4 h-4" />
            Portal Sign In
          </Link>
        </div>

        <div className="pt-6 border-t border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          © 2026 APEX BY LANKDEV // SYSTEM DIAGNOSTIC OK
        </div>
      </div>
    </div>
  )
}
