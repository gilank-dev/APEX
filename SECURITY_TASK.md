# APEX Security Fixes + Brutal Test Suite

You are in the APEX repo (Next.js 16 App Router, TS, Supabase). Read AGENTS.md first. `TASK.md` from the previous job is DONE — do not redo it.

## Vulnerabilities found in audit — fix ALL of these

### V1 — CRITICAL: super-admin seeded with hardcoded weak password, on every login attempt
File: `src/lib/actions.ts` (`loginAdminAction`).
The interceptor seeds `super-lankdev@apex.internal` with password `super-lankdev` (or SUPER_ADMIN_PASSWORD) whenever it's missing — triggered by ANY visitor typing `super-lankdev` in the login form. Problems:
1. Known default password in a public GitHub repo = anyone on the internet can become platform owner.
2. Auto-seeding an admin account from an unauthenticated login form is account-takeover-by-design.
Fix:
- Remove ALL auto-seed logic from `loginAdminAction`. Never create auth users from the login path.
- Move super-admin bootstrapping to a new route `POST /api/bootstrap/super-admin` that: (a) is FAIL-CLOSED — returns 403 unless `process.env.SUPER_ADMIN_PASSWORD` AND `process.env.SUPER_ADMIN_EMAIL` are both set; (b) if a super-admin already exists (check `auth.admin.listUsers()` for email match OR user_metadata.role === 'super-admin'), returns 409 without changing anything; (c) creates the user with the env email + strong password (min 12 chars enforced, reject shorter with 400), `email_confirm: true`, metadata role super-admin.
- `loginAdminAction` keeps ONLY the email alias mapping: typing `super-lankdev` maps to `process.env.SUPER_ADMIN_EMAIL || 'super-lankdev@apex.internal'` then normal sign-in. If sign-in fails → generic error (never reveal whether the account exists).
- Update `src/app/super-admin/page.tsx` email check to match env var (already done in previous job — just keep it).

### V2 — CRITICAL: `/super-admin` access check is OR, not AND
File: `src/app/super-admin/page.tsx` line ~18.
`if (user.email !== superAdminEmail && user.user_metadata?.role !== 'super-admin')` — ANY employee can set `role: 'super-admin'` in their signup metadata via `auth.signUp` options (register path sets `role: 'Admin'`, but the check trusts client-supplied metadata as a bypass!). Fix: require BOTH conditions — email must match AND metadata role must be 'super-admin' (AND). If metadata is client-settable anywhere in signup flows, that's fine because email is the real gate; role metadata alone must NEVER grant access.
Also in the same file: it queries ALL companies + ALL attendance/tasks counts — keep (super-admin needs it), but ensure the redirect for non-super-admins stays.

