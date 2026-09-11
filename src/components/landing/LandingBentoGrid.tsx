import { Clock, CreditCard, TrendingUp, Calendar } from 'lucide-react'

// Zero-JS bento grid: reveal animation is pure CSS (scroll-driven timeline
// with @supports fallback). This component renders entirely on the server.
// Previously framer-motion (~250KB in the client critical path).

const bentoFeatures = [
  {
    title: 'Absensi Selfie Real-Time',
    description: 'Verifikasi selfie dengan kamera depan plus titik lokasi GPS. Tidak bisa diwakilkan, tidak bisa dari rumah.',
    icon: Clock,
    badge: 'Absensi',
    className: 'md:col-span-2',
  },
  {
    title: 'Payroll Otomatis',
    description: 'Gaji, lembur, dan slip digenerate otomatis dari rekap kehadiran. Sekali klik, selesai.',
    icon: CreditCard,
    badge: 'Gaji',
    className: 'md:col-span-1',
  },
  {
    title: 'Analitik Operasional',
    description: 'Grafik kehadiran, keterlambatan, progres tugas, dan stok menipis. Semua kelihatan dalam satu layar.',
    icon: TrendingUp,
    badge: 'Monitoring',
    className: 'md:col-span-1',
  },
  {
    title: 'Shift & Cuti Fleksibel',
    description: 'Atur jadwal shift pagi dan malam, ajukan cuti dengan alur approval, dan tukar shift antar karyawan. Semua tercatat rapi.',
    icon: Calendar,
    badge: 'Jadwal',
    className: 'md:col-span-2',
  },
]

export default function LandingBentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bento-grid-reveal">
      {bentoFeatures.map((feat) => {
        const Icon = feat.icon
        return (
          <div
            key={feat.title}
            className={`bento-card bg-white border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-[box-shadow,border-color] duration-300 flex flex-col justify-between min-h-60 relative group ${feat.className}`}
          >
            <div className="absolute top-4 right-4 bg-orange-50 border border-primary/20 text-primary text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] tracking-wide uppercase">
              {feat.badge}
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 border border-primary/10 flex items-center justify-center mb-6">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide group-hover:text-primary transition-colors">{feat.title}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed normal-case">{feat.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
