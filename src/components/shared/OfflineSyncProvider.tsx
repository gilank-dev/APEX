'use client'

import { useEffect, useRef, useState } from 'react'
import { GooeyToaster } from 'goey-toast'
import { useAppStore, type OfflineAction } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { retryDelayMs } from '@/lib/backoff'

// How long the "sync completed" banner stays visible.
const DONE_BANNER_MS = 3000

// Module-level on purpose: react-hooks/purity flags Date.now() inside
// component bodies even when only reached from async handlers.
function buildSyncPhotoPath(action: OfflineAction): string {
  return `${action.payload.company_id}/attendance/${action.payload.user_id}_${Date.now()}_sync.jpg`
}

type SyncState = 'idle' | 'syncing' | 'done' | 'failed'

export default function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const isOffline = useAppStore((s) => s.isOffline)
  const offlineQueue = useAppStore((s) => s.offlineQueue)
  const setOffline = useAppStore((s) => s.setOffline)

  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [nextRetrySec, setNextRetrySec] = useState<number | null>(null)

  const syncingRef = useRef(false)
  const attemptRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const runSync = async () => {
    if (syncingRef.current) return
    // Never burn retry attempts while the browser itself reports offline.
    if (typeof window !== 'undefined' && !window.navigator.onLine) return

    // Read the queue fresh from the store: retry timers can outlive renders
    // and a stale closure would re-sync already-drained actions.
    const queue = useAppStore.getState().offlineQueue
    if (queue.length === 0) return

    const supabase = createClient()
    const removeFromQueue = useAppStore.getState().removeFromQueue

    syncingRef.current = true
    clearTimers()
    setSyncState('syncing')
    setNextRetrySec(null)

    let failed = 0
    for (const action of queue) {
      let success = false
      try {
        if (action.type === 'clock_in') {
          let photoUrl: string | null = action.payload.photo_url ?? null
          // Offline captures kept the compressed data URL in the queue.
          // Upload to the private bucket now and store the path instead.
          if (photoUrl && photoUrl.startsWith('data:')) {
            try {
              const blob = await (await fetch(photoUrl)).blob()
              const filePath = buildSyncPhotoPath(action)
              const { error: upErr } = await supabase.storage.from('attendance').upload(filePath, blob)
              if (!upErr) {
                photoUrl = filePath
              }
            } catch {
              // keep data URL: better a log with an inline photo than a lost attendance
            }
          }
          const { error } = await supabase.from('attendance_logs').insert({ ...action.payload, photo_url: photoUrl })
          // 23505: open session already exists. Treat as synced (no data loss).
          if (!error || error.code === '23505') success = true
        } else if (action.type === 'clock_out') {
          // Only close a session that is still open. Never overwrite an
          // existing clock-out with a stale offline timestamp.
          const { data: closed } = await supabase
            .from('attendance_logs')
            .update({ clock_out_time: action.payload.clock_out_time })
            .eq('id', action.payload.id)
            .is('clock_out_time', null)
            .select('id')
          if (closed && closed.length > 0) success = true
          else success = true // already closed online: nothing to do, drop from queue
        } else if (action.type === 'create_task') {
          const { error } = await supabase.from('tasks').insert(action.payload)
          if (!error) success = true
        } else if (action.type === 'update_task_status') {
          const { error } = await supabase
            .from('tasks')
            .update({ status: action.payload.status, updated_at: new Date().toISOString() })
            .eq('id', action.payload.id)
          if (!error) success = true
        } else if (action.type === 'create_asset') {
          const { error } = await supabase.from('inventory_assets').insert(action.payload)
          if (!error) success = true
        } else if (action.type === 'update_asset') {
          const { error } = await supabase
            .from('inventory_assets')
            .update({
              quantity: action.payload.quantity,
              condition: action.payload.condition,
              last_checked_by: action.payload.last_checked_by,
              updated_at: new Date().toISOString(),
            })
            .eq('id', action.payload.id)
          if (!error) success = true
        }
      } catch {
        // Network-level failure on this item. Keep it queued and keep
        // draining the rest so one bad row does not stall the whole queue.
        failed += 1
        continue
      }

      if (success) {
        removeFromQueue(action.id)
      } else {
        failed += 1
      }
    }

    syncingRef.current = false

    if (failed > 0) {
      // Exponential backoff: 2s, 4s, 8s ... capped at 60s. Attempts reset
      // on full success, on the 'online' event, and on manual retry.
      const delayMs = retryDelayMs(attemptRef.current)
      attemptRef.current += 1
      setSyncState('failed')
      setNextRetrySec(Math.round(delayMs / 1000))
      retryTimerRef.current = setTimeout(() => void runSync(), delayMs)
    } else {
      attemptRef.current = 0
      setSyncState('done')
      hideTimerRef.current = setTimeout(() => setSyncState('idle'), DONE_BANNER_MS)
    }
  }

  const retryNow = () => {
    attemptRef.current = 0
    void runSync()
  }

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false)
      attemptRef.current = 0 // fresh connection: restart the backoff ladder
      void runSync()
    }
    const handleOffline = () => {
      setOffline(true)
      clearTimers() // no point auto-retrying while offline; 'online' re-kicks sync
      setSyncState('idle')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (window.navigator.onLine) {
      void runSync()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Zustand persist rehydrates the queue from IndexedDB AFTER mount, so the
  // mount effect alone can miss a non-empty persisted queue. Kick a sync
  // whenever a non-empty queue appears while online and no sync is running.
  useEffect(() => {
    if (offlineQueue.length === 0 || syncingRef.current) return
    if (typeof window !== 'undefined' && !window.navigator.onLine) return
    void runSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineQueue])

  const queuedLabel = `${offlineQueue.length} ACTION${offlineQueue.length === 1 ? '' : 'S'} QUEUED`

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <GooeyToaster position="top-center" />
      {isOffline && (
        <div className="bg-orange-50 border-b border-orange-200 py-1.5 px-4 text-center text-xs font-mono text-primary flex items-center justify-center gap-2 select-none">
          <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
          CONNECTION DISRUPTED{' // OFFLINE MODE ACTIVE ('}{offlineQueue.length} QUEUED)
        </div>
      )}
      {syncState === 'syncing' && (
        <div className="bg-blue-50 border-b border-blue-200 py-1.5 px-4 text-center text-xs font-mono text-blue-600 flex items-center justify-center gap-2 select-none">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          SYNCHRONIZING OFFLINE QUEUE ({offlineQueue.length} REMAINING)
        </div>
      )}
      {syncState === 'done' && (
        <div className="bg-green-50 border-b border-green-200 py-1.5 px-4 text-center text-xs font-mono text-green-600 flex items-center justify-center gap-2 select-none">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          SYNCHRONIZATION COMPLETED
        </div>
      )}
      {syncState === 'failed' && (
        <div className="bg-red-50 border-b border-red-200 py-1.5 px-4 text-center text-xs font-mono text-red-600 flex items-center justify-center gap-2 select-none">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          SYNC FAILED{' // '}{queuedLabel}{' // AUTO-RETRY IN '}{nextRetrySec ?? '...'}S
          <button
            onClick={retryNow}
            className="underline underline-offset-2 hover:text-red-700 cursor-pointer uppercase"
          >
            Retry now
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  )
}
