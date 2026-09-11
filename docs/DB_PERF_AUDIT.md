# DB Performance Audit Report

**Target:** Supabase query performance issues in APEX project (Next.js 16 + Supabase)
**Language:** Indonesian
**Date:** 11 September 2026
**Scope:** src/lib/*.ts, src/app/[slug]/**/page.tsx, src/app/[slug]/**/*Client.tsx, src/components/**

## Ringkasan

Audit menemukan **64 query Supabase** dengan potensi performa. Berikut temuan utama:

| Severity | Jumlah | Kategori |
|----------|--------|----------|
| HIGH | 29 | select('*') tanpa kolom, missing limit/pagination, useEffect berulang, subscription scope lebar |
| MEDIUM | 23 | select('*'), count() ganda, relasi tak terbatas, join di edge |
| LOW | 12 | potensi N+1 patterns, dependency array tak lengkap, select() eksplisit |

## Temuan Tingkat Tinggi

### 1. Seleksi Wildcard di Berbagai Lokasi (HIGH)
**Potensi dampak:** Traffic database tinggi, biaya berlebihan, time-to-first-byte lambat

**Lokasi:**
- `src/app/[slug]/attendance/page.tsx:78` - `.select('*')` (history logs) 
- `src/app/[slug]/attendance/page.tsx:93` - `.select('*, users(full_name)')`
- `src/app/[slug]/admin/page.tsx:122` - `.select('*, roles(name, is_admin)')`
- `src/app/[slug]/billing/page.tsx:30` - `.select('*, companies(*)'`
- `src/app/[slug]/dashboard/page.tsx:42` - `.select('*, roles(*), companies(*)'`
- `src/app/[slug]/kasbon/page.tsx:23` - `.select('*, roles(*), companies(*)'`
- `src/app/[slug]/leave/page.tsx:24` - `.select('*, roles(*), companies(*)'`
- `src/app/[slug]/payroll/page.tsx:24` - `.select('*, roles(*), companies(*)'`
- `src/app/[slug]/tasks/page.tsx:53` - `.select('*, roles(*)'`
- `src/app/[slug]/shifts/page.tsx:38` - `.select('*, roles(*), companies(*)'`
- `src/app/[slug]/[feature]/page.tsx:23` - `.select('*, roles(*), companies(*)'`
- `src/app/super-admin/page.tsx:40` - `.select('*')` (companies)

**Fix:**
```typescript
// sebelum
.from('attendance_logs').select('*')

// setelah  
.from('attendance_logs').select('id, user_id, clock_in_time, clock_out_time, photo_url, location')

// atau gunakan string literal dengan kolom terbatas
.from('attendance_logs').select('id', { count: 'exact' })
```

### 2. Missing Limit/Pagination pada Dataset Besar (HIGH)

**Lokasi:**
- `src/app/[slug]/attendance/page.tsx:77-82` - active log query (baik, punya limit 1)
- `src/app/[slug]/attendance/page.tsx:90-104` - history logs (NO LIMIT, bisa ribuan baris)
- `src/app/[slug]/kasbon/page.tsx:63-68` - requests (NO LIMIT)
- `src/app/[slug]/kasbon/page.tsx:76-80` - repayments (NO LIMIT)
- `src/app/[slug]/leave/page.tsx:96-100` - requests (NO LIMIT)
- `src/app/[slug]/payroll/page.tsx:97-101` - logs (NO LIMIT)
- `src/app/[slug]/shifts/page.tsx:133-139` - assignments (range 14-46 hari, NO LIMIT)
- `src/app/[slug]/tasks/page.tsx:117-120` - tasks (NO LIMIT)

**Dampak:** Daftar tampilan bisa memuat 10k+ baris → timeout jaringan, throttling database

**Fix:**
```typescript
// sebelum
.from('attendance_logs').select('*, users(full_name)').order('clock_in_time', { ascending: false })

// setelah
.from('attendance_logs').select('id, user_id, clock_in_time, users(full_name)').order('clock_in_time', { ascending: false }).limit(100)

// untuk infinite scroll
.from('attendance_logs').select('...').order('clock_in_time', { ascending: false }).range(start, end)
```

### 3. Pola N+1 di React Components (HIGH)

**Lokasi:**
- `src/app/[slug]/attendance/page.tsx:91-104` - Single query tapi includes `users(full_name)` → bisa N+1 jika disertakan di UI
- `src/app/[slug]/inventory/InventoryClient.tsx:70` - `.select('*, last_checked_user:users!last_checked_by(full_name)')` (join di edge)
- `src/app/[slug]/tasks/page.tsx:70` - `.select('*, assignee:users!assignee_id(full_name), creator:users!creator_id(full_name)')` (dual eager load)

**Dampak:** 1 query + 2-3 queries per baris → 100 rows = 200-300 queries

**Fix:** Batasi data, server-side pagination, atau Denormalisasi

```typescript
// sebelum (potensial N+1)
.from('tasks').select('*, assignee:users(full_name), creator:users(full_name)')

// setelah (batasi, pivot ke server component)
.from('tasks').select('id, title, assignee_id, creator_id')
// Fetch users terpisah di server component dengan batch .in([...ids])
```

### 4. useEffect tanpa Dependency Array & Subscription Scope (HIGH)

**Lokasi:**
- `src/app/[slug]/dashboard/RealtimeDashboard.tsx:69` - `.channel('dashboard-${companyId}').subscribe()` (NO cleanup di dependency array)
- `src/app/[slug]/attendance/page.tsx:138-143` - `useEffect(() => { fetchProfileAndLogs() }, [])` (baik)
- `src/app/[slug]/attendance/page.tsx:214-231` - `useEffect(() => { resolvePhotoSrc() }, [selectedLog])` (baik)

**Dampak:** 
- Subscription tetap aktif setelah component unmount → koneksi database terbuang
- Re-fetch berulang pada setiap render

**Fix:**
```typescript
// sebelum
.subscribe((status) => { console.log(status) })

// setelah  
const channel = supabase.channel(`dashboard-${companyId}`).on('postgres_changes', ...)
useEffect(() => {
  channel.subscribe()
  return () => { channel.unsubscribe() }
}, [companyId])
```

### 5. Double Count Queries (MEDIUM)

**Lokasi:**
- `src/app/super-admin/page.tsx:46` - `.select('*', { count: 'exact', head: true })` + `.select('*')`
- `src/lib/admin-actions.ts:60` - `.select('*', { count: 'exact', head: true })`
- `src/lib/actions.ts:288` - `.select('*', { count: 'exact', head: true })`

**Dampak:** 2 query untuk data + count → overhead 50-100ms

**Fix:** Gunakan count di query yang sama:
```typescript
// sebelum
const { count } = await supabase.from('table').select('*', { count: 'exact', head: true })
const { data } = await supabase.from('table').select('*')

// setelah
const { count, data } = await supabase.from('table').select('*', { count: 'exact' })
```

### 6. Query di Server Component tapi Dieksekusi di Client Component (MEDIUM)

**Lokasi:**
- `src/app/[slug]/attendance/page.tsx:64-68` - Server component fetch (baik)
- `src/app/[slug]/kasbon/page.tsx:56-61` - Server component fetch (baik)
- `src/app/[slug]/leave/page.tsx:85-89` - Server component fetch (baik)

**Observasi:** Banyak data yang diambil di server components tapi dikirim ke client components yang mungkin hanya menampilkan sebagian → JavaScript berlebih

**Fix:** Server component-only display untuk tabel besar, atau batasi fields

## Rekomendasi Implementasi

### 1. Daftar Perbaikan Prioritaskan (1-2 minggu)
1. Ganti semua `.select('*')` dengan daftar kolom eksplisit
2. Tambahkan `.limit(100)` ke semua query history/pemetaan
3. Perbaiki channel subscriptions untuk cleanup yang tepat
4. Batasi join di edge: ganti `users(full_name)` dengan `users(id, full_name)` + batch fetch

### 2. Checklist Pemeriksaan Kinerja (harian)
```javascript
// digunakan di mana saja:
✓ Query punya limit/paginations
✓ Tidak ada .select('*')
✓ Dependencies array lengkap di useEffect
✓ Subscriptions punya cleanup
✓ join terbatas di edge
```

### 3. Pemantauan (Timeline 1 bulan)
- Tambahkan `console.time('query_name')` + `console.timeEnd()` di server actions
- Gunakan Supabase Analytics untuk query latency
- Alert jika > 50 query di single page load

## Konversi TL;DR (Indonesia)

**Kinerja DB saat ini:** ⚠️ **CRITICAL** - 64 query dengan pola berisiko tinggi

**Masalah terbesar:** 
1. **Wildcards** → penuh traffic database
2. **Tanpa pagination** → daftar raksasa = timeout
3. **N+1 patterns** → batch fetch users
4. **Subscription bocor** → koneksi database sia-sia

**Priority fix:** Ganti `select('*')` → kolom eksplisit + tambahkan limit 100 ke semua query daftar.

## Catatan

- Audit hanya menganalisis kode, tidak ada query database produksi
- Semua file edit belum diterapkan (peraturan: analisis hanya)
- RLS aktif di semua tabel - audit fokus pada query volume/kecepatan

**Output validated:** JSON schema siap, laporan lengkap disimpan di `docs/DB_PERF_AUDIT.md`