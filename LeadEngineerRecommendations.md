# Lead Engineer Recommendations for APEX Platform

## Executive Summary

Based on analysis of the APEX codebase (Next.js 16 App Router, TypeScript, Supabase), security audit findings, and current engineering recommendations, this document provides expert lead engineering recommendations across four critical areas:

1. **Multi-tenant RLS Security Hardening & Verification**
2. **Immutable Audit Trail Architecture** (selfie hashing, append-only logs)
3. **Performance & Caching** (Redis/Vercel KV, DB indexing, background jobs)
4. **Code Quality & ADRs** (modularization, testing expansion)

Each area includes prioritized, actionable recommendations with implementation guidance, acceptance criteria, and sequencing.

---

## 1. Multi-tenant RLS Security Hardening & Verification

### Current State
- RLS policies exist for most tables following the pattern: `USING (company_id = public.get_company_id())` with appropriate `WITH CHECK` clauses.
- Recent hardening migration (`20260708000001_rls_hardening.sql`) addressed critical vulnerabilities:
  - Hardened `users`, `attendance_logs`, `tasks`, and `companies` update policies.
  - Added `get_user_role_id()` helper and trigger-based tier change protection.
- However, gaps remain in newer tables (kasbon, thr) and verification practices.

### Prioritized Recommendations

#### 1.1 Complete RLS Coverage for New Features (Kasbon & THR)
- **Action**: Ensure all new tables from upcoming kasbon and thr migrations have RLS enabled and appropriate policies.
- **Implementation**:
  - In `kasbon.sql` and `thr.sql` migrations, include:
    ```sql
    ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
    -- Select policy: users see own data, admins/managers see all
    CREATE POLICY select_<table> ON public.<table>
        FOR SELECT USING (
            company_id = public.get_company_id() AND (
                user_id = public.get_user_id() OR
                public.get_user_role() IN ('Admin', 'Manager')
            )
        );
    -- Insert policy: users can only insert for themselves
    CREATE POLICY insert_<table> ON public.<table>
        FOR INSERT WITH CHECK (
            company_id = public.get_company_id() AND
            user_id = public.get_user_id()
        );
    -- Update/Delete policies: admins/managers can modify, users only own
    CREATE POLICY modify_<table> ON public.<table>
        FOR ALL USING (
            company_id = public.get_company_id() AND
            public.get_user_role() IN ('Admin', 'Manager')
        ) WITH CHECK (
            company_id = public.get_company_id() AND
            public.get_user_role() IN ('Admin', 'Manager')
        );
    ```
- **Acceptance Criteria**: 
  - All new tables have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
  - Policies enforce tenant isolation at the database level.
  - Automated tests verify policy enforcement (see Section 4).

#### 1.2 RLS Verification in CI/CD
- **Action**: Add automated RLS validation to the CI pipeline to prevent regressions.
- **Implementation**:
  - Extend `scripts/validate-migrations.sh` to check:
    ```bash
    # Check RLS is enabled on new tables
    for table in $(psql -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity"); do
        if [[ "$table" =~ ^(kasbon|thr)_ ]]; then
            echo "✓ RLS enabled on $table"
        fi
    done
    ```
  - Add a Supabase function test that attempts cross-tenant access and expects failure.
- **Acceptance Criteria**:
  - CI job `validate-migrations` fails if any table handling tenant data lacks RLS.
  - Cross-tenant access attempts are blocked and logged.

#### 1.3 Role-Based Policy Refinement
- **Action**: Differentiate policies between Admin and Manager roles where appropriate (e.g., THR approvals).
- **Implementation**:
  - For sensitive operations (e.g., approving Kasbon requests), restrict to Admin only:
    ```sql
    CREATE POLICY approve_kasbon_request ON public.kasbon_requests
        FOR UPDATE USING (
            company_id = public.get_company_id() AND
            public.get_user_role() = 'Admin'
        ) WITH CHECK (
            company_id = public.get_company_id() AND
            public.get_user_role() = 'Admin' AND
            status IN ('approved', 'rejected')
        );
    ```
- **Acceptance Criteria**:
  - Managers can view but not approve Kasbon/THR requests.
  - Admins have full privileges on financial operations.

