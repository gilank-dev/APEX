# APEX: Task Log

Done tasks live here. The newest entry is the current source of truth.

## 2026-09-09 — Full day: infra restore, authz hardening x2, P0 features, live E2E

**Infra restore**:
- Old prod Supabase project (ref `plgliiaflelqbigurrka`) was DELETED — Vercel env pointed at a dead host; login/register silently broken. New prod DB: `HR SaaS` ref `okbryysoxihmamujoipb`, 7 migrations applied, 3 env vars rotated in Vercel prod.
- Vercel prod env now complete: SUPABASE trio + SUPER_ADMIN_EMAIL/PASSWORD (generated, stored %LOCALAPPDATA%/Temp/apex_superadmin.txt) + CRON_SECRET (rotated, stored %LOCALAPPDATA%/Temp/apex_cron_secret.txt) + WHATSAPP_WEBHOOK_SECRET + NEXT_PUBLIC_SITE_URL.
- Super-admin bootstrapped via /api/bootstrap/super-admin → 201. Login verified 200 with app_metadata role.
- vercel.json cron: /api/cron/cleanup daily 17:00 UTC (00:00 WIB), verified end-to-end 200 with Bearer secret.

**Authz hardening round 1** (commit 81b8eff):
- src/lib/authz.ts: getCallerProfile() + requireManager(). All 10 admin/shift/payroll actions guarded before createAdminClient(). Static test tests/authz.test.mjs enforces guard order.

**Authz hardening round 2** (commit 69e566c):
- select_roles RLS: dropped anon clause — strangers could enumerate invite codes of every tenant.
- modify_own_user RLS: pins company_id (was only role_id) — employees could move into another tenant.
- users table: client INSERT/DELETE denied.
- Super-admin gate: user_metadata → app_metadata (admin-API-only writable).
- generateRequestCode: modulo-bias fix (rejection sampling).
- Incident: git add -A briefly committed .hermes-check/ + supabase/.temp/ to public repo; removed + gitignored in 75c7fca; audited: all credential files were 0 bytes, no secret leaked.

**P0 features** (commit 8bd0a94):
- Cuti & Izin (/[slug]/leave): cuti/izin/sakit + 1-level approval. Migration 20260909000005.
- Tukar Shift (in /shifts): consent-based swap, manager override, rollback on partial failure. Migration 20260909000006.
- Import Karyawan CSV (in /admin): RFC4180 parser (no deps), role auto-create, tier quota, 200-row cap, template download.
- 46/46 tests, tsc clean, build clean.

**Live E2E (real HTTP vs apex.lankdev.my.id + prod DB)**:
- All 9 tenant pages 200 with real session.
- Employee: own leave 201; approve-own = 0 rows; payroll/shift-template/task insert 403; cross-tenant read []; tier + modules PATCH = 0 rows (verified unchanged).
- Anon: roles enumeration []; cron/webhook/bootstrap fail-closed.
- Gates: wrong-slug session 307 to own dashboard; no cookie → /login; super-admin page 307 for employee session.

**Demo data**: tenant `reina-e2e` (module leave enabled), Admin qa-e2e@lankdev.my.id / QaProbe12345x.

**Parked (product decisions, not bugs)**: THR+lembur (P1, Q1 2027), kasbon (P2, 5 customers), UI polish (after pilot feedback).
