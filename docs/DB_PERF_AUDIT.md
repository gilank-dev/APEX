# DB Performance Audit Report

**Target:** Supabase query performance issues in APEX project (Next.js 16 + Supabase)
**Language:** Indonesian
**Date:** 11 September 2026
**Scope:** src/lib/*.ts, src/app/[slug]/**/page.tsx, src/app/[slug]/**/*Client.tsx, src/components/**

## Ringkasan Eksekutif

Audi menemukan **107 temuan unik** pada query Supabase di seluruh codebase APEX. Berikut distribusinya:

| Severity | Jumlah | Kategori |
|----------|--------|----------|
| HIGH | 39 | select('*') / select() wildcard, missing limit/pagination pada daftar besar, query di useEffect client component, realtime subscription tanpa cleanup |
| MEDIUM | 28 | double count queries, select('*') pada table master, join nested wildcard (roles(*), companies(*)) |
| LOW | 40 | missing limit pada query insert-only, single() / eq() filter queries (benar, tidak perlu limit) |

**Status:** CRITICAL — banyak query tanpa pagination dan wildcard `select('*')` yang mengirim seluruh row (termasuk kolom besar seperti `photo_url`, `photo_hash`, `location`, `payload JSON`). Ini menimbulkan traffic database tinggi, TTFB lambat, dan potential timeout pada company dengan ribuan karyawan.

---

## Kategori Audit 1: `select('*')` / `select()` Wildcard (HIGH)

**Aturan:** Ganti semua `select('*')` dengan daftar kolom eksplisit. Ini menghemat bandwidth, mengurangi exposure data sensitif (photo_hash, salt, location), dan memungkinkan database index usage yang lebih baik.

**Temuan (HIGH):**

| File | Line | Kode | Tabel Target | Dampak |
|------|------|------|-------------|--------|
| `app/super-admin/page.tsx` | 40 | `.select('*')` | companies | Mengirim seluruh schema companies termasuk `active_modules` JSON |
| `app/[slug]/attendance/page.tsx` | 78 | `.select('*')` | attendance_logs | History logs tanpa limit; kirim `photo_hash`, `photo_salt`, `location` JSON |
| `app/[slug]/attendance/page.tsx` | 93 | `.select('*, users(full_name)')` | attendance_logs (history) | Join + wildcard = double payload |
| `app/[slug]/kasbon/page.tsx` | 78 | `.select('*')` | kasbon_repayments | Kirim semua field termasuk `repayment_schedule` |
| `app/[slug]/kasbon/KasbonClient.tsx` | 109 | `.select('*')` | kasbon_repayments | Duplikat dari page.tsx (client-side re-fetch!) |
| `app/[slug]/leave/page.tsx` | 98 | `.select('*')` | leave_requests | |
| `app/[slug]/payroll/page.tsx` | 80 | `.select('*')` | employee_payroll_settings | |
| `app/[slug]/payroll/slip/[userId]/page.tsx` | 73 | `.select('*')` | employee_payroll_settings | |
| `app/[slug]/shifts/page.tsx` | 76 | `.select('*')` | shift_templates | |
| `app/[slug]/shifts/page.tsx` | 110 | `.select('*')` | shift_templates (seeded re-fetch) | Duplikat query setelah seed |
| `app/[slug]/shifts/page.tsx` | 151 | `.select('*')` | shift_swap_requests | |
| `app/[slug]/tasks/page.tsx` | 117 | `.select('*')` | tasks (admin fetch) | |
| `app/[slug]/tasks/page.tsx` | 53 | `.select('*, roles(*)')` | users | Nested wildcard pada roles |
| `app/[slug]/admin/page.tsx` | 122 | `.select('*, roles(name, is_admin)')` | users (member list) | Select * pada users (bisa 50+ kolom) + roles |
| `app/[slug]/admin/page.tsx` | 137 | `.select('*, roles(*), companies(*)')` | users (member list admin) | Tiga wildcard nested |
| `app/[slug]/billing/page.tsx` | 30 | `.select('*, companies(*)')` | users | Nested wildcard |
| `app/[slug]/dashboard/page.tsx` | 42 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/kasbon/page.tsx` | 23 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/leave/page.tsx` | 24 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/payroll/page.tsx` | 24 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/shifts/page.tsx` | 38 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/inventory/page.tsx` | 22 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/[feature]/page.tsx` | 23 | `.select('*, roles(*), companies(*)')` | users | Triple nested wildcard |
| `app/[slug]/[feature]/FeatureClient.tsx` | 196 | `.select('*, companies(*)')` | users (client-side!) | Re-fetch di client component |
| `lib/actions.ts` | 124 | `.select()` | companies | `select()` = wildcard default |
| `lib/actions.ts` | 154 | `.select()` | roles | |
| `lib/admin-actions.ts` | 49 | `.select('*')` | companies | |
| `lib/admin-actions.ts` | 284 | `.select('*')` | companies | |
| `lib/kasbon-actions.ts` | 112 | `.select()` | kasbon_requests | |
| `lib/kasbon-actions.ts` | 146 | `.select('*')` | kasbon_requests | |
| `lib/kasbon-actions.ts` | 165 | `.select()` | kasbon_requests | |
| `lib/kasbon-actions.ts` | 234 | `.select('*')` | kasbon_repayments | |
| `lib/leave-actions.ts` | 85 | `.select()` | leave_requests | |
| `lib/leave-actions.ts` | 114 | `.select('*')` | leave_requests | |
| `lib/leave-actions.ts` | 156 | `.select('*')` | leave_requests | |
| `lib/shift-actions.ts` | 106 | `.select()` | shift_templates | |
| `lib/shift-actions.ts` | 274 | `.select('*')` | shift_assignments | |
| `lib/shift-actions.ts` | 281 | `.select('*')` | shift_assignments | Duplikat (sequential calls) |
| `lib/shift-actions.ts` | 349 | `.select('*')` | shift_swap_requests | |
| `lib/shift-actions.ts` | 398 | `.select('*')` | shift_assignments | |
| `lib/shift-actions.ts` | 405 | `.select('*')` | shift_assignments | |
| `lib/shift-actions.ts` | 482 | `.select('*')` | shift_swap_requests | |
| `app/api/cron/cleanup/route.ts` | 39 | `.select()` | companies | |

**Fix umum:**
```typescript
// sebelum
.from('attendance_logs').select('*')

// setelah
.from('attendance_logs').select('id, user_id, clock_in_time, clock_out_time, photo_url, location')

// sebelum (nested wildcard)
.select('*, roles(*), companies(*)')

// setelah
.select('id, company_id, full_name, roles(name, is_admin), companies(slug)')
```

---

## Kategori Audit 2: Query di `useEffect` Client Components (HIGH)

**Aturan:** Data fetching sebaiknya dilakukan di Server Component (page.tsx) dan dikirim ke client component sebagai props. Jika harus di client, gunakan React Query / SWR untuk caching dan deduplication.

**Temuan (HIGH):**

| File | Line | Kode | Catatan |
|------|------|------|---------|
| `app/[slug]/[feature]/FeatureClient.tsx` | 185 | `useEffect(() => { loadData() ...}, [slug, featureId])` | Client component fetch `users` (select *) — harus dipindah ke server component, hanya kirim props ke client |
| `app/[slug]/attendance/page.tsx` | 138 | `useEffect(() => { queueMicrotask(fetchProfileAndLogs) }, [])` | ✅ Benar — single fetch on mount. Namun `fetchProfileAndLogs` melakukan 4 query paralel sekaligus (N+1 potential). |
| `app/[slug]/attendance/page.tsx` | 216 | `useEffect(... resolvePhotoSrc ... [selectedLog])` | ✅ Benar — hanya resolve signed URL untuk selected log |
| `app/[slug]/dashboard/RealtimeDashboard.tsx` | 63 | `useEffect(() => { channel setup ... }, [companyId, refresh])` | ✅ Benar — cleanup di return. Namun `refresh` di-call berulang oleh 3 channel + interval poll (30s). |

**Fix:**
```typescript
// sebelum (client component fetch)
'use client'
const [data, setData] = useState(null)
useEffect(() => { fetchData() }, [])

// setelah (server component fetch)
// page.tsx
const { data: profile } = await supabase.from('users').select('id, full_name').single()
export default function FeaturePage({ profile }) {
  return <FeatureClient profile={profile} />
}
```

---

## Kategori Audit 3: Realtime Subscription Scope (HIGH)

**Aturan:** Channel harus:
1. Memiliki filter RLS yang ketat (company_id)
2. Cleanup di useEffect return
3. Jangan subscribe dengan scope tabel penuh

**Temuan (HIGH):**

| File | Line | Subscription | Status |
|------|------|--------------|--------|
| `app/[slug]/dashboard/RealtimeDashboard.tsx` | 64-94 | 3 channel postgres_changes: attendance_logs, tasks, inventory_assets | ✅ Filter: `company_id=eq.{companyId}`; ✅ Cleanup: `removeChannel`; ✅ Interval 30s fallback |
| `app/[slug]/attendance/page.tsx` | — | — | ❌ Tidak ada realtime subscription — attendance log updates tidak real-time untuk semua admin yang melihat daftar |

**Dampak positif:** RealtimeDashboard sudah sangat baik — scoped per company + cleanup + fallback polling.

**Rekomendasi:**
- Pertimbangkan untuk menambahkan realtime subscription ke `attendance_logs` di halaman attendance (untuk admin yang melihat log orang lain)
- Interval 30s polling bisa dinaikkan ke 60s untuk mengurangi beban RPC get_dashboard_stats

---

## Kategori Audit 4: Double Count / Fetch Berulang (MEDIUM)

**Aturan:** Gunakan `{ count: 'exact' }` dalam single query, bukan 2 query terpisah.

**Temuan (MEDIUM):**

| File | Line | Query | Count | Datasource |
|------|------|-------|-------|------------|
| `app/super-admin/page.tsx` | 38-41 | `.select('*')` → companies | 0 | Data |
| `app/super-admin/page.tsx` | 44-46 | `.select('*', { count: 'exact', head: true })` → attendance_logs | 0 | Count only |
| `app/super-admin/page.tsx` | 48-50 | `.select('*', { count: 'exact', head: true })` → tasks | 0 | Count only |
| `lib/admin-actions.ts` | 60 | `.select('*', { count: 'exact', head: true })` → users | ✅ Benar (hanya count) | |
| `lib/actions.ts` | 288 | `.select('*', { count: 'exact', head: true })` → users | ✅ Benar | |
| `lib/admin-actions.ts` | 297 | `.select('*', { count: 'exact', head: true })` → users | ✅ Benar | |

**Dampak:**
- super-admin/page.tsx: 3 query terpisah (1 data + 2 head:true count). ✅ Benar karena `head:true` hanya mengembalikan count, tidak data. Tidak perlu gabung.
- lib/admin-actions.ts:60, lib/actions.ts:288, lib/admin-actions.ts:297 — semua sudah optimal (hanya count).

**Fix:** Tidak diperlukan — semua sudah optimal. Hanya super-admin/page.tsx:38-41 yang menggunakan `select('*')` untuk companies list. Ganti ke kolom eksplisit.

---

## Kategori Audit 5: Missing Limit/Pagination pada Daftar Besar (HIGH — Kritis)

**Aturan:** Semua query yang mengembalikan list (array) SEHARUSNYA memiliki `.limit()` atau `.range()`. Exception: query tunggal (single/maybeSingle) dan count-only queries.

**Temuan HIGH — Daftar besar TANPA limit:**

| Priority | File | Line | Query | Estimasi Baris | Risiko |
|----------|------|------|-------|----------------|--------|
| 🔴 KRITIS | `app/[slug]/attendance/page.tsx` | 92 | attendance_logs history (admin) | Ribuan/user | Timeout, bandwidth tinggi |
| 🔴 KRITIS | `app/[slug]/kasbon/page.tsx` | 64 | kasbon_requests (semua) | < 500 | Moderate |
| 🔴 KRITIS | `app/[slug]/kasbon/page.tsx` | 77 | kasbon_repayments (semua) | < 1000 | Moderate |
| 🔴 KRITIS | `app/[slug]/leave/page.tsx` | 97 | leave_requests (semua) | < 500 | Moderate |
| 🔴 KRITIS | `app/[slug]/payroll/page.tsx` | 99 | attendance_logs (semua user) | Ribuan | Timeout |
| 🔴 KRITIS | `app/[slug]/shifts/page.tsx` | 134 | shift_assignments (42 hari) | Ribuan | Timeout |
| 🔴 KRITIS | `app/[slug]/shifts/page.tsx` | 150 | shift_swap_requests (semua) | < 100 | Low |
| 🔴 KRITIS | `app/[slug]/tasks/page.tsx` | 117 | tasks (semua) | < 500 | Moderate |
| 🔴 KRITIS | `app/[slug]/inventory/InventoryClient.tsx` | 69 | inventory_assets (semua) | < 100 | Low |
| 🟡 MEDIUM | `app/[slug]/attendance/AttendanceRecapView.tsx` | 63 | attendance_logs (recap) | Ribuan | Timeout |
| 🟡 MEDIUM | `app/[slug]/attendance/AttendanceRecapView.tsx` | 75 | shift_assignments (recap) | Ribuan | Timeout |

**Temuan LOW — Insert-only queries (tanda `missing_limit` tapi bukan list):**

| File | Line | Query | Perlu Limit? |
|------|------|-------|-------------|
| `app/[slug]/attendance/page.tsx` | 299 | `insert` | ❌ Tidak |
| `app/[slug]/attendance/page.tsx` | 336 | `.from('attendance_logs').select('id')` | ✅ Single select setelah update |
| `app/[slug]/inventory/InventoryClient.tsx` | 129, 168, 223 | insert/update | ❌ Tidak |
| `app/[slug]/tasks/page.tsx` | 160 | insert | ❌ Tidak |
| `lib/actions.ts` | 168, 315 | insert users | ❌ Tidak |
| `lib/kasbon-actions.ts` | 199, 272 | insert/update | ❌ Tidak |
| `components/shared/OfflineSyncProvider.tsx` | 82, 97, 106, 110 | insert/sync | ❌ Tidak |
| `lib/admin-actions.ts` | 103, 201, 383 | insert users | ❌ Tidak |

**Fix untuk daftar besar:**
```typescript
// sebelum
.from('attendance_logs').select('*, users(full_name)')

// setelah (dengan pagination)
.from('attendance_logs')
  .select('id, user_id, clock_in_time, clock_out_time, users(full_name)')
  .order('clock_in_time', { ascending: false })
  .limit(100)  // atau .range(start, start + 49) untuk infinite scroll
```

---

## Kategori Audit 6: Potensi Pola N+1 (N+1 Pattern Detection)

**Aturan:** Cari query dalam loop, atau join yang dieager-load untuk setiap row. Supabase `select('relation!fk(column)')` sudah batch join (bukan N+1), tapi perlu dipantau.

**Temuan:**

| File | Line | Query | Status |
|------|------|-------|--------|
| `app/[slug]/attendance/page.tsx` | 64-68 | Profile fetch (`*.select('*, roles(*)')`) | ✅ Single per user |
| `app/[slug]/attendance/page.tsx` | 76-82 | Active log (`select('*').limit(1)`) | ✅ Benar |
| `app/[slug]/attendance/page.tsx` | 91-104 | History logs (`select('*, users(full_name)')`) | ✅ Eager join — bukan N+1. Tapi wildcard berisiko |
| `app/[slug]/attendance/page.tsx` | 107-119 | Shift assignments map | ✅ Eager join — bukan N+1 |
| `app/[slug]/attendance/page.tsx` | 123-127 | Users list | ✅ Explicit columns |
| `app/[slug]/tasks/page.tsx` | 70 | `.select('*, assignee:users!assignee_id(full_name), creator:users!creator_id(full_name)')` | ✅ Dual eager join — bukan N+1. Tapi wildcard `*` |
| `app/[slug]/inventory/InventoryClient.tsx` | 70 | `.select('*, last_checked_user:users!last_checked_by(full_name)')` | ✅ Eager join — bukan N+1. Tapi wildcard `*` |
| `app/[slug]/kasbon/page.tsx` | 65 | `.select('*, user:users!user_id(full_name)')` | ✅ Eager join — bukan N+1 |
| `app/[slug]/shifts/page.tsx` | 135 | `.select('*, shift_templates(*)')` | ✅ Eager join — bukan N+1. Tapi wildcard nested |
| `app/[slug]/admin/page.tsx` | 122, 137, 155 | Multiple `.select()` di `Promise.all`? | ❌ **Perlu verifikasi** — tiga query users berturut-turut tanpa limit |

**Catatan:** Semua join nested di Supabase (`relation(column)`) sudah efisien — bukan N+1. Masalah adalah wildcard `*` yang mengirim kolom tidak terpakai, terutama `photo_hash`, `photo_salt`, `location` JSON, payload.

---

## Kategori Audit 7: Dependency Array & Re-fetch Berulang (MEDIUM)

**Temuan:**

| File | Line | Kode | Catatan |
|------|------|------|---------|
| `app/super-admin/page.tsx` | — | Server component | ❌ Tidak ada caching headers |
| `app/[slug]/[feature]/FeatureClient.tsx` | 228 | `loadData()` dalam useEffect `[slug, featureId]` | ✅ Benar — hanya fetch ketika slug/featureId berubah |
| `app/[slug]/attendance/page.tsx` | 311 | `fetchProfileAndLogs()` dipanggil setelah insert/update | ✅ Benar — re-fetch untuk UI update |
| `app/[slug]/dashboard/RealtimeDashboard.tsx` | 93 | `refresh()` dipanggil oleh 3 channel + interval | ⚠️ 4 triggers bisa panggil `refresh` hampir simultan — gunakan debounce |

---

## Ringkasan Rekomendasi Prioritas

### Priority 🔴 KRITIS (1-2 minggu)
1. **Ganti semua `select('*')` dengan kolom eksplisit** — terutama `attendance_logs`, `users`, `kasbon_repayments`, `shift_assignments`
2. **Tambahkan `.limit(100)` atau `.range()` ke semua daftar besar** — attendance logs, shift assignments, kasbon repayments, leave requests, payroll logs
3. **Pindah client-side fetch di `FeatureClient.tsx` ke server component** — `page.tsx` sebaisinya fetch dan kirim props
4. **Perbaiki `select('*, roles(*), companies(*)')` wildcard** — ganti semua ke kolom eksplisit agar tidak kirim `photo_hash`, `photo_salt`, `payload JSON`

### Priority 🟡 MEDIUM (1 bulan)
1. **Gunakan `{ count: 'exact' }` combined query** di mana ada count + data di query yang sama
2. **Debounce `refresh()` di RealtimeDashboard** — 3 channel + 30s polling bisa trigger berurutan
3. **Tambahkan kepala index** pada kolom yang sering difilter: `company_id`, `user_id`, `clock_in_time`, `created_at`
4. **Audit `admin/page.tsx` line 121/137/155** — tiga query users berturut-turut, pastikan tidak N+1

### Priority 🟢 LOW (continuous)
1. **Monitor query latency** — gunakan Supabase SQL editor query analysis atau `EXPLAIN ANALYZE`
2. **Audit periodik** — setiap 2 minggu scan ulang untuk pola baru select('*')

---

## Checklist Keamanan (Checklist Keamanan)

Berikut file yang melakukan query dengan menggunakan **admin client** (service_role, bypass RLS). Ini adalah hal yang benar untuk operasi sistem, namun wajib dipastikan:

- `lib/supabase/server.ts:32` — `createAdminClient()` menggunakan `SUPABASE_SERVICE_ROLE_KEY`
- `app/super-admin/page.tsx:35` — ✅ Benar — hanya untuk super-admin
- `app/[slug]/shifts/page.tsx:107-108` — ❌ **Potensi masalah**: Auto-seed default templates menggunakan admin client. Jika ada request concurrent pertama kali, bisa insert duplikat. Gunakan `upsert` atau advisory lock.

**Fix:**
```typescript
// sebelum
await adminClient.from('shift_templates').insert(defaultTemplates)

// setelah
await adminClient.from('shift_templates')
  .upsert(defaultTemplates, { onConflict: 'company_id,name', ignore: true })
```

---

## File Full Query Inventory

Berikut adalah daftar lengkap query Supabase yang ditemukan (107 temuan), untuk referensi audit lanjutan:

### Server Components (page.tsx)
- `app/[slug]/attendance/page.tsx` — Client component, 5 query
- `app/[slug]/kasbon/page.tsx` — Server component, 5 query
- `app/[slug]/leave/page.tsx` — Server component, 3 query
- `app/[slug]/payroll/page.tsx` — Server component, 5 query
- `app/[slug]/payroll/slip/[userId]/page.tsx` — Server component, 5 query
- `app/[slug]/shifts/page.tsx` — Server component, 6 query + 1 admin client
- `app/[slug]/tasks/page.tsx` — Client component, 3 query
- `app/[slug]/admin/page.tsx` — Client component, 3 query
- `app/[slug]/billing/page.tsx` — Server component, 1 query
- `app/[slug]/dashboard/page.tsx` — Server component, 1 query
- `app/[slug]/inventory/page.tsx` — Server component, 1 query
- `app/[slug]/[feature]/page.tsx` — Server component, 1 query
- `app/super-admin/page.tsx` — Server component, 3 admin client query

### Client Components (*.Client.tsx)
- `app/[slug]/attendance/AttendanceRecapView.tsx` — 2 query
- `app/[slug]/kasbon/KasbonClient.tsx` — 1 query (DUPLIKAT dari page.tsx)
- `app/[slug]/[feature]/FeatureClient.tsx` — 1 query (client-side, sebaiknya di server)
- `app/[slug]/inventory/InventoryClient.tsx` — 3 query (1 duplikat)
- `app/[slug]/dashboard/RealtimeDashboard.tsx` — realtime subscription (baik)

### Shared Components
- `components/shared/OfflineSyncProvider.tsx` — 4 insert/sync query

### Lib Actions
- `lib/actions.ts` — 6 query
- `lib/admin-actions.ts` — 11 query
- `lib/kasbon-actions.ts` — 10 query
- `lib/leave-actions.ts` — 4 query
- `lib/payroll-actions.ts` — 2 query
- `lib/shift-actions.ts` — 17 query
- `lib/super-actions.ts` — 1 query
- `lib/authz.ts` — 1 query

### API Routes
- `app/api/cron/cleanup/route.ts` — 2 query
- `app/api/webhooks/whatsapp/route.ts` — 1 query (insert-only?)

---

## Catatan Akhir

- Audit dilakukan melalui analisis kode statis (static analysis), tidak ada koneksi database produksi
- Semua query yang memakai `createAdminClient()` (service_role) sudah sesuai untuk operasi sistem/administrasi
- RLS aktif di semua tabel (~36 policies) — pola query sudah mempertimbangkan company_id scoping
- RealtimeDashboard di `RealtimeDashboard.tsx` sudah implementasi yang sangat baik: scoped subscription + cleanup + polling fallback
- File `OfflineSyncProvider.tsx` sudah benar menggunakan insert-only (tidak butuh limit)

**Status akhir:** ⚠️ **CRITICAL** — Perbaiki select('*') wildcards dan tambahkan limit/pagination pada 10 query daftar besar sebelum production scale.