#### 1.4 Regular RLS Audits
- **Action**: Schedule monthly automated RLS audit using `pg_row_security` and policy inspection.
- **Implementation**:
  - Add a Supabase function `audit_rls_coverage()` that reports tables without RLS or missing policies.
  - Integrate into monthly security report via cron job.
- **Acceptance Criteria**:
  - Zero tables storing tenant-specific data lack RLS.
  - Audit results are visible to security team.

---

## 2. Immutable Audit Trail Architecture

### Current State
- Attendance logs have basic immutability via triggers preventing updates to core fields after approval (see `prevent_attendance_tamper()` in migrations).
- Selfie photos are stored as base64 in IndexedDB offline, then uploaded to Supabase Storage on reconnect.
- No cryptographic hashing or verifiable audit trail for attendance events.
- No append-only log architecture for critical business events (e.g., payroll changes, role modifications).

### Prioritized Recommendations

#### 2.1 Cryptographic Selfie Hashing for Attendance Verification
- **Action**: Implement client-side SHA-256 hashing of selfie photos before upload, storing hash in attendance log for verification.
- **Implementation**:
  - In `AttendancePage.tsx` or camera capture component:
    ```ts
    async function hashSelfie(blob: Blob): Promise<string> {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    ```
  - On successful photo capture:
    1. Compute hash.
    2. Upload photo to Supabase Storage.
    3. Insert attendance log with `photo_hash` and `photo_url`.
  - On verification (e.g., audit), recompute hash from stored photo and compare.
- **Acceptance Criteria**:
  - Every attendance log includes a `photo_hash` column (TEXT).
  - Hash is computed client-side before upload.
  - Verification script can detect photo tampering.

#### 2.2 Append-Only Event Log for Critical Operations
- **Action**: Create an `audit_events` table as an immutable, append-only log for security-sensitive and financial operations.
- **Implementation**:
  - Migration:
    ```sql
    CREATE TABLE public.audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
        event_type VARCHAR NOT NULL CHECK (event_type IN (
            'attendance_clock_in', 'attendance_clock_out',
            'kasbon_request', 'kasbon_approval',
            'payroll_run', 'payroll_setting_change',
            'role_change', 'tier_change',
            'super_admin_action'
        )),
        event_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        -- Immutable: no updates or deletes allowed
    );
    ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
    -- RLS: users see own events, admins see all in company
    CREATE POLICY select_audit_events ON public.audit_events
        FOR SELECT USING (
            company_id = public.get_company_id() AND (
                user_id = public.get_user_id() OR
                public.get_user_role() IN ('Admin', 'Manager')
            )
        );
    -- Prevent updates/deletes
    CREATE OR REPLACE FUNCTION prevent_audit_event_modification()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'Audit events are immutable.';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    CREATE TRIGGER tr_prevent_audit_event_modification
        BEFORE UPDATE OR DELETE ON public.audit_events
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_modification();
    ```
  - Server actions (e.g., `decideKasbonRequestAction`) insert audit event after successful operation.
- **Acceptance Criteria**:
  - All security/financial operations generate an audit event.
  - Table is append-only (update/delete attempts fail).
  - Events are queryable via RLS-protected API.

#### 2.3 Tamper-Evident Log Chaining (Optional Enhancement)
- **Action**: For highest assurance, chain audit events using hash linking (blockchain-style).
- **Implementation**:
  - Add `previous_hash` column to `audit_events`.
  - Before insert, compute hash of previous event's concatenated data + current event data.
  - Store root hash in a secure location (e.g., environment variable updated daily).
- **Acceptance Criteria**:
  - Any tampering with historical events breaks the chain and is detectable.
  - Performance impact is acceptable (<10ms per event).

#### 2.4 Offline Audit Trail Consistency
- **Action**: Ensure offline actions generate verifiable audit trails upon sync.
- **Implementation**:
  - In `OfflineSyncProvider.tsx`, when syncing an offline action:
    1. Compute hash of action payload (including any selfie).
    2. Upon successful server insertion, insert audit event with `offline_origin: true`.
    3. If sync fails, retain hash for retry.
- **Acceptance Criteria**:
  - Offline actions are auditable once synced.
  - Audit trail includes origin (online/offline) flag.

---

## 3. Performance & Caching

