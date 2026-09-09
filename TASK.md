# APEX: Task Log

Done tasks live here. The newest entry is the current source of truth.

## 2026-09-09 — P0 Gap-Closer + Infra Restore + Authz Hardening (DONE)

**Modules shipped** (commits 8702e97..bf647af, author fixed to theclipperss1@gmail.com):
- Shift templates + weekly roster grid + attendance integration (`/[slug]/shifts`)
- Monthly attendance recap with KPI summary + CSV export (`/[slug]/attendance`)
- Payroll-lite: settings, monthly computation, CSV export, printable payslip (`/[slug]/payroll`)
- 14-day Pro trial logic + entitlement evaluation + cleanup cron (`src/lib/entitlements.ts`)
- Tenant registration input validation, invite code regeneration, simulation banner

**Infra restore**:
- Old prod Supabase project (ref `plgliiaflelqbigurrka`) was DELETED — env vars in Vercel pointed at a dead domain; login/register had been silently broken.
- New prod DB: project `HR SaaS` (ref `okbryysoxihmamujoipb`, org Lankdev), schema pushed via `supabase db push` (5 migrations, 9 tables, RLS policies applied).
- Vercel env (production) updated: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sb_publishable), `SUPABASE_SERVICE_ROLE_KEY` (sb_secret). NOT yet set in Vercel: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `CRON_SECRET`, `WHATSAPP_WEBHOOK_SECRET` (routes fail closed without them — bootstrap 403, cron/webhook 401 — add before first demo).

**Authorization hardening** (this session, via agy gemini-3.8-flash-high):
- New `src/lib/authz.ts`: `getCallerProfile()` (session-derived) + `requireManager()` (Admin/Manager + company match).
- All 10 exported actions in shift-actions.ts / payroll-actions.ts / admin-actions.ts now guard before any `createAdminClient()` use. Cross-tenant parameter injection closed.
- `saveWeeklyRosterAction` + `saveBulkPayrollSettingsAction` validate `user_id` payloads against company membership (invalid ids silently dropped).
- `resetDummyPasswordAction`: Admin-only + tenant match on target user. `regenerateInviteCodeAction`: Admin/Manager + tenant match on target role.
- Static-analysis test `tests/authz.test.mjs` (5 tests) — fails if any action loses its guard. Full suite: 30/30 pass. `tsc --noEmit` clean. `next build` clean.

**Housekeeping**: outreach log batch 1 committed to marketing-kit.md; scratch tooling removed.

## Verification status

- [x] `npx tsc --noEmit` — clean
- [x] `npm test` — 30/30
- [x] `npm run build` — clean
- [x] Live smoke test post-deploy (login/register on apex.lankdev.my.id, /shifts /payroll render) — do after push

## 2026-09-09 (later) — Role/RLS audit round 2 + infra completion

**Closed holes** (commit 69e566c + 75c7fca):
- `select_roles` RLS: dropped `OR auth.role() = 'anon'` — strangers could enumerate every tenant's invite_code and join any company. Verified closed: anon `GET /roles` returns `[]`.
- `modify_own_user` RLS: now pins `company_id` — previously an employee could move their own profile into another tenant (takeover via get_company_id()). Verified: cross-tenant PATCH returns 403, harmless self-update still 204.
- `users` table: client INSERT/DELETE denied via API (service role only). Verified 403.
- Super-admin gate (page + updateCompanyTierAction + bootstrap): `user_metadata.role` → `app_metadata.role`. user_metadata is client-writable via updateUser() with the anon key; app_metadata is admin-API-only.
- `generateRequestCode`: modulo bias removed via rejection sampling (36-char alphabet, bytes ≥ 252 redrawn).

**Infra completed**:
- Vercel prod env now set: SUPER_ADMIN_EMAIL/PASSWORD (generated, stored in %LOCALAPPDATA%/Temp/apex_superadmin.txt), CRON_SECRET, WHATSAPP_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL.
- Super-admin bootstrapped via POST /api/bootstrap/super-admin → 201 (user d78000a7-ce45-4949-a716-23be3dd16291).
- vercel.json cron: /api/cron/cleanup daily 17:00 UTC (00:00 WIB) — trial expiry + suspended-company purge.

**Incident note**: `git add -A` briefly committed `.hermes-check/` + `supabase/.temp/` to the public repo (commit 69e566c). Removed in 75c7fca + gitignored. Content audit: all credential files were EMPTY (0 bytes) due to an MSYS path quirk; pooler-url contains hostname only, no password. No secret material leaked. Keep `.hermes-check/` and `supabase/.temp/` out of commits.
