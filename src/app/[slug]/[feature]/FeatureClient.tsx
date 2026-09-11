'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_FEATURES, Feature } from '@/lib/features'
import { 
  ArrowLeft, Check, Sparkles, AlertCircle, RefreshCw, Send, FileText, Plus, 
  Trash2, Download, Printer, Shield, Calendar, User, DollarSign, Database, Tag, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { gooeyToast } from 'goey-toast'
import Link from 'next/link'

export default function FeatureClient({ slug, featureId }: { slug: string; featureId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [company, setCompany] = useState<any>(null)
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Interactive Engine States
  const [widgetType, setWidgetType] = useState<'ai' | 'form' | 'calculator' | 'booking' | 'inventory'>('form')
  const [actionLoading, setActionLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  
  // 1. AI Widget State
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState<string | null>(null)
  
  // 2. Form & List State (Persistent client-side database)
  const [records, setRecords] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formVal1, setFormVal1] = useState('')
  const [formVal2, setFormVal2] = useState('')
  const [formSelect, setFormSelect] = useState('')

  // 3. Calculator State
  const [calcVal1, setCalcVal1] = useState('5000000') // Nominal Utama
  const [calcVal2, setCalcVal2] = useState('1500000')  // Allowances/Additions
  const [calcVal3, setCalcVal3] = useState('750000')   // Deductions/Taxes
  const [calcResult, setCalcResult] = useState<any | null>(null)
  
  // 4. Booking State
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingTitle, setBookingTitle] = useState('')
  const [bookingTime, setBookingTime] = useState('09:00')
  const [bookingTarget, setBookingTarget] = useState('')

  // 5. Inventory Registry State
  const [inventory, setInventory] = useState<any[]>([])
  const [itemName, setItemName] = useState('')
  const [itemSku, setItemSku] = useState('')
  const [itemQty, setItemQty] = useState('10')
  const [itemCondition, setItemCondition] = useState('Good')

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 15)])
  }

  const initMockData = (id: string, type: string, category: string = 'corporate') => {
    // Local storage key for persistent client-side data
    const key = `apex_data_${id}`
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (type === 'form') setRecords(parsed)
      if (type === 'booking') setBookings(parsed)
      if (type === 'inventory') setInventory(parsed)
      return
    }

    // Default starting data lists based on category
    if (type === 'form') {
      let defaultForms = []
      if (category === 'school') {
        defaultForms = [
          { id: '1', name: 'Aditya Saputra', val1: 'Class 10-A', val2: 'Active', select: 'Regular Student' },
          { id: '2', name: 'Rani Wijaya', val1: 'Class 12-C', val2: 'Active', select: 'Scholarship' }
        ]
      } else if (category === 'fnb') {
        defaultForms = [
          { id: '1', name: 'Special Fried Rice + Egg', val1: 'Table 4 (Dine-in)', val2: 'Completed', select: 'Main Course' },
          { id: '2', name: 'Palm Sugar Iced Coffee', val1: 'Table 2 (Takeaway)', val2: 'Processing', select: 'Cold Drinks' }
        ]
      } else if (category === 'retail') {
        defaultForms = [
          { id: '1', name: 'Plain Cotton T-Shirt 30s', val1: 'Transaction TRX-893', val2: 'Paid', select: 'Men\'s Wear' },
          { id: '2', name: 'Slim Fit Denim Jeans', val1: 'Transaction TRX-942', val2: 'Pending', select: 'Men\'s Wear' }
        ]
      } else if (category === 'clinic') {
        defaultForms = [
          { id: '1', name: 'Siti Rahmawati', val1: 'Pediatrics (Dr. Diana)', val2: 'Outpatient', select: 'BPJS Insurance' },
          { id: '2', name: 'Hendra Wijaya', val1: 'General Poly (Dr. Budi)', val2: 'Completed', select: 'Regular Patient' }
        ]
      } else if (category === 'ngo') {
        defaultForms = [
          { id: '1', name: 'Bakti Kemanusiaan Foundation', val1: 'Earthquake Relief Fund', val2: 'Received', select: 'Gold Sponsor' },
          { id: '2', name: 'Rizal Syahputra', val1: 'Social Volunteer Program', val2: 'Active', select: 'Volunteer' }
        ]
      } else { // corporate
        defaultForms = [
          { id: '1', name: 'Budi Santoso', val1: 'IT Support Division', val2: 'Active', select: 'Regular' },
          { id: '2', name: 'Siti Aminah', val1: 'Finance Division', val2: 'Active', select: 'Contract' }
        ]
      }
      setRecords(defaultForms)
      localStorage.setItem(key, JSON.stringify(defaultForms))
    } else if (type === 'booking') {
      let defaultBookings = []
      if (category === 'school') {
        defaultBookings = [
          { id: '1', title: 'Physics Final Exam (UAS)', time: '08:00', target: 'Computer Lab 1' },
          { id: '2', title: 'Grade 12 Parent-Teacher Meeting', time: '10:00', target: 'School Main Hall' }
        ]
      } else if (category === 'fnb') {
        defaultBookings = [
          { id: '1', title: 'VIP Dinner Reservation (10 Pax)', time: '13:00', target: 'VIP Table A' },
          { id: '2', title: 'Live Music Acoustic Session', time: '15:00', target: 'Main Stage' }
        ]
      } else if (category === 'retail') {
        defaultBookings = [
          { id: '1', title: 'Main Vendor T-Shirt Restock', time: '09:00', target: 'Warehouse Loading Dock' },
          { id: '2', title: 'Store Inventory Audit', time: '14:00', target: 'Main Cashier Area' }
        ]
      } else if (category === 'clinic') {
        defaultBookings = [
          { id: '1', title: 'Routine Dental Checkup', time: '08:00', target: 'Dental Poly (Chair A)' },
          { id: '2', title: 'Pediatric Consultation', time: '10:00', target: 'Pediatric Room' }
        ]
      } else if (category === 'ngo') {
        defaultBookings = [
          { id: '1', title: 'Social Charity & Food Distribution', time: '09:00', target: 'Cianjur Post 1' },
          { id: '2', title: 'Disaster Volunteer Coordination Meeting', time: '13:00', target: 'Main Secretariat' }
        ]
      } else { // corporate
        defaultBookings = [
          { id: '1', title: 'Monthly Internal Division Meeting', time: '10:00', target: 'Main Meeting Room' },
          { id: '2', title: 'Daily Standup Sync', time: '09:00', target: 'Virtual Zoom Room 1' }
        ]
      }
      setBookings(defaultBookings)
      localStorage.setItem(key, JSON.stringify(defaultBookings))
    } else if (type === 'inventory') {
      let defaultInventory = []
      if (category === 'school') {
        defaultInventory = [
          { id: '1', name: 'LCD Projector EPSON HD', sku: 'SKU-SCH-PRJ-01', qty: 12, condition: 'Good' },
          { id: '2', name: 'Physics Curriculum Textbook 10', sku: 'SKU-SCH-BK-402', qty: 45, condition: 'Good' }
        ]
      } else if (category === 'fnb') {
        defaultInventory = [
          { id: '1', name: 'Espresso Machine Simonelli Aurelia II', sku: 'SKU-FNB-ESP-01', qty: 2, condition: 'Good' },
          { id: '2', name: 'Arabica Gayo Premium Coffee 1kg', sku: 'SKU-FNB-BEAN-89', qty: 18, condition: 'Good' }
        ]
      } else if (category === 'retail') {
        defaultInventory = [
          { id: '1', name: 'Android Cashier Machine Honeywell', sku: 'SKU-RTL-POS-02', qty: 4, condition: 'Good' },
          { id: '2', name: 'Wooden Clothes Hanger', sku: 'SKU-RTL-HNG-192', qty: 250, condition: 'Good' }
        ]
      } else if (category === 'clinic') {
        defaultInventory = [
          { id: '1', name: 'Digital Tensi OMRON HEM-7156', sku: 'SKU-CLN-TENS-09', qty: 6, condition: 'Good' },
          { id: '2', name: 'Littmann Classic III Stethoscope Black', sku: 'SKU-CLN-STET-12', qty: 8, condition: 'Good' }
        ]
      } else if (category === 'ngo') {
        defaultInventory = [
          { id: '1', name: 'BNPB Folding Emergency Tent 4x4', sku: 'SKU-NGO-TENT-05', qty: 5, condition: 'Good' },
          { id: '2', name: 'Independent Basic Needs Aid Kit S1', sku: 'SKU-NGO-SEMB-99', qty: 120, condition: 'Good' }
        ]
      } else { // corporate
        defaultInventory = [
          { id: '1', name: 'MacBook Pro M2 - IT Dev', sku: 'SKU-CORP-MBP-08', qty: 5, condition: 'Good' },
          { id: '2', name: 'Monitor LG UltraWide 29"', sku: 'SKU-CORP-MON-19', qty: 12, condition: 'Good' }
        ]
      }
      setInventory(defaultInventory)
      localStorage.setItem(key, JSON.stringify(defaultInventory))
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('*, companies(*)')
          .eq('auth_id', user.id)
          .single()

        if (profile?.companies) {
          const comp = profile.companies
          setCompany(comp)

          const category = comp.category || 'corporate'
          const featuresList = CATEGORY_FEATURES[category] || CATEGORY_FEATURES.corporate
          const found = featuresList.find((f) => f.id === featureId)
          if (found) {
            setFeature(found)

            // Programmatic Widget Type Detection based on ID keywords
            let detectedType: 'ai' | 'form' | 'calculator' | 'booking' | 'inventory' = 'form'
            const id = found.id
            if (id.includes('gemini') || id.includes('forecasting') || id.includes('optimizer') || id.includes('analyzer') || id.includes('sorter') || id.includes('drafter')) {
              detectedType = 'ai'
            } else if (id.includes('calculator') || id.includes('billing') || id.includes('payroll') || id.includes('splitter') || id.includes('expenses') || id.includes('allocation') || id.includes('reimbursement')) {
              detectedType = 'calculator'
            } else if (id.includes('booker') || id.includes('roster') || id.includes('scheduling') || id.includes('scheduler') || id.includes('calendar') || id.includes('pass') || id.includes('swap') || id.includes('rotation') || id.includes('routing') || id.includes('appointment')) {
              detectedType = 'booking'
            } else if (id.includes('inventory') || id.includes('vault') || id.includes('tracker') || id.includes('tracking') || id.includes('alerts') || id.includes('barcode') || id.includes('catalog') || id.includes('store') || id.includes('logistics') || id.includes('kit') || id.includes('merchandise')) {
              detectedType = 'inventory'
            }

            setWidgetType(detectedType)
            addLog(`System activated module type: ${detectedType.toUpperCase()}`)

            // Initialize mock database items
            initMockData(found.id, detectedType, category)
          }
        }
      } catch (err) {
        console.error('Error loading dynamic feature:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, featureId])

  // --- 1. AI Actions ---
  const handleTriggerAI = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiPrompt) return
    setActionLoading(true)
    addLog(`Memproses prompt simulasi: "${aiPrompt}"`)
    
    setTimeout(() => {
      setActionLoading(false)
      addLog(`Simulasi analisis selesai.`)
      
      // Contoh respons berbasis kata kunci industri (simulasi, bukan AI nyata)
      let response = `### Contoh Hasil Analisis (Simulasi)\n`
      response += `*Diproses pada: ${new Date().toLocaleString()}*\n\n`
      response += `Berdasarkan contoh parameter: **"${aiPrompt}"**, berikut format laporan yang dihasilkan modul ini:\n\n`
      response += `1. **Rekomendasi utama**: contoh penyesuaian jadwal/kerja untuk mencegah antrean atau kelelahan tim.\n`
      response += `2. **Prediksi efisiensi**: contoh estimasi peningkatan output departemen.\n`
      response += `3. **Langkah mitigasi**: contoh pengecekan stok/material kritis untuk 14 hari ke depan.\n\n`
      response += `*Status: contoh format laporan. Angka aktual mengikuti data perusahaan Anda.*`
      
      setAiResult(response)
    }, 1500)
  }

  // --- 2. Form Registry Actions ---
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName) return
    
    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      name: formName,
      val1: formVal1 || 'N/A',
      val2: formVal2 || 'Active',
      select: formSelect || 'General'
    }

    const updated = [newRecord, ...records]
    setRecords(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
    addLog(`New record successfully registered: "${formName}"`)

    // Reset Form
    setFormName('')
    setFormVal1('')
    setFormVal2('')
    setFormSelect('')
    setIsModalOpen(false)
  }

  const handleDeleteRecord = (id: string, name: string) => {
    const updated = records.filter(r => r.id !== id)
    setRecords(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
    addLog(`Deleted record: "${name}"`)
  }

  // --- 3. Calculator Actions ---
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    addLog(`Performing logistical math calculations...`)

    setTimeout(() => {
      setActionLoading(false)
      const v1 = parseFloat(calcVal1) || 0
      const v2 = parseFloat(calcVal2) || 0
      const v3 = parseFloat(calcVal3) || 0
      const subtotal = v1 + v2
      const total = subtotal - v3

      setCalcResult({
        subtotal,
        total,
        v1,
        v2,
        v3,
        invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleDateString()
      })
      addLog(`Calculation success. Net Total: Rp ${total.toLocaleString()}`)
    }, 1000)
  }

  // --- 4. Booking Actions ---
  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingTitle || !bookingTarget) return

    // Conflict Check
    const hasConflict = bookings.some(b => b.time === bookingTime && b.target.toLowerCase() === bookingTarget.toLowerCase())
    if (hasConflict) {
      gooeyToast.warning(`Conflict Warning: ${bookingTime} at ${bookingTarget} is already booked! Please select another time/location.`, { duration: 6000 })
      addLog(`CONFLICT: Schedule ${bookingTime} at ${bookingTarget} failed.`)
      return
    }

    const timeNum = parseInt(bookingTime)
    const displayTime = timeNum >= 12 
      ? `${timeNum === 12 ? 12 : timeNum - 12}:${bookingTime.split(':')[1]} PM`
      : `${timeNum === 0 ? 12 : timeNum}:${bookingTime.split(':')[1]} AM`

    const newBooking = {
      id: Math.random().toString(36).substring(2, 9),
      title: bookingTitle,
      time: displayTime,
      target: bookingTarget
    }

    const updated = [newBooking, ...bookings]
    setBookings(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
    addLog(`Booking scheduled: "${bookingTitle}" at ${displayTime}`)

    setBookingTitle('')
    setBookingTarget('')
  }

  const handleDeleteBooking = (id: string, title: string) => {
    const updated = bookings.filter(b => b.id !== id)
    setBookings(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
    addLog(`Reservation cancelled: "${title}"`)
  }

  // --- 5. Inventory Registry Actions ---
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName) return

    const newSku = itemSku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: itemName,
      sku: newSku,
      qty: parseInt(itemQty) || 0,
      condition: itemCondition
    }

    const updated = [newItem, ...inventory]
    setInventory(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
    addLog(`New item registered: "${itemName}" (${newSku})`)

    setItemName('')
    setItemSku('')
    setItemQty('10')
    setItemCondition('Good')
    setIsModalOpen(false)
  }

  const handleUpdateQty = (id: string, amt: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + amt)
        addLog(`Update stock "${item.name}": ${item.qty} -> ${newQty}`)
        return { ...item, qty: newQty }
      }
      return item
    })
    setInventory(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
  }

  const handleDeleteItem = (id: string, name: string) => {
    const updated = inventory.filter(i => i.id !== id)
    setInventory(updated)
    localStorage.setItem(`apex_data_${featureId}`, JSON.stringify(updated))
    addLog(`Removed inventory asset: "${name}"`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Building Dynamic Module...</span>
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-primary mx-auto" />
        <h1 className="text-xl font-bold font-sans uppercase">Module Not Found</h1>
        <p className="text-xs text-gray-500 font-mono leading-relaxed">
          This module is not available or has not been enabled by the admin.
        </p>
        <Link
          href={`/${slug}/dashboard`}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase bg-surface hover:bg-surface-hover border border-border px-4 py-2 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back To Control Center
        </Link>
      </div>
    )
  }

  const getAiSuggestion1 = () => {
    const cat = company?.category || 'corporate'
    if (cat === 'school') return 'Plan curriculum for the upcoming semester'
    if (cat === 'fnb') return 'Analyze best-selling dishes and profit margins'
    if (cat === 'retail') return 'Forecast fast-moving SKU sales targets for this quarter'
    if (cat === 'clinic') return 'Predict outpatient peak arrival times'
    if (cat === 'ngo') return 'Evaluate charity contribution channel effectiveness'
    return 'Optimize logistics routing trends based on historical data'
  }

  const getAiSuggestion2 = () => {
    const cat = company?.category || 'corporate'
    if (cat === 'school') return 'Analyze graduation rate statistics'
    if (cat === 'fnb') return 'Predict and mitigate inventory expiration risks'
    if (cat === 'retail') return 'Mitigate critical SKU stockout risks'
    if (cat === 'clinic') return 'Analyze outpatient queue management flow'
    if (cat === 'ngo') return 'Create disaster response volunteer deployment plans'
    return 'Analyze potential inventory stockouts this quarter'
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href={`/${slug}/dashboard`}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-gray-500 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [Back to Control Center]
        </Link>
      </div>

      {/* Simulation Notice Banner */}
      <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3.5 flex items-center gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs sm:text-sm font-semibold tracking-wide">
          SIMULASI — angka contoh, bukan data nyata
        </p>
      </div>

      {/* Feature Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
          {feature.name}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-3xl font-sans mt-2">
          {feature.description}
        </p>
      </div>

      {/* Dynamic Interactive Widgets */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-6">
          
          {/* 1. AI GENERATOR ENGINE */}
          {widgetType === 'ai' && (
            <div className="liquid-glass rounded-lg border border-border p-6 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 font-sans uppercase">Simulasi Analisis</h2>
                  <p className="text-[10px] font-mono text-gray-400">ENGINE: WORKSPACE_PRO_V2 // SECURE_MODE</p>
                </div>
              </div>

              <form onSubmit={handleTriggerAI} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-400">
                    AI Analysis Instructions / Prompt
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: Forecast logistics requirements or summarize division SOP for next month..."
                    rows={4}
                    required
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50 text-gray-800 transition-all duration-200 resize-none"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAiPrompt(getAiSuggestion1())}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 rounded-full text-[10px] font-sans text-gray-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  💡 {getAiSuggestion1()}
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt(getAiSuggestion2())}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 rounded-full text-[10px] font-sans text-gray-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  💡 {getAiSuggestion2()}
                </button>
              </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-sans text-xs font-bold uppercase rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {actionLoading ? 'AI Analyzing...' : 'Run AI Analysis'}
                </button>
              </form>

              {aiResult && (
                <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white animate-scaleUp">
                  <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 px-4 py-3 text-[10px] text-gray-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <span className="ml-2 font-sans font-semibold text-gray-600">ANALYSIS_REPORT.MD</span>
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(aiResult || ''); gooeyToast.success('Report copied to clipboard!'); }}
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer bg-white px-2.5 py-1 border border-gray-200 rounded-md font-sans text-[10px] font-bold"
                    >
                      [COPY REPORT]
                    </button>
                  </div>
                  <div className="p-5 font-sans text-xs text-gray-700 leading-relaxed space-y-3 whitespace-pre-line bg-gray-50/30">
                    {aiResult}
                    
                    {/* Simulated AI Projection Chart */}
                    <div className="mt-4 p-4 border border-gray-150 bg-white rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase">
                        <span>Efficiency Projection Chart (AI Model)</span>
                        <span className="text-primary font-bold">+14.2%</span>
                      </div>
                      <div className="h-20 w-full flex items-end">
                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F97316" stopOpacity="0.15"/>
                              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>
                          <path d="M 0,80 L 100,75 L 200,60 L 300,40 L 400,20 L 400,100 L 0,100 Z" fill="url(#aiGrad)" />
                          <path d="M 0,80 L 100,75 L 200,60 L 300,40 L 400,20" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="100" cy="75" r="3" fill="#F97316" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="200" cy="60" r="3" fill="#F97316" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="300" cy="40" r="3" fill="#F97316" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="400" cy="20" r="3" fill="#F97316" stroke="#FFF" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-gray-400">
                        <span>Week 1</span>
                        <span>Week 2</span>
                        <span>Week 3</span>
                        <span>Week 4</span>
                        <span>Week 5</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. REGISTRY DATABASE ENGINE (Forms) */}
          {widgetType === 'form' && (
            <div className="liquid-glass rounded-lg border border-border p-6 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 font-sans uppercase">Database Registry</h2>
                    <p className="text-[10px] font-mono text-gray-400">TABLE_STATE: SYNCHRONIZED</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white font-sans text-xs font-bold rounded-lg uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Record
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-sans font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Name / Entry</th>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-gray-150 font-sans text-gray-700">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{r.name}</td>
                          <td className="py-3.5 px-4 text-gray-500">{r.val1}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[10px]">
                              {r.select || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 uppercase text-[9px] font-semibold">
                              {r.val2}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRecord(r.id, r.name)}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 font-sans text-xs">
                            No records registered in this registry yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. CALCULATOR ENGINE */}
          {widgetType === 'calculator' && (
            <div className="liquid-glass rounded-lg border border-border p-6 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 font-sans uppercase">Financial & Payroll Calculator</h2>
                  <p className="text-[10px] font-mono text-gray-400">CALCULATOR_MODE: SALARY_AND_TAX_v1</p>
                </div>
              </div>

              <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-500 mb-1.5">
                    Basic Salary / Base Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-gray-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={calcVal1}
                      onChange={(e) => setCalcVal1(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/10 text-gray-800 transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-500 mb-1.5">
                    Allowances / Claims / Additions
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-gray-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={calcVal2}
                      onChange={(e) => setCalcVal2(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/10 text-gray-800 transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-500 mb-1.5">
                    Deductions / Taxes / Fines
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-gray-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={calcVal3}
                      onChange={(e) => setCalcVal3(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/10 text-gray-800 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="md:col-span-3 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-sans text-xs font-bold uppercase rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  {actionLoading ? 'Calculating Salary...' : 'Calculate Financials & Print Ledger'}
                </button>
              </form>

              {calcResult && (
                <div className="p-6 border border-gray-200 bg-gray-50/30 rounded-2xl max-w-md mx-auto space-y-4 font-mono text-xs text-gray-700 shadow-sm border-dashed border-2 relative animate-scaleUp">
                  {/* Cutout circles on left and right for ticket texture */}
                  <div className="absolute -left-3 top-1/2 -mt-2.5 w-5 h-5 rounded-full bg-white border-r border-gray-200" />
                  <div className="absolute -right-3 top-1/2 -mt-2.5 w-5 h-5 rounded-full bg-white border-l border-gray-200" />

                  <div className="text-center border-b border-gray-200 pb-3">
                    <span className="text-xs font-bold uppercase text-gray-900 tracking-wider">OFFICIAL RECEIPT / LEDGER</span>
                    <p className="text-[9px] text-gray-400 mt-1">{calcResult.invoiceId}{' / '}{calcResult.date}</p>
                  </div>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex justify-between">
                      <span>Base Value:</span>
                      <span className="font-bold text-gray-900">Rp {calcResult.v1.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances/Additions:</span>
                      <span className="font-semibold text-green-600">+ Rp {calcResult.v2.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 border-dashed pb-3">
                      <span>Deductions/Taxes/Fines:</span>
                      <span className="text-red-600 font-bold">- Rp {calcResult.v3.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-foreground pt-1">
                      <span>NET TOTAL:</span>
                      <span className="text-primary underline decoration-dotted">Rp {calcResult.total.toLocaleString()}</span>
                    </div>

                    {/* Comparative Budget Allocation Chart */}
                    <div className="pt-2 pb-1 space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono">Nominal Allocation Chart</span>
                      <div className="w-full h-2 bg-gray-200 rounded-full flex overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${(calcResult.v1 / Math.max(1, calcResult.v1 + calcResult.v2)) * 100}%` }} />
                        <div className="bg-green-500 h-full" style={{ width: `${(calcResult.v2 / Math.max(1, calcResult.v1 + calcResult.v2)) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                        <span>Base: {Math.round((calcResult.v1 / Math.max(1, calcResult.v1 + calcResult.v2)) * 100)}%</span>
                        <span>Allowance: {Math.round((calcResult.v2 / Math.max(1, calcResult.v1 + calcResult.v2)) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* MOCKED BARCODE */}
                  <div className="flex justify-center items-center gap-0.5 pt-4 pb-2">
                    {[2,1,4,2,3,1,2,1,3,4,1,2,3,1,2,1,4,2].map((w, idx) => (
                      <span key={idx} className="bg-gray-800 h-8" style={{ width: `${w}px` }} />
                    ))}
                  </div>

                  <div className="flex justify-center gap-2 pt-3 border-t border-gray-200 border-dashed">
                    <button 
                      onClick={() => gooeyToast.info('Document sent to printer.')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-bold rounded-lg uppercase cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-500" /> Print
                    </button>
                    <button 
                      onClick={() => gooeyToast.info('PDF download started.')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-bold rounded-lg uppercase cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" /> PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. BOOKING / CALENDAR ENGINE */}
          {widgetType === 'booking' && (
            <div className="liquid-glass rounded-lg border border-border p-6 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 font-sans uppercase">Reservation & Activity Schedule</h2>
                  <p className="text-[10px] font-mono text-gray-400">SCHEDULING_ENGINE: TIMELINE_LIVE</p>
                </div>
              </div>
              
              <form onSubmit={handleSaveBooking} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-500 mb-1.5">
                    Activity Name / Shift
                  </label>
                  <input
                    type="text"
                    value={bookingTitle}
                    onChange={(e) => setBookingTitle(e.target.value)}
                    required
                    placeholder="e.g. Coordination Meeting"
                    className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-primary/10 text-gray-800 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-500 mb-1.5">
                    Target Location / Officer
                  </label>
                  <input
                    type="text"
                    value={bookingTarget}
                    onChange={(e) => setBookingTarget(e.target.value)}
                    required
                    placeholder="e.g. Meeting Room A / Officer John"
                    className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-primary/10 text-gray-800 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase text-gray-500 mb-1.5">
                    Start Time
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-primary/50 focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/10 text-gray-800 transition-all duration-200"
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="md:col-span-3 py-3 bg-primary hover:bg-primary-hover text-white font-sans text-xs font-bold uppercase rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2"
                >
                  Register Schedule
                </button>
              </form>

              <div className="space-y-3 pt-4">
                <h3 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">Active Schedules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map(b => (
                    <div key={b.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 border-l-4 border-l-primary flex justify-between items-center transition-all duration-200 relative shadow-sm">
                      <div className="space-y-1">
                        <span className="font-bold text-gray-900 text-xs block">{b.title}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide block">{b.target}</span>
                        <span className="text-[10px] text-primary font-bold inline-flex items-center gap-1 mt-1 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                          <Clock className="w-3 h-3 text-primary" /> {b.time}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteBooking(b.id, b.title)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Cancel Schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div className="md:col-span-2 py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl font-sans text-xs">
                      No active schedules or reservations registered.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. INVENTORY REGISTRY ENGINE */}
          {widgetType === 'inventory' && (
            <div className="liquid-glass rounded-lg border border-border p-6 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                    <Tag className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 font-sans uppercase">Warehouse Assets & Inventory</h2>
                    <p className="text-[10px] font-mono text-gray-400">STOCK_STATE: ACCURATE</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white font-sans text-xs font-bold rounded-lg uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-sans font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">SKU / Barcode</th>
                        <th className="py-3 px-4">Stock Units</th>
                        <th className="py-3 px-4">Condition</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-gray-150 font-sans text-gray-700">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{item.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-[10px]">
                              {item.sku}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">{item.qty} Pcs</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase border font-semibold ${
                              item.condition === 'Good'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : item.condition === 'Maintenance'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="w-6 h-6 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                              title="Add Stock"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="w-6 h-6 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                              title="Reduce Stock"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center ml-1"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {inventory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 font-sans text-xs">
                            No assets registered in this warehouse yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DYNAMIC MODALS SECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          {/* Modal Form Registry */}
          {widgetType === 'form' && (
            <div className="bg-white border border-border rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleUp">
              <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Add Database Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-foreground text-xs font-mono">[CLOSE]</button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Name / Entry Title</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Staff name, student, item, etc..."
                    className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Description / Division</label>
                  <input
                    type="text"
                    value={formVal1}
                    onChange={(e) => setFormVal1(e.target.value)}
                    placeholder="Leave reason, student grade, etc..."
                    className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Primary Status</label>
                    <input
                      type="text"
                      value={formVal2}
                      onChange={(e) => setFormVal2(e.target.value)}
                      placeholder="Active, Paid, Approved..."
                      className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Additional Category</label>
                    <input
                      type="text"
                      value={formSelect}
                      onChange={(e) => setFormSelect(e.target.value)}
                      placeholder="Regular, Charity, Gold..."
                      className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </form>
            </div>
          )}

          {/* Modal Add Inventory */}
          {widgetType === 'inventory' && (
            <div className="bg-white border border-border rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleUp">
              <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Register New Inventory</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-foreground text-xs font-mono">[CLOSE]</button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Item / Asset Name</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    placeholder="e.g. Cisco Router v3"
                    className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Barcode / SKU Number (Optional)</label>
                  <input
                    type="text"
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    placeholder="e.g. SKU-NET-902 (Leave blank to generate)"
                    className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Item Condition</label>
                    <select
                      value={itemCondition}
                      onChange={(e) => setItemCondition(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground"
                    >
                      <option value="Good">Good (Normal)</option>
                      <option value="Maintenance">Under Maintenance</option>
                      <option value="Damaged">Damaged / Discarded</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
                >
                  Register New Asset
                </button>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