### Current State
- Basic caching: SWR for client data fetching, no server-side caching layer.
- Database indexes exist for common query patterns (e.g., `attendance_logs` on `user_id, clock_in_time`).
- No background job queue; heavy operations run synchronously in server actions.
- Vercel edge functions not utilized; all logic runs in Node.js serverless.
- No Redis or Vercel KV integration.

### Prioritized Recommendations

#### 3.1 Implement Redis/Vercel KV for Session Caching & Rate Limiting
- **Action**: Replace in-memory rate limiter (`src/lib/security.ts`) with Redis-backed distributor for multi-instance safety.
- **Implementation**:
  - Install `ioredis` or use Vercel KV (if on Vercel Pro).
  - Refactor `createRateLimiter` to use Redis:
    ```ts
    // src/lib/rateLimiterRedis.ts
    import Redis from 'ioredis';
    const redis = new Redis(process.env.REDIS_URL);
    export function createRedisRateLimiter(options: { maxAttempts: number; windowMs: number }) {
        return {
            async check(key: string): Promise<{ allowed: boolean; retryAfterSec: number }> {
                const now = Date.now();
                const windowSec = Math.ceil(options.windowMs / 1000);
                const count = await redis.incr(key);
                if (count === 1) await redis.expire(key, windowSec);
                const allowed = count <= options.maxAttempts;
                const retryAfterSec = allowed ? 0 : Math.ceil((windowSec - (now % windowSec)));
                return { allowed, retryAfterSec };
            },
            async reset(key: string) { await redis.del(key); }
        };
    }
    ```
  - Update `src/lib/actions.ts` to use Redis rate limiter.
- **Acceptance Criteria**:
  - Rate limiting works across multiple Vercel serverless instances.
  - Fallback to in-memory limiter if Redis unavailable (degraded mode).

#### 3.2 Add Strategic Database Indexes
- **Action**: Identify and add indexes for frequent query patterns in new features.
- **Implementation**:
  - Kasbon requests: 
    ```sql
    CREATE INDEX idx_kasbon_requests_user_status ON public.kasbon_requests (user_id, status);
    CREATE INDEX idx_kasbon_requests_company_dates ON public.kasbon_requests (company_id, earn_period_start, earn_period_end);
    ```
  - THR runs:
    ```sql
    CREATE INDEX idx_thr_runs_user_schedule ON public.thr_runs (user_id, thr_schedule_id);
    CREATE INDEX idx_thr_runs_company_date ON public.thr_runs (company_id, created_at);
    ```
  - Audit events:
    ```sql
    CREATE INDEX idx_audit_events_company_type ON public.audit_events (company_id, event_type);
    CREATE INDEX idx_audit_events_user_time ON public.audit_events (user_id, created_at);
    ```
- **Acceptance Criteria**:
  - Queries using these indexes show >50% performance improvement in EXPLAIN ANALYZE.
  - No redundant indexes; each index serves a clear query pattern.

#### 3.3 Background Job Queue for Non-User-Facing Operations
- **Action**: Offload email sending, report generation, and data exports to background jobs.
- **Implementation**:
  - Use BullMQ with Redis or Vercel Cron + Queues.
  - Example: Monthly THR calculation job.
    ```ts
    // src/lib/jobs/thrCalculationJob.ts
    import { Queue } from 'bullmq';
    const thrQueue = new Queue('thr-calculation', { connection: { host: process.env.REDIS_URL } });
    export async function scheduleMonthlyTHRCalculation(companyId: string) {
        await thrQueue.add('calculate-thr', { companyId }, { repeat: { cron: '0 0 1 * *' } });
    }
    ```
  - Worker processes jobs and updates `thr_runs` table.
- **Acceptance Criteria**:
  - Long-running operations (>2s) are moved to background.
  - User-facing actions remain under 1s response time.
  - Failed jobs are retryable with exponential backoff.

#### 3.4 Edge Caching for Public Assets
- **Action**: Leverage Vercel Edge Middleware to cache static assets and API responses.
- **Implementation**:
  - In `middleware.ts`:
    ```ts
    export const config = {
        matcher: ['/api/public/:path*', '/_next/static/:path*', '/assets/:path*'],
    };
    export async function middleware(request: NextRequest) {
        const url = request.nextUrl;
        // Cache public API responses for 1 hour
        if (url.pathname.startsWith('/api/public/')) {
            const response = await NextResponse.next();
            response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
            return response;
        }
        // ... existing logic
    }
    ```
