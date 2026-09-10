# APEX Security Audit Log

Tanggal: 2026-09-10 (malam, sprint otonom)
Auditor: Software Engineer (@software_engineer_lankdevbot)
Scope: Aplikasi lokal (sesuai batasan: tidak menyentuh production)
Environment: Next.js dev server (localhost:3000) + Supabase local (Docker, CLI 2.115.0)
DB state: 17 migrations applied via `supabase db reset`

## Metodologi

1. Static audit: seluruh API routes, server actions, RLS policies di 17 file migration, env handling, input validation (CSV, kasbon), dangerous patterns (eval, innerHTML, raw SQL).
2. Dynamic audit: Supabase lokal di-spin, dua tenant + tiga user (Admin A, Employee B) di-seed lewat REST API, lalu diserang via anon key + JWT user (mensimulasikan browser client jahat).
3. E2E audit: Playwright terhadap dev server lokal untuk verifikasi gate UI dan alur fungsional.

## Hasil Pengujian

| Suite | Hasil |
|---|---|
| RLS cross-tenant audit (rls_audit.mjs) | 12/12 PASS |
| Local E2E entitlement + deactivation (apex_local_e2e.py) | 12/12 PASS |
| Unit + invariant suite (npm test) | 93/93 PASS |
| tsc --noEmit | CLEAN |
| eslint | 0 error (112 warning `any`-debt terdokumentasi) |
| next build | SUCCESS |

### Vektor yang diuji dan DITOLAK sistem

- Cross-tenant SELECT (attendance, users, tasks) antar perusahaan: 0 baris bocor.
- Cross-tenant INSERT attendance ke perusahaan lain: 401/403.
- UPDATE profil user perusahaan lain: 0 baris berubah.
- INSERT baris users via client (anon/authenticated): 403, memang diblok policy `users_no_client_insert`.
- Baca data tanpa login (anon): 0 baris.
- Self-upgrade tier free -> pro via client: ditolak RLS + trigger `prevent_tier_self_change`.
- Force aktifasi modul Pro (payroll/shifts) via PATCH companies: ditolak.
- User yang dinonaktifkan (is_active=false) membaca data: 0 baris (lockout total setelah migration 16).

## Temuan dan Perbaikan (hardening yang diterapkan malam ini)

### K1. KRITIS: Grants tabel tidak self-contained (fixed)
Anon/authenticated/service_role tidak punya SELECT/INSERT/UPDATE/DELETE di semua tabel (default ACL lokal hanya memberi TRUNCATE/REFERENCES/TRIGGER). Production selama ini jalan karena kebetulan di-patch oleh default privileges platform hosted Supabase. Local/self-hosted/fresh provisioning akan gagal total dengan "permission denied".
Fix: migration `20260910000014_explicit_grants.sql` (GRANT eksplisit arwd ke anon/authenticated, ALL ke service_role, ALTER DEFAULT PRIVILEGES untuk tabel masa depan, GRANT EXECUTE fungsi helper RLS).

### K2. TINGGI: User nonaktif hanya dikunci di layer aplikasi (fixed)
Sebelumnya `is_active=false` hanya memicu sign-out di layout. Session JWT yang masih hidup tetap bisa membaca data tenant sampai token expired.
Fix: migration `20260910000016_rls_deactivated_lockout.sql`: helper tenancy (`get_company_id`, `get_user_id`, `get_user_role`, `get_user_role_id`) kini mengembalikan NULL untuk user nonaktif, sehingga semua perbandingan policy gagal dan user terkunci di level database. Hardening search_path + REVOKE dari migration 13 di-apply ulang (CREATE OR REPLACE menghapus proconfig).

### K3. SEDANG: Cron auth rentan timing attack (fixed)
`/api/cron/cleanup` membandingkan Bearer token dengan `===` biasa (early-exit string comparison).
Fix: `crypto.timingSafeEqual` dengan cek panjang buffer, plus fail-closed bila CRON_SECRET tidak diset.

### K4. RENDAH: Bootstrap super-admin check salah target (fixed)
Check existing super-admin membaca `user_metadata.role` (bisa ditulis user sendiri) padahal role disimpan di `app_metadata.role` (admin-only).
Fix: check dialihkan ke `app_metadata.role`.

### K5. RENDAH: Upgrade request code client pakai Math.random (fixed, malam sebelumnya)
`SubscriptionLayout` memakai Math.random (predictable). Fix: Web Crypto `crypto.getRandomValues` + rejection sampling anti modulo-bias.

## Yang sudah terverifikasi aman (tidak perlu perbaikan)

- Webhook WhatsApp: HMAC-SHA256 + `timingSafeEqual` + timestamp window + blacklist tier suspended + structured logging. Sudah best-practice.
- Bootstrap super-admin: fail-closed tanpa env, strong password policy, 409 bila sudah ada, role di app_metadata (tidak bisa di-spoof user).
- Server actions: semua 18 action ter-guard (requireManager / requireModuleAccess / getCallerProfile) sebelum createAdminClient, terkunci oleh test invariant authz.test.mjs.
- Entitlement: filter tier terjadi di server (updateModulesAction) dan di resolver (resolveEntitledModules), UI hanya menampilkan state. Tamper payload client tidak efektif (terbukti di RLS audit C1/C2).
- Rate limiting: login 10/10menit (per IP + per email), register 5/jam, join 10/10menit (per IP + per kode).
- RLS kasbon/THR/leave/shift swap: SELECT scoped, INSERT hanya pending milik sendiri, UPDATE hanya Admin/Manager, repayments write Admin/Manager only.
- CSV import: parser state-machine RFC4180, tanpa eval, batas 200 baris.
- Tidak ada raw SQL / rpc string interpolation di kode aplikasi (semua lewat PostgREST builder).
- Tidak ada hardcoded secret; service key hanya di server module yang tidak pernah di-import client (`'use server'` files + API routes).
- JSON-LD `dangerouslySetInnerHTML` hanya untuk data statis (bukan user input), bukan vektor XSS.

## Batasan audit (sisa risiko yang jujur diakui)

1. Rate limiter masih in-memory (serverless = per-instance). Kandidat upgrade: Upstash Redis. Low priority karena ada RLS sebagai backstop.
2. 112 warning `any` tersisa (type debt) — bukan vulnerability, tapi mengurangi jaminan tipe. Rencana: generate Supabase schema types lalu rapikan bertahap.
3. Storage bucket selfie belum diaudit dengan attack file upload khusus (upload path URL signed; hash integrity sudah ada via migration 11). Untuk demo aman; follow-up terjadwal.
4. Migration 14/16 belum di-apply ke production Supabase (butuh keputusan Lead Engineer / bos karena menyentuh prod DB).

## Artefak

- `tests/e2e/rls_audit.mjs` — audit RLS lintas tenant (repeatable, jalankan setelah `supabase db reset`)
- `tests/e2e/apex_local_e2e.py` — E2E lokal register/entitlement/deactivation
- `tests/e2e/apex_e2e_suite.py` — E2E production read-mostly (21/22, 1 fail = fitur belum dideploy, expected)
- `tests/e2e/apex_mobile_check.py` — mobile viewport 4/4
- `supabase/migrations/20260910000014_explicit_grants.sql`
- `supabase/migrations/20260910000016_rls_deactivated_lockout.sql`
