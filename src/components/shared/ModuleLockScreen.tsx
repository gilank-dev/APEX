import { Lock, Sparkles, Crown } from 'lucide-react'
import Link from 'next/link'

interface ModuleLockScreenProps {
  slug: string
  featureName: string
  reason: 'inactive' | 'upgrade'
  isAdminOrManager: boolean
  description?: string
}

// Shared lock screen used by all module pages. `reason` distinguishes a
// module that is simply toggled off from one the company's plan cannot use.
export default function ModuleLockScreen({
  slug,
  featureName,
  reason,
  isAdminOrManager,
  description,
}: ModuleLockScreenProps) {
  const needsUpgrade = reason === 'upgrade'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
          {featureName}
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          {featureName.toUpperCase()}
        </p>
      </div>

      <div className="liquid-glass max-w-2xl mx-auto my-12 p-8 border border-primary/20 rounded-xl text-center space-y-5 shadow-sm">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
            needsUpgrade ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
          }`}
        >
          {needsUpgrade ? <Crown className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold font-sans uppercase text-gray-900">
            {needsUpgrade ? 'Fitur Khusus Paket Pro' : `Fitur ${featureName} Belum Aktif`}
          </h2>
          <p className="text-xs text-gray-600 font-sans max-w-md mx-auto leading-relaxed">
            {description ||
              (needsUpgrade
                ? `${featureName} hanya tersedia untuk pelanggan Pro. Upgrade paket Anda untuk membuka fitur ini, atau coba gratis selama 14 hari.`
                : `Modul ${featureName} belum diaktifkan pada perusahaan ini. Aktifkan modul melalui menu Admin Setting.`)}
          </p>
        </div>
        {isAdminOrManager && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {needsUpgrade ? (
              <Link
                href={`/${slug}/billing`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" /> Lihat Paket & Upgrade
              </Link>
            ) : (
              <Link
                href={`/${slug}/admin`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" /> Kelola Modul di Admin Setting
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