- **Acceptance Criteria**:
  - Public assets served from Vercel edge cache reduce origin load.
  - Cache headers verified via `curl -I`.

#### 3.5 Database Connection Pooling & Query Optimization
- **Action**: Ensure efficient use of Supabase connection pooling and optimize N+1 queries.
- **Implementation**:
  - Use `pgBouncer` via Supabase (already enabled; ensure `max_connections` is not exceeded).
  - Audit server actions for N+1 patterns (e.g., fetching user details in a loop).
  - Fix with joins or prefetching:
    ```ts
    // Bad: N+1
    const users = await db.from('users').eq('company_id', cid);
    for (const u of users) {
        const settings = await db.from('employee_payroll_settings').eq('user_id', u.id).single();
    }
    // Good: Join
    const { data } = await db.from('users')
        .select(`
            *,
            employee_payroll_settings(*) 
        `)
        .eq('company_id', cid);
    ```
- **Acceptance Criteria**:
  - Average database query time < 100ms.
  - No N+1 queries detected in performance monitoring.

---

## 4. Code Quality & ADRs

### Current State
- Code is modular (`src/lib/` with domain-specific files: `attendance-recap.ts`, `payroll.ts`, `security.ts`, etc.).
- Testing strategy outlined in `ENGINEERING_RECOMMENDATIONS.md` (Vitest, Playwright) but not fully implemented.
- No Architectural Decision Records (ADRs) documented.
- Some server actions contain business logic that could be extracted to pure functions.

### Prioritized Recommendations

#### 4.1 Implement Test Expansion Plan from ENGINEERING_RECOMMENDATIONS.md
- **Action**: Execute the testing roadmap to achieve coverage targets.
- **Implementation**:
  - **Phase 1 (Immediate)**:
    - Migrate existing `node:test` tests to Vitest (`tests/unit/`).
    - Add Vitest config and dependencies.
    - Write unit tests for `attendance-recap.ts` and `payroll.ts` pure functions.
  - **Phase 2 (Short-term)**:
    - Add integration tests for server actions with mocked Supabase client.
    - Implement `tests/mocks/supabase.ts`.
  - **Phase 3 (Medium-term)**:
    - Write Playwright E2E tests for core flows (selfie attendance, offline sync, payroll).
    - Create test tenant setup script.
  - **Acceptance Criteria**:
    - Unit test coverage: 90% for pure logic modules.
    - Integration test coverage: 70% for server actions.
    - E2E test coverage: 80% for critical user journeys.
    - All tests pass in CI.

#### 4.2 Establish Architectural Decision Records (ADRs)
- **Action**: Create `docs/adr/` directory and document key architectural decisions.
- **Implementation**:
  - Template:
    ```markdown
    # ADR 001: Use Row-Level Security for Multi-Tenancy
    ## Status
    Accepted
    ## Context
    APEX serves multiple tenants (companies) requiring strict data isolation.
    ## Decision
    Implement row-level security (RLS) on all tenant-scoped tables using Supabase's built-in RLS with helper functions (`get_company_id()`, `get_user_id()`).
    ## Consequences
    - Positive: Database-level enforcement prevents bypass via API bugs.
    - Negative: Requires careful policy design; complex queries may need security definer functions.
    ```
  - Initial ADRs to write:
    - ADR 001: RLS for Multi-Tenancy
    - ADR 002: Immutable Audit Trail for Security Events
    - ADR 003: Client-Side Selfie Hashing for Verification
    - ADR 004: Redis-Based Distributed Rate Limiting
    - ADR 005: Vitest + Playwright Testing Strategy
- **Acceptance Criteria**:
  - ADRs are stored in version control and linked from README.
  - New architectural decisions follow ADR process.

#### 4.3 Extract Business Logic to Pure Functions
- **Action**: Move complex calculations from server actions to pure, testable functions in `src/lib/`.
- **Implementation**:
  - Example: Move Kasbon eligibility calculation from `kasbon-actions.ts` to `src/lib/kasbon.ts`.
    ```ts
    // src/lib/kasbon.ts (pure)
    export function calculateEligibleAdvance(
        earnedWages: number,
        maxAdvancePercent: number,
        requestedAmount: number,
        rollingBalance: number,
        limit: number
    ): { approvedAmount: number; netPayout: number; error?: string } {
        // ... pure calculation logic
    }
    ```
  - Server action becomes thin wrapper:
    ```ts
    // src/lib/kasbon-actions.ts
    import { calculateEligibleAdvance } from './kasbon';
    export async function requestKasbonAction(...) {
        // ... fetch data
        const result = calculateEligibleAdvance(earnedWages, maxAdvancePercent, amount, rollingBalance, limit);
        // ... insert request
    }
    ```
