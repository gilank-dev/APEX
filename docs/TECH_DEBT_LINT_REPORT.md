# Laporan Tech Debt Lint — APEX

> Dibuat: 2026-09-11 · Lead Engineer (Dwight) · Sumber data: `npm run lint` live run
> Baseline: **115 warnings, 0 errors** — build tidak terblokir, ini debt kualitas.

## Distribusi per Rule

| Rule | Jumlah | Risiko |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 68 | Sedang — menutup type-safety pada data Supabase |
| `@typescript-eslint/no-unused-vars` | 40 | Rendah — noise, sebagian bisa menyembunyikan bug |
| `react-hooks/exhaustive-deps` | 3 | **Tinggi** — bisa memicu stale data / infinite re-fetch |
| `@next/next/no-img-element` | 2 | Sedang — kehilangan optimasi image Next.js |
| `@typescript-eslint/no-unused-expressions` | 2 | Rendah |

## Distribusi per File (12 teratas)

| Warnings | File |
|---|---|
| 15 | `src/app/[slug]/attendance/page.tsx` |
| 12 | `src/app/[slug]/[feature]/FeatureClient.tsx` |
| 6 | `src/app/[slug]/attendance/AttendanceRecapView.tsx` |
| 6 | `src/app/[slug]/inventory/InventoryClient.tsx` |
| 5 | `src/app/[slug]/payroll/page.tsx` |
| 5 | `src/app/[slug]/payroll/slip/[userId]/page.tsx` |
| 5 | `src/lib/actions.ts` |
| 4 | `src/app/[slug]/admin/page.tsx` |
| 4 | `src/app/[slug]/leave/page.tsx` |
| 4 | `src/app/[slug]/shifts/page.tsx` |
| 4 | `src/app/[slug]/tasks/page.tsx` |
| 3 | `src/app/[slug]/[feature]/page.tsx` |

## Akar Masalah Mayoritas `any`

Tidak ada generated Supabase types di repo. Setiap query manual diketik `any`
karena tidak ada `src/types/database.ts`. Solusi tunggal yang menyelesaikan
mayoritas 68 warning `any` sekaligus:

```bash
npx supabase gen types --lang typescript --linked > src/types/database.ts
```

Catatan: command `--linked` butuh koneksi ke project Supabase production.
Alternatif aman offline: `--local` (hasil bisa sedikit beda dengan prod,
verifikasi ulang setelah deploy). Jangan regenerate pakai editor online
dashboard lalu paste — rentan drift.

## Rencana Eksekusi 3 Batch

### Batch 1 — Mekanis aman (target: -55 warnings, risiko ~0)
1. Hapus unused imports/vars (40) — `eslint --fix` tidak menangani ini
   otomatis untuk semua kasus; lakukan manual per file dengan urutan
   top-files di atas. Gunakan `npx eslint <file> --fix` untuk yang aman.
2. Fix 2 `no-img-element` → ganti `<img>` dengan `next/image` + width/height
   eksplisit + alt text.
3. Fix 2 `no-unused-expressions` — biasanya ternary tanpa assignment; ubah
   jadi `if` eksplisit.

### Batch 2 — Type generation Supabase (target: -50 warnings `any`)
1. Generate `src/types/database.ts` via `supabase gen types --linked`.
2. Refactor bertahap: mulai dari `src/lib/actions.ts` (5 warning, server
   actions inti), lalu `attendance/page.tsx` (15 warning — file terburuk).
3. JANGAN refactor semua sekaligus — per-PR per-file agar reviewable.
4. `exhaustive-deps` (3): audit manual satu per satu — cek apakah
   dependency yang hilang memang sengaja di-skip; kalau iya, tambahkan
   comment eslint-disable dengan justifikasi.

### Batch 3 — Guard test & pencegahan rot
1. Tambah rule `no-explicit-any` jadi **error** di `eslint.config.mjs`
   untuk file baru (per-directory override: `src/lib/**` dulu).
2. Target akhir: 0 warning di `src/lib/**` (kode security-critical).
3. Lint gate CI sudah ada — pertahankan 0 error, sisakan warning sebagai
   burndown tracker.

## Catatan Verifikasi

- Angka di laporan ini dari run `npm run lint` langsung (bukan ingatan).
- Setelah Batch 1, target angka: ~60 warnings; setelah Batch 2: ~10.
- Jangan menurunkan rule di eslint.config.mjs untuk "menghapus" warning —
  itu menutup masalah, bukan menyelesaikannya.
