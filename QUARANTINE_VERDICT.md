# MIGRATION QUARANTINE VERDICT — Lead Engineer Review

Date: 2026-09-10
Reviewer: Lead Engineer (@Lead_Engineer_lankdevbot)
Status: **7 migrations DI-QUARANTINE**, tidak boleh di-apply ke prod apa pun kondisinya

## Apa yang terjadi

Sebuah workstream paralel menulis 7 file migration RLS/audit. Saat review, ditemukan
kerusakan fatal pada desain. Semuanya dipindahkan ke `supabase/migrations.quarantine/`
agar `supabase db push` tidak dapat menyentuhnya.

## Temuan (bukti di bawah)

### F1 — CRITICAL: Schema halusinasi (tabel tidak ada)
Migrations mereferensikan tabel yang tidak pernah dibuat di schema APEX manapun:
`user_roles`, `projects`, `shifts`, `attendance`, `attendance_records`,
`task_dependencies`, `task_materials`, `user_invitations`, `payroll_runs`, `thr_runs`.

Tabel riil (dari semua CREATE TABLE di migrations applied): `companies`, `roles`,
`users`, `attendance_logs`, `tasks`, `inventory_assets`, `shift_templates`,
`shift_assignments`, `leave_requests`, `shift_swap_requests`,
`employee_payroll_settings`, `kasbon_requests` (09), `kasbon_repayments` (09),
`thr_payments` (10), `audit_events` (belum ada, lihat F5).

`20260910000002_hardened_rls.sql` diawali `BEGIN;` dan diakhiri `COMMIT;` tapi
tidak menutup jika error — sebuah `CREATE POLICY ... ON public.projects` akan
gagal dengan "relation does not exist", menggulung SELURUH transaction termasuk
DROP policy lama, lalu `db push` error. Migrasi state bisa tercatat applied
atau tidak secara tidak konsisten.

### F2 — CRITICAL: Regresi security — policy hardening dibuka lagi
`20260910000002` meng-DROP policy yang sudah hardened di 20260708000001 &
20260909000004 lalu mengganti dengan versi PERMISSIVE:
- `users_update`: company-scoped, tidak self-scoped → karyawan dapat mengubah
  `role_id` karyawan lain, termasuk menobatkan diri/dia menjadi Admin
  (privilege escalation, membuka ulang V6 yang sudah ditutup).
- `users_delete`: company-scoped → karyawan manapun dapat menghapus user lain.
- `companies_delete`: member manapun dapat menghapus SELURUH company
  (cascade: seluruh data tenant musnah).
- `leave_requests_update` / `shift_swap_requests_update`: requester-scoped,
  tanpa guard `status = 'pending'` → karyawan dapat approve pengajuan cuti
  sendiri (self-approval), membuka ulang race-fix 65d32e4.
- `shift_swap_requests_update` juga men-drop `cancel_swap_request_own`
  tanpa pengganti → fitur cancel tukar shift karyawan rusak.
- `attendance_logs_update`: karyawan dapat mengedit log milik rekan sekantor
  (sebelumnya user_id-scoped).
- `leave_requests_delete` / `attendance_logs_delete` / `tasks_delete`
  company-scoped: karyawan dapat menghapus log presensi rekan (penghapusan
  bukti kehadiran).

Bukti: test invariant brutal `ensures migrations harden modify_own_user` GAGAL
persis di migration ini — alarm yang benar-benar menyala, bukan test basi.

### F3 — CRITICAL: Migration `20260910000001_auth_id_not_null` mematahkan fitur inti
Fitur CSV import (admin-actions.ts:332) dan join-by-invite-code (admin-actions.ts:98)
meng-insert `auth_id: null` sesuai desain terdokumentasi "Nullable for dummy accounts"
(initial_schema.sql:32). SET NOT NULL tanpa perubahan kode = import karyawan dan
join-by-code RUSAK di prod. Backfill dengan `gen_random_uuid()` random juga
menghancurkan join dummy accounts — nilai auth_id random tak akan pernah cocok
dengan auth.uid() manapun. Arah NOT NULL adalah arah salah untuk schema ini.

### F4 — HIGH: Kebingungan numbering (dua file bernomor sama-9/10)
Batch paralel menamai file `20260909000009`/`20260910000010` — bentrok dengan
kasbon/THR yang sudah kutulis untuk task overhaul. Renumber saat re-introduce.

### F5 — HIGH: Batch ini drop + rebuild ulang policy nonstop
Bahkan file fix-nya (priority1_fixes) juga masih referensi tabel halusinasi
(`user_roles`, `projects`, `attendance_records`, `task_materials`,
`user_invitations`), dan beberapa policy duplicate dengan batch hardened_rls.
Tidak ada bukti batch ini diuji terhadap schema riil sebelum ditulis.

### F6 — MEDIUM: `supabase/.temp` dan typo pada name-scan
`20260909000012_rls_audit_function.sql` mereferensikan `public.audit_rls_coverage`
(sebuah VIEW/relay yang tidak dibuat di batch ini). Juga perhatikan catatan: file ini
sendiri adalah modifikasi belakangan (modified, belum committed) — tetap quarantine.

## Keputusan arsitektur

1. **Tidak ada rollback/push dari batch ini ke prod.** Prod aman: hanya sampai
   `20260909000008` yang applied (diverifikasi via `supabase migration list`).
2. Quarantine bukan deletion — kode masih bisa dipelajari/di-salvage ide-nya
   (audit_events, hash chain, beberapa index valid) setelah ditulis ulang benar.
3. Ide bagus yang layak diselamatkan dari batch ini (harus DITULIS ULANG, bukan di-reuse):
   - audit_events table + hash chain + immutable trigger
   - beberapa index (setelah diverifikasi tabelnya ada)
   - konvensi subquery inline `(SELECT company_id ...)` — valid & self-contained,
     tapi helper get_* tetap lebih murai untuk hot path.
4. `modify_own_user` hardening + role_id WITH CHECK (20260708000001) tetap
   authoritative — jangan ditimpa.

## Cara me-review ulang batch yang benar (untuk Software Engineer)

1. Mulai dari `pg_dump --schema-only` / daftar tabel riil, BUKAN dari ingatan.
2. Setiap DROP policy harus punya CREATE pengganti yang SETARA-ATAU-LEBIH-KETAT.
3. Zebra rule: suatu policy baru TIDAK BOLEH memberi akses lebih luas dari
   policy lama di tabel sama (contoh forbidden: company-scoped users_update).
4. Jangan pernah SET NOT NULL pada kolom yang secara desain nullable
   (`auth_id` = dummy accounts) tanpa refactor flow insert-nya dulu.
5. Verifikasi dengan: local DB (Docker) → npm test → live E2E (reina-e2e tenant)
   → baru bandingkan pg_policies sebelum/sesudah.

## Verifikasi riil yang sudah dilakukan

- `supabase migration list`: applied sampai 08 — batch quarantine TIDAK pernah applied.
- `npm test`: 55/56 — satu failure adalah alarm benar di batch quarantine (F2).
- grep CREATE TABLE vs ON public.*: 10 tabel halusinasi vs 13 tabel riil.
- admin-actions.ts:98 & 332: `auth_id: null` insert — F3 dikonfirmasi.
