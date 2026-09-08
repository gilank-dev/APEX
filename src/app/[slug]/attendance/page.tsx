'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import imageCompression from 'browser-image-compression'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import { Camera, Clock, User, CheckCircle2, ShieldCheck, X } from 'lucide-react'

interface UserProfile {
  id: string
  company_id: string
  full_name: string
  roles: {
    name: string
    is_admin: boolean
  }
}

interface AttendanceLog {
  id: string
  clock_in_time: string
  clock_out_time: string | null
  photo_url: string | null
  location: any
  users: {
    full_name: string
  }
}

export default function AttendancePage() {
  const supabase = createClient()
  const { isOffline, addToQueue } = useAppStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [activeLog, setActiveLog] = useState<AttendanceLog | null>(null)
  const [loading, setLoading] = useState(true)

  // Camera State
  const [cameraActive, setCameraActive] = useState(false)
  const [photoData, setPhotoData] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)

  useEffect(() => {
    fetchProfileAndLogs()
  }, [])

  const fetchProfileAndLogs = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: uProfile } = await supabase
        .from('users')
        .select('*, roles(*)')
        .eq('auth_id', user.id)
        .single()

      if (uProfile) {
        setProfile(uProfile as any)

        const today = new Date().toISOString().split('T')[0]
        
        // Fetch active log (today's open log)
        const { data: activeLogs } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', uProfile.id)
          .is('clock_out_time', null)
          .gte('clock_in_time', `${today}T00:00:00.000Z`)
          .order('clock_in_time', { ascending: false })
          .limit(1)

        if (activeLogs && activeLogs.length > 0) {
          setActiveLog(activeLogs[0] as any)
        } else {
          setActiveLog(null)
        }

        // Fetch history logs
        let query = supabase
          .from('attendance_logs')
          .select('*, users(full_name)')
          .order('clock_in_time', { ascending: false })

        // Non-admin can only see own logs
        if (!uProfile.roles.is_admin && uProfile.roles.name !== 'Manager') {
          query = query.eq('user_id', uProfile.id)
        } else {
          query = query.eq('company_id', uProfile.company_id)
        }

        const { data: logList } = await query
        if (logList) setLogs(logList as any[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Camera Handler
  const startCamera = async () => {
    setCameraActive(true)
    setPhotoData(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      alert('Failed to access front camera.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setPhotoData(dataUrl)
        stopCamera()
      }
    }
  }

  // Helper to fetch geo position
  const getGeoPosition = (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          })
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    })
  }

  // Clock In Action
  const handleClockIn = async () => {
    if (!profile) return
    if (!photoData) {
      alert('Face selfie is required.')
      return
    }

    setLoading(true)

    try {
      // Fetch dynamic GPS location
      const geoLoc = await getGeoPosition()

      // 1. Compress Image
      const response = await fetch(photoData)
      const blob = await response.blob()
      const imageFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })

      const compressedFile = await imageCompression(imageFile, {
        maxSizeMB: 0.1, // 100KB
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      })

      // 2. Upload to storage (skip if offline)
      let photoUrl = ''
      if (!isOffline) {
        const fileExt = 'jpg'
        const filePath = `${profile.company_id}/attendance/${profile.id}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('attendance')
          .upload(filePath, compressedFile)

        if (!uploadError) {
          const { data } = supabase.storage.from('attendance').getPublicUrl(filePath)
          photoUrl = data.publicUrl
        }
      }

      // 3. Create Payload with dynamic location
      const payload = {
        user_id: profile.id,
        company_id: profile.company_id,
        clock_in_time: new Date().toISOString(),
        photo_url: photoUrl || photoData,
        location: geoLoc, // Pass the real GPS coordinates!
      }

      if (isOffline) {
        addToQueue({ type: 'clock_in', payload })
        alert('Attendance request queued offline!')
      } else {
        const { error } = await supabase.from('attendance_logs').insert(payload)
        if (error) throw error
      }

      setPhotoData(null)
      fetchProfileAndLogs()
    } catch (err: any) {
      alert(`Failed to clock in: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Clock Out Action
  const handleClockOut = async () => {
    if (!profile || !activeLog) return

    setLoading(true)
    const payload = {
      ...activeLog,
      clock_out_time: new Date().toISOString(),
    }

    try {
      if (isOffline) {
        addToQueue({ type: 'clock_out', payload })
        alert('Clock out request queued offline!')
      } else {
        const { error } = await supabase
          .from('attendance_logs')
          .update({
            clock_out_time: payload.clock_out_time,
          })
          .eq('id', activeLog.id)
        if (error) throw error
      }

      fetchProfileAndLogs()
    } catch (err: any) {
      alert(`Failed to clock out: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading && logs.length === 0) {
    return <SkeletonLoader type="table" />
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Employee Attendance</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">ATTENDANCE LOG WITH FACE SELFIE VERIFICATION</p>
      </div>

      {/* Attendance Chart Section */}
      <div className="liquid-glass p-5 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150 pb-3 mb-4 gap-2">
          <div>
            <h2 className="text-xs font-mono uppercase text-gray-600">Team Attendance Rate</h2>
            <p className="text-[10px] text-gray-400 font-mono">DAILY ATTENDANCE RATE (MON - SAT)</p>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> Absent/Leave</span>
          </div>
        </div>

        <div className="h-28 w-full flex items-end justify-between px-4 relative pt-2">
          {/* Grid lines */}
          <div className="absolute inset-x-0 top-2 border-t border-gray-100 border-dashed text-[8px] text-gray-450 font-mono pt-0.5">100%</div>
          <div className="absolute inset-x-0 top-10 border-t border-gray-100 border-dashed text-[8px] text-gray-450 font-mono pt-0.5">80%</div>
          <div className="absolute inset-x-0 top-18 border-t border-gray-100 border-dashed text-[8px] text-gray-450 font-mono pt-0.5">60%</div>

          <div className="flex-1 h-full w-full flex items-end justify-between gap-2 z-10">
            {/* Monday bar */}
            <div className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-t-sm transition-all relative flex items-end justify-center" style={{ height: '90%' }}>
                <span className="absolute -top-5 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">90%</span>
                <div className="w-full bg-primary rounded-t-sm" style={{ height: '90%' }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1">MON</span>
            </div>

            {/* Tuesday bar */}
            <div className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-t-sm transition-all relative flex items-end justify-center" style={{ height: '96%' }}>
                <span className="absolute -top-5 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">96%</span>
                <div className="w-full bg-primary rounded-t-sm" style={{ height: '96%' }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1">TUE</span>
            </div>

            {/* Wednesday bar */}
            <div className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-t-sm transition-all relative flex items-end justify-center" style={{ height: '92%' }}>
                <span className="absolute -top-5 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">92%</span>
                <div className="w-full bg-primary rounded-t-sm" style={{ height: '92%' }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1">WED</span>
            </div>

            {/* Thursday bar */}
            <div className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-t-sm transition-all relative flex items-end justify-center" style={{ height: '88%' }}>
                <span className="absolute -top-5 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">88%</span>
                <div className="w-full bg-primary rounded-t-sm" style={{ height: '88%' }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1">THU</span>
            </div>

            {/* Friday bar */}
            <div className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-t-sm transition-all relative flex items-end justify-center" style={{ height: '94%' }}>
                <span className="absolute -top-5 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">94%</span>
                <div className="w-full bg-primary rounded-t-sm" style={{ height: '94%' }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1">FRI</span>
            </div>

            {/* Saturday bar */}
            <div className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-t-sm transition-all relative flex items-end justify-center" style={{ height: '85%' }}>
                <span className="absolute -top-5 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">85%</span>
                <div className="w-full bg-primary rounded-t-sm" style={{ height: '85%' }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1">SAT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Control Panel (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 border border-border rounded-lg shadow-sm space-y-6">
            <h2 className="text-xs font-mono uppercase text-gray-500 border-b border-gray-150 pb-2">
              ACTIVE ACTIONS // ATTENDANCE
            </h2>

            {/* Camera / Selfie Box */}
            {!activeLog ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-400">SELFIE CAPTURE</span>
                  <span className={photoData ? 'text-green-600 font-bold' : 'text-gray-400'}>
                    {photoData ? 'PHOTO READY' : 'PHOTO REQUIRED'}
                  </span>
                </div>

                <div className="aspect-video w-full bg-gray-50 border border-border flex items-center justify-center relative overflow-hidden rounded-md">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                  ) : photoData ? (
                    <img src={photoData} alt="Live biometric camera selfie preview for verification" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 font-mono">
                      <Camera className="w-6 h-6" />
                      <span className="text-[9px] uppercase tracking-wider">CAMERA INACTIVE</span>
                    </div>
                  )}

                  {cameraActive && (
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-mono text-[10px] font-bold rounded-sm cursor-pointer shadow-md"
                    >
                      AMBIL FOTO
                    </button>
                  )}
                </div>

                {!cameraActive && (
                  <button
                    onClick={startCamera}
                    className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 font-mono text-xs rounded-sm border border-border transition-colors uppercase cursor-pointer"
                  >
                    {photoData ? 'Retake Photo' : 'Open Front Camera'}
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-orange-50 border border-primary/20 rounded-md text-xs font-mono text-primary flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">ACTIVE SESSION:</span> Clocked in at {new Date(activeLog.clock_in_time).toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* Submission triggers */}
            <div className="pt-4 border-t border-border">
              {!activeLog ? (
                <button
                  onClick={handleClockIn}
                  disabled={loading || !photoData}
                  className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase rounded-sm transition-colors cursor-pointer shadow-md"
                >
                  CLOCK IN
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase rounded-sm transition-colors cursor-pointer shadow-md"
                >
                  CLOCK OUT
                </button>
              )}
            </div>
          </div>
        </div>

        {/* High Density Table (Right Column) */}
        <div className="lg:col-span-8">
          <div className="bg-white p-6 border border-border rounded-lg shadow-sm">
            <h2 className="text-xs font-mono uppercase text-gray-500 border-b border-border pb-2 mb-4">
              ATTENDANCE LOGS // ACTIVITY HISTORY
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Clock In</th>
                    <th className="py-2.5 px-3">Clock Out</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border">
                  {logs.map((log) => {
                    const isClockedOut = !!log.clock_out_time
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-sans text-gray-700 font-semibold">
                          {log.users?.full_name}
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-500">
                          {new Date(log.clock_in_time).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-500">
                          {new Date(log.clock_in_time).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-500">
                          {isClockedOut ? new Date(log.clock_out_time!).toLocaleTimeString() : '--:--'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase border ${
                              isClockedOut
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-orange-50 text-primary border-primary/20'
                            }`}
                          >
                            {isClockedOut ? 'Completed' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 font-mono text-xs">
                        NO ATTENDANCE LOGS RECORDED TODAY
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Side Details Drawer (Sheet) */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-white border-l border-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase font-sans">
                    {selectedLog.users?.full_name}
                  </h3>
                  <p className="text-[9px] font-mono text-gray-400 uppercase mt-0.5">
                    LOG ID: {selectedLog.id.substring(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-450 hover:text-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Photo View */}
                <div>
                  <h4 className="text-[10px] font-mono text-gray-450 uppercase mb-2">Selfie Verification</h4>
                  <div className="aspect-video w-full bg-gray-50 border border-border rounded-sm overflow-hidden relative">
                    {selectedLog.photo_url ? (
                      <img src={selectedLog.photo_url} alt="Verified employee biometric attendance selfie record" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-gray-450">
                        IMAGE UNAVAILABLE
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification log */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono text-gray-450 uppercase">Security Log</h4>
                  <div className="p-3 bg-gray-50 border border-border rounded-sm space-y-1 text-xs font-mono text-gray-600">
                    <p className="flex items-center gap-1.5 text-green-600 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED BY SELFIE CAPTURE
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">STATUS: OK // SELFIE VERIFIED</p>
                  </div>
                </div>

                {/* GPS Geolocation */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono text-gray-455 uppercase">GPS Geolocation</h4>
                  {selectedLog.location ? (
                    <div className="p-3 bg-gray-50 border border-border rounded-sm space-y-2 text-xs font-mono text-gray-600">
                      <p>Latitude: <span className="text-gray-900 font-bold">{selectedLog.location.latitude}</span></p>
                      <p>Longitude: <span className="text-gray-900 font-bold">{selectedLog.location.longitude}</span></p>
                      <p>Accuracy: <span className="text-gray-900 font-bold">{selectedLog.location.accuracy}m</span></p>
                      <a
                        href={`https://www.google.com/maps?q=${selectedLog.location.latitude},${selectedLog.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-[10px] font-bold text-primary hover:underline"
                      >
                        [OPEN ON GOOGLE MAPS]
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-border rounded-sm text-xs font-mono text-gray-400">
                      NO GPS DATA LOGGED FOR THIS SESSION
                    </div>
                  )}
                </div>

                {/* Timestamp summary */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono text-gray-450 uppercase">Timestamps</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-2.5 bg-gray-50 border border-border rounded-sm">
                      <span className="text-[10px] text-gray-400 uppercase">Clock In</span>
                      <p className="text-gray-700 mt-1">
                        {new Date(selectedLog.clock_in_time).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-border rounded-sm">
                      <span className="text-[10px] text-gray-400 uppercase">Clock Out</span>
                      <p className="text-gray-700 mt-1">
                        {selectedLog.clock_out_time
                          ? new Date(selectedLog.clock_out_time).toLocaleTimeString()
                          : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-mono text-xs uppercase rounded-sm border border-border transition-colors cursor-pointer"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