### V3 — HIGH: whatsapp webhook accepts attacker-chosen company_id → tier set to 'suspended'
File: `src/app/api/webhooks/whatsapp/route.ts`.
Anyone who knows/guesses `WHATSAPP_WEBHOOK_SECRET` (or if it's leaked once) can suspend ANY tenant (`suspended` is a valid tier value). Also no audit trail. Fix:
- Reject `new_tier === 'suspended'` with 400 (suspension must be manual in super-admin dashboard).
- Add timestamp window: body must contain `ts` (unix seconds); reject if `|now - ts| > 300`.
- Add a signature: `x-apex-sig` header = HMAC-SHA256(secret, `${company_id}:${new_tier}:${ts}`) hex; verify with `crypto.timingSafeEqual`; reject on mismatch (401). Keep old header as fallback ONLY when body has no ts (backward compat) — actually NO: single path only, HMAC required, old static header path removed.
- Log every accepted + rejected attempt with company_id, tier, ts, IP to console (structured JSON) — no PII beyond that.

### V3b — webhook secret must not be weak: if `WHATSAPP_WEBHOOK_SECRET` is unset → fail closed (already does) — keep + test.

### V4 — HIGH: anonymous users can enumerate + join any company via invite code brute force
`joinEmployeeAction`: invite codes are `AD-XXXXXX`/`EM-XXXXXX` — 6 chars base36 ≈ 2.1B combos, BUT the error message is uniform already. Real issues:
1. No rate limit → brute force is feasible over days.
2. `currentMemberCount` check counts ALL users of the company including dummy accounts — acceptable; keep.
Fix: add in-memory rate limit per IP + per code: max 10 attempts / 10 minutes, tracked in a module-level Map (Vercel serverless: best-effort, document in comment; it's a ponytail fix, upgrade path = Upstash/Redis). Return generic error message `Invalid or expired invitation code.` for rate-limited AND invalid (no distinct message). ALSO include attempts counter keyed by code so brute-forcing one code gets blocked.
Also fix error message leak: when member quota exceeded the error reveals tier + quota numbers — fine, keep (not sensitive).

### V5 — MEDIUM: `updateCompanyTierAction` (super-actions.ts) has no server-side auth
It's a server action called from the super-admin page — server actions are POST-only via Next, and the page guards access. But defense in depth: inside the action, re-check auth: `createClient()` → `getUser()` → must match super-admin email AND metadata role; else return error, no write. Do NOT rely on UI gating.

### V6 — MEDIUM: employee can promote themselves to Admin via `users` UPDATE RLS policy
Migration `20260627000000_initial_schema.sql` policy `modify_own_user`: `FOR UPDATE USING (auth_id = auth.uid())` with NO `WITH CHECK` on `role_id` — Postgres applies the USING clause to the row filter but new row values are unchecked (policy has no WITH CHECK → defaults to USING for the new row, which only checks auth_id — so an employee can set role_id to any role, INCLUDING the Admin role of their company, or even another company's role_id — cross-tenant escalation!). 
Fix in NEW migration `supabase/migrations/20260708000001_rls_hardening.sql`:
- Drop policy `modify_own_user`; recreate as UPDATE with `USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid() AND role_id = public.get_user_role_id())` — i.e. you can only update your own row AND cannot change your role_id. Add helper `get_user_role_id()` SECURITY DEFINER returning the caller's current role_id.
- Drop policy `update_attendance_log` (same missing WITH CHECK pattern — user can update own log's `user_id`/`company_id` to other rows? No — USING gates the target row; new values could change company_id. Add `WITH CHECK (user_id = public.get_user_id() AND company_id = public.get_company_id())`).
- Also `update_task_status` policy: add `WITH CHECK` same as USING.
- Also `update_company` policy: currently any Admin of the company can update ANY column including `tier` — a tenant Admin can self-upgrade to enterprise for free! Add a trigger `prevent_tier_self_change`: BEFORE UPDATE ON companies, if `OLD.tier <> NEW.tier` and `auth.uid()` IS NOT NULL and the caller is not the super admin (check `auth.jwt() ->> 'email'` != super admin email… but email comes from env, not available in SQL. Simpler: block tier changes via anon/auth sessions entirely at RLS level: change `update_company` policy to `WITH CHECK (OLD.tier = NEW.tier)`. Super-admin uses service-role (adminClient) which bypasses RLS → still works. Document in comment.) Also block slug changes similarly? Admin page doesn't edit slug; keep simple: tier lock only, comment noting upgrade path.
- KEEP the existing `20260627000000_initial_schema.sql` file UNTOUCHED (it's already applied to prod DB; editing history breaks migration state). All fixes go in the new migration file ONLY.

### V7 — LOW: `proxy.ts` blacklist doesn't include `super-admin`... it DOES (line 55). Skip. BUT: `pathParts.length === 0` only skips exact root — also skip `/join` and `/login` etc — they're in blacklist already. OK skip V7. No change.

### V8 — MEDIUM: `/api/cron/cleanup` deletes companies with `tier='suspended'` older than 60 days by updated_at — fine, but requires CRON_SECRET: fail-closed only when env set? Code: `if (!cronSecret || authHeader !== Bearer) 401` — fail-closed. OK keep. BUT add GET-only guard: it IS GET-only. OK no change.

### V9 — MEDIUM: pseudo-email collision in joinEmployeeAction
`${generatedId}@${companySlug}.local` — 8 random base36 chars, collision unlikely; but if insert fails the code deletes auth user and returns error — acceptable. Skip.

### V10 — README leaks default super-admin credentials (line ~107). Change to describe `/api/bootstrap/super-admin` flow: set SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD envs, then POST to bootstrap once. Remove the literal default password from README.

### V11 — HIGH: registerTenantAction `tier: 'free'` hardcode — fine. But `active_modules` defaults — fine. Skip.

### V12 — subscription page: company data comes from server `users` table join — RLS-protected. OK.

## Test suite — create `tests/brutal.test.ts` (plain Node, no framework)

Write a zero-dependency Node test runner `tests/run.mjs` (node:test) — Node 24 built-in `node --test` + `assert`. NO new npm deps. Tests run WITHOUT a real Supabase (mock via dependency injection or by testing pure functions + source-scanning invariants). Structure:

Extract the pure logic so it's testable: put request-code generation + rate limiter in `src/lib/security.ts` (new file, no React, importable by node without Next runtime):
- `generateRequestCode(slug)` → `APX-XXXX-YYYYYY` pattern (4 slug chars sanitized uppercase alnum, 6 random alnum). Must be deterministic format, reject/handle weird slugs (unicode, empty, symbols).
- `hmacSignature(secret, companyId, tier, ts)` → hex sha256 hmac string.
- `verifyTimestamp(ts, now, windowMs)` → boolean.
- `createRateLimiter(opts)` → `{ check(key): {allowed, retryAfterSec}, reset(key) }` sliding/fixed window in-memory.
- `validateTierTransition(current, next)` → allow free→pro, free→enterprise, pro→enterprise, pro→free, enterprise→pro, *→suspended? NO: suspended only via super-admin manual, function returns false for suspended unless `opts.allowSuspend`.

`tests/brutal.test.ts` — import from `../src/lib/security.ts`… wait, TS files can't be imported by node --test directly. Solution: compile check via `npx tsc --noEmit` separately; for runtime tests, use Node 24 native TS type-stripping: Node 24 supports `--experimental-strip-types` (flag not needed in 22.6+/23; in 24 it's on by default). Node 24.11: type stripping is stable, `.ts` files import fine as long as no TS-only runtime features (no enums, no namespaces, no param properties). Write security.ts with plain types only. Test file `tests/brutal.test.mjs` (or .ts) imports `../src/lib/security.ts` directly.

Tests to write (BE BRUTAL):
1. Request code: format regex, uniqueness over 10k iterations, sanitization (slug ` café-Şöld!!` → uppercase alnum), empty slug throws or falls back `APX-XXXX-...`.
2. HMAC: known-vector test (fixed secret/company/tier/ts → exact hex, verify against `crypto.createHmac` manually computed), tamper each field → verify false, timing-safe path, wrong secret → false.
3. Timestamp window: exactly +299s ok, +301s rejected, -301s rejected, garbage ts → rejected (NaN).
4. Rate limiter: 10 ok then blocked, retryAfter > 0, different keys independent, reset works, clock-math boundary at window rollover.
5. Tier transitions: matrix — free→pro T, free→enterprise T, pro→enterprise T, downgrades T, →suspended F (default), suspended→anything F, invalid strings F, case sensitivity ('PRO' invalid), same-tier F (no-op).
6. Source-scan invariants (read files as text, assert):
   - `src/lib/actions.ts` does NOT contain `createUser` inside loginAdminAction block (grep between function boundaries — assert no `admin.createUser` in the whole login action; the only createUser allowed is in joinEmployeeAction and registerTenantAction and bootstrap route).
   - `src/app/super-admin/page.tsx` uses `&&` not `||` for the two super-admin conditions (assert the exact hardened line exists).
   - `src/app/api/webhooks/whatsapp/route.ts` has no `timingSafeEqual` misuse — just assert it uses timingSafeEqual + rejects 'suspended'.
   - `supabase/migrations/` newest file contains `WITH CHECK` for modify_own_user replacement + tier lock on update_company.
   - README has no default password string `super-lankdev` as literal password (assert the bootstrap instructions exist instead).
   - No `Math.random` in security.ts request-code when randomness needed? Math.random fine for request codes (not crypto). But invite codes + hmac use crypto. Assert security.ts exports use `node:crypto`.
7. Bootstrap route logic (pure part extracted into security.ts as `validateBootstrapPassword(pw)` — min 12 chars, must contain upper+lower+digit; test: 'short' fail, 'Abcdef123456' pass wait that's 12 with upper/lower/digit → pass, 'abcdefghijkl' fail (no digit), 'ABCDEF123456' fail (no lower), null fail.
8. Sanity: `npx tsc --noEmit` must pass — run it in the test as a subprocess? NO — keep tests fast; tsc runs separately in CI command.

Also update `package.json` scripts: `"test": "node --test tests/"`.

## Order of work
1. Create `src/lib/security.ts` (pure, node:crypto only).
2. Refactor routes/actions to use it (V1, V3, V4, V5, V10).
3. New migration file (V6) — SQL only, correct Postgres syntax, idempotent-ish (use DROP POLICY IF EXISTS).
4. Write `tests/brutal.test.mjs` covering all the above.
5. Run: `npm test` then `npx tsc --noEmit` then `npm run build` — ALL must pass.
6. `git add -A && git status` (do NOT commit — leave staged-or-unstaged, human commits).

Report: list of vulns fixed, test results output, files changed.
