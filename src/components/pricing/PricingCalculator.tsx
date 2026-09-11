'use client'

import { useState, useMemo } from 'react'
import { ArrowDown, DollarSign, TrendingDown } from 'lucide-react'

export default function PricingCalculator() {
  const [employeeCount, setEmployeeCount] = useState(30)

  const calculations = useMemo(() => {
    // APEX Pricing
    const apexMonthly = 249000
    const apexAnnual = apexMonthly * 12

    // Competitors pricing (per employee/month estimate)
    const mekariPerEmployee = 35000 // Typical SMB tier
    const mekariMonthly = Math.max(mekariPerEmployee * employeeCount, 500000) // minimum
    const mekariAnnual = mekariMonthly * 12

    const gadjianPerEmployee = 25000
    const gadjianMonthly = Math.max(gadjianPerEmployee * employeeCount, 450000)
    const gadjianAnnual = gadjianMonthly * 12

    // Savings calculation
    const savingsVsMekari = mekariAnnual - apexAnnual
    const savingsVsGadjian = gadjianAnnual - apexAnnual
    const avgSavings = (savingsVsMekari + savingsVsGadjian) / 2
    const savingsPercent = ((avgSavings / ((mekariAnnual + gadjianAnnual) / 2)) * 100).toFixed(0)

    return {
      employeeCount,
      apexMonthly,
      apexAnnual,
      mekariMonthly,
      mekariAnnual,
      gadjianMonthly,
      gadjianAnnual,
      savingsVsMekari,
      savingsVsGadjian,
      avgSavings,
      savingsPercent,
    }
  }, [employeeCount])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Kalkulator Hemat Biaya APEX</h3>
          <p className="text-gray-600">Lihat berapa banyak yang bisa Anda hemat dengan beralih ke APEX</p>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-semibold text-gray-700">Jumlah Karyawan</label>
            <div className="text-3xl font-bold text-blue-600">{calculations.employeeCount}</div>
          </div>
          <input
            type="range"
            min="5"
            max="500"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
            className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5 karyawan</span>
            <span>500+ karyawan</span>
          </div>
        </div>

        {/* Main Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* APEX */}
          <div className="bg-white rounded-lg p-4 border-2 border-green-500 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">APEX (APEX)</div>
            <div className="text-sm text-gray-600 mb-1">Per Bulan</div>
            <div className="text-2xl font-bold text-gray-900 mb-3">
              {formatCurrency(calculations.apexMonthly)}
            </div>
            <div className="text-xs text-gray-600 mb-2">Per Tahun</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(calculations.apexAnnual)}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                ✓ Terendah
              </div>
            </div>
          </div>

          {/* Mekari */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Mekari Talenta</div>
            <div className="text-sm text-gray-600 mb-1">Per Bulan</div>
            <div className="text-2xl font-bold text-gray-900 mb-3">
              {formatCurrency(calculations.mekariMonthly)}
            </div>
            <div className="text-xs text-gray-600 mb-2">Per Tahun</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(calculations.mekariAnnual)}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-red-600 font-semibold">
                +{formatCurrency(calculations.savingsVsMekari)}/tahun
              </div>
            </div>
          </div>

          {/* Gadjian */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Gadjian</div>
            <div className="text-sm text-gray-600 mb-1">Per Bulan</div>
            <div className="text-2xl font-bold text-gray-900 mb-3">
              {formatCurrency(calculations.gadjianMonthly)}
            </div>
            <div className="text-xs text-gray-600 mb-2">Per Tahun</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(calculations.gadjianAnnual)}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-red-600 font-semibold">
                +{formatCurrency(calculations.savingsVsGadjian)}/tahun
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg p-6 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Rata-rata hemat per tahun:</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(calculations.avgSavings)}
              </div>
              <div className="text-sm text-gray-600">
                Hemat <span className="font-bold text-green-600">{calculations.savingsPercent}%</span> dibanding kompetitor
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <a
            href="/register"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
          >
            Coba Gratis 14 Hari
          </a>
          <a
            href="https://wa.me/6282124153732?text=Halo%2C%20saya%20tertarik%20dengan%20APEX%20untuk%20{employeeCount}%20karyawan.%20Bisa%20info%20lebih%20lanjut%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
          >
            Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