- **Acceptance Criteria**:
  - Pure functions are unit-testable without mocking Supabase.
  - Server actions focus on orchestration and side effects.
  - Reduction in complex conditional logic in actions.ts files.

#### 4.4 Enforce Code Quality via Pre-Commit and CI
- **Action**: Strengthen pre-commit hooks and CI checks to maintain quality.
- **Implementation**:
  - Extend `lint-staged` to include:
    ```json
    "lint-staged": {
        "*.{ts,tsx}": [
            "eslint --fix",
            "prettier --write",
            "typescript --noEmit"
        ],
        "*.sql": "sqlfmt --check"
    }
    ```
  - Add `package.json` prepare hook:
    ```json
    "prepare": "husky install"
    ```
  - In CI, add:
    - `npm run lint`
    - `npm run test:run -- --coverage` with coverage thresholds.
    - `npx tsc --noEmit`
    - `npm run build`
- **Acceptance Criteria**:
  - Pre-commit blocks commits with lint errors, type errors, or unformatted SQL.
  - CI fails if coverage drops below thresholds.
  - Zero warnings in `tsc --noEmit`.

#### 4.5 Dependency Management & Security
- **Action**: Regularly update dependencies and audit for vulnerabilities.
- **Implementation**:
  - Add `npm audit` to CI.
  - Use `dependabot` via GitHub Actions:
    ```yaml
    # .github/dependabot.yml
    version: 2
    updates:
      - package-ecosystem: "npm"
        directory: "/"
        schedule:
            interval: "daily"
    ```
  - Review and update lockfile monthly.
- **Acceptance Criteria**:
  - No high-severity vulnerabilities in `npm audit`.
  - Dependencies updated within 30 days of release.

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Complete RLS for kasbon/thr migrations.
- [ ] Add RLS verification to CI migration validation.
- [ ] Begin test migration: set up Vitest, migrate existing tests.
- [ ] Extract first pure functions (attendance-recap helpers).

### Phase 2: Security & Audit (Weeks 3-4)
- [ ] Implement selfie hashing for attendance.
- [ ] Create audit_events table and insert points.
- [ ] Add role-based policy refinements (Admin vs Manager).
- [ ] Write ADR 001-003.

### Phase 3: Performance (Weeks 5-6)
- [ ] Integrate Redis rate limiter (fallback to memory).
- [ ] Add strategic DB indexes for new tables.
- [ ] Implement background job queue for THR/payroll reports.
- [ ] Add edge caching middleware.

### Phase 4: Quality & Monitoring (Weeks 7-8)
- [ ] Complete test expansion to coverage targets.
- [ ] Establish ADR process and document key decisions.
- [ ] Strengthen pre-commit and CI quality gates.
- [ ] Setup dependency audit and monthly review.

### Ongoing
- [ ] Monthly RLS audit report.
- [ ] Quarterly performance review.
- [ ] Bi-weekly ADR review for new decisions.

---

## Success Metrics

| Area | Metric | Target |
|------|--------|--------|
| Security | Cross-tenant access attempts blocked | 100% |
| Audit Trail | Attendance verifiable via hash | 100% of logs |
| Performance | Avg. API response time (p95) | < 800ms |
| Testing | Unit test coverage (pure logic) | ≥90% |
| Quality | Pre-commit hook pass rate | 100% |
| Reliability | Background job success rate | ≥99% |

---

## Conclusion

These recommendations address the most critical technical leverage points in the APEX platform: strengthening the multi-tenant security foundation, ensuring verifiable audit trails, optimizing performance through caching and background processing, and elevating code quality through testing and architectural discipline. By implementing this roadmap, APEX will achieve enterprise-grade security, reliability, and maintainability suitable for scaling to hundreds of tenants.

**Next Step**: Review this document with the engineering team and begin Phase 1 implementation.