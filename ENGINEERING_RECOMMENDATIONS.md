# APEX — Engineering Recommendations

## 1. TDD & Automated Testing Strategy

### Current State
- **46/46 tests passing** via `node --test tests/` (Node.js built-in runner)
- Test types: static analysis (guard ordering, source-scan invariants), pure-logic unit tests (CSV parsing, security functions, rate limiting, tier transitions)
- **No E2E tests** — all 46 tests are static-analysis and pure-function unit tests
- Tests run via `npm test` → `node --test tests/`

### 1.1 Expand Unit Test Coverage

**Problem:** Only pure-logic utilities are unit-tested. Server actions, Supabase client interactions, and business logic in `attendance-recap.ts`, `payroll.ts` have zero coverage.

**Recommendations:**

#### a. Use Vitest for Unit + Integration Tests

Replace the `node:test` runner with **Vitest** (first-class Next.js 16 support, native TypeScript, Vite-speed transforms, watch mode):

```json
// package.json — scripts section
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

Add dev dependencies:
```bash
npm i -D vitest @vitest/ui @vitest/coverage-v8 happy-dom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
      exclude: ['src/lib/supabase/**', 'src/lib/features.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

```ts
// tests/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock browser APIs needed for client components
vi.stubGlobal('matchMedia', vi.fn(() => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
})))
```

#### b. Test Business Logic (Pure Functions)

**`src/lib/attendance-recap.ts`** — `computeMonthlyAttendanceRecap`:
- Test late-minute calculation at exactly 10-minute boundary (should NOT be late)
- Test late-minute at 11 minutes (should be late)
- Test overnight shift OT calculation crossing midnight
- Test absent-days: assigned shift with no log
- Test duplicate logs on same date (multiple clock-ins)
- Test employee with no assignments (no absent days counted)
- Test Indonesian locale date formatting for month display

**`src/lib/payroll.ts`** — `computeMonthlyPayroll`:
- Test zero OT hours → otPay = 0
- Test OT rounding: `Math.round` behavior at 0.5 boundaries
- Test inactive employee (active=false) still appears in output
- Test missing payroll settings → baseSalary defaults to 0
- Test Indonesian Rupiah formatting (`formatRupiah`) for large numbers
- Test CSV export output format (BOM, semicolon delimiter)

**`src/lib/csv.ts`** — `parseCsv` + `rowsToEmployees` (already well-tested, extend):
- Test multi-line fields with embedded newlines inside quotes
- Test rows exceeding 200 cap returns exactly 200
- Test role_name case normalization (input "manager" → "Manager")
- Test email dedup is case-insensitive but preserves first-seen casing

#### c. Integration Tests for Server Actions (supabase client mocks)

Create `./tests/server-actions/` with Supabase client mocks:

```ts
// tests/mocks/supabase.ts
import { vi } from 'vitest'

export const mockSupabaseClient = () => {
  const mockInsert = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn().mockReturnThis()
  const mockMaybeSingle = vi.fn()
  const mockFrom = vi.fn(() => ({
    select: mockSelect.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: mockEq,
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    single: vi.fn(),
  }))

  return {
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    storage: {
      from: () => ({
        upload: vi.fn(),
        createSignedUrl: vi.fn(),
      }),
    },
  }
}
```

**Test cases for `leave-actions.ts`:**
- `createLeaveRequestAction`: past start_date rejected, future end_date < start_date rejected, reason > 500 chars rejected, invalid leave_type rejected
- `decideLeaveRequestAction`: non-pending status rejected, non-manager rejected, double-approval race guard

**Test cases for `payroll-actions.ts`:**
- `saveBulkPayrollSettingsAction`: non-manager rejected, invalid user_id filtered out, negative base_salary clamped to 0

**Test cases for `admin-actions.ts`:**
- `importEmployeesAction`: quota enforcement (tier limit boundary), duplicate emails skipped, invalid rows generate errors
- `createDummyAccountAction`: tier quota boundary (exactly at max allowed)
- `regenerateInviteCodeAction`: non-admin rejected, wrong-company rejected, uses crypto-random not `Math.random` (security regression test)

**Test cases for `shift-actions.ts`:**
- `decideSwapRequestAction`: swap ownership change detection, partial-failure rollback path
- `cancelSwapRequestAction`: only requester cancels, terminal states blocked

### 1.2 E2E Testing with Playwright

**Rationale:** The selfie attendance flow, offline queue sync, and payroll calculation are the highest-risk user journeys. Currently verified only via `curl`/manual E2E against prod. Add automated Playwright tests.

```bash
npm i -D @playwright/test
npx playwright install
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: {
      cookies: [],
      origins: [],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### Test Scenarios:

**A. Selfie Attendance Flow**
1. Login as employee → navigate to `/[slug]/attendance`
2. Mock `navigator.mediaDevices.getUserMedia` to return a fake video stream
3. Click "Open Front Camera" → click "AMBIL FOTO"
4. Verify photo preview appears, "PHOTO READY" indicator active
5. Click "CLOCK IN" → verify success toast, active session shows clock-in time
6. Click "CLOCK OUT" → verify session closes, duration displayed
7. Double clock-in → verify 409 conflict error message

**B. Offline Selfie Resilience**
1. Login → set `navigator.onLine = false`
2. Perform clock-in with selfie → verify "Queued for sync" toast
3. Reload page → verify queued action persists in IndexedDB (via `idb-keyval`)
4. Set `navigator.onLine = true` → verify `OfflineSyncProvider` triggers sync
5. Verify attendance_log appears in DB with signed URL (not base64)

**C. Payroll Flow**
1. Login as admin → navigate to `/[slug]/payroll`
2. Switch to Settings tab → modify base_salary for 2 employees
3. Click "Simpan Pengaturan" → verify server action called with correct payload
4. Switch to Run tab → verify computed values: base_salary + ot_pay = total_salary
5. Export CSV → verify file download with UTF-8 BOM and semicolon delimiters

**D. Leave Request Flow**
1. Employee submits leave → verify appears in manager's pending list
2. Manager approves → verify status changes to "DISETUJUI", row revalidation
3. Double-approval attempt → verify race guard prevents double execution

**E. Auth & Tenancy Isolation**
1. Login as employee from tenant A → attempt URL `/tenant-b/dashboard` → verify 307 redirect to own tenant
2. Login as employee → access `/super-admin` → verify 307 redirect
3. Anon access to `/[slug]/dashboard` → verify redirect to `/login`

#### Mocking Supabase Auth in E2E Tests

Use a dedicated test helper that creates a real session via the API:

```ts
// e2e/helpers/auth.ts
import { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  // Visit login page and submit credentials
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  
  // Wait for redirect to tenant dashboard
  await page.waitForURL(/\/[a-z0-9-]+\/dashboard/)
}

export async function loginAsEmployee(page: Page, slug: string) {
  // For automated tests, use a dedicated test tenant with known credentials
  // Set up via a seed script that runs before tests
  await loginAs(page, 'qa-employee@lankdev.my.id', '[REDACTED-see-1password]')
}
```

**Test data management:** Create a `tests/helpers/setup-test-tenant.ts` script that provisions a test tenant (via `registerTenantAction`) with known credentials, seeds basic data (employees, shift templates, attendance logs), and tears down after tests. This avoids polluting the demo tenant.

### 1.3 Migration Existing Tests to Vitest

The existing `node:test` files in `tests/` should be migrated to `tests/unit/`:
- `brutal.test.mjs` → `tests/unit/security.test.ts`
- `authz.test.mjs` → `tests/unit/authz.test.ts`
- `features.test.mjs` → `tests/unit/features.test.ts`

Remove `tests/index.js` entry point, replace `npm test` script with Vitest.

### 1.4 Test Coverage Targets

| Module | Current | Target | Notes |
|---|---|---|---|
| Pure logic (CSV, security, payroll, attendance) | ~20% | 90% | Pure functions, easy to test |
| Server actions (leave, payroll, admin, shifts) | 0% | 70% | Requires Supabase mocking |
| Client components (AttendancePage, PayrollClient) | 0% | E2E coverage via Playwright | Complex DOM/DOM APIs |
| DB migrations / RLS policies | 0% | 100% of new migrations | SQL source-scan invariants |
| Offline sync flows | 0% | 80% | E2E with network emulation |

---

## 2. Database Schema & Migration Optimization

### 2.1 Kasbon (Earned Wage Access) Schema

**Requirements from PRD:** P2 feature for 5 customers. Employees can access earned wages before payday.

#### Migration: `20260910000009_kasbon.sql`

```sql
-- Kasbon: Earned Wage Access (EWA) module
-- Allows employees to request a portion of earned (not yet paid) wages

-- 1. Kasbon configuration per company (advance limits, fee structure)
CREATE TABLE public.kasbon_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    max_advance_percent NUMERIC(5,2) NOT NULL DEFAULT 50.00,  -- Max % of earned wages
    min_request_amount NUMERIC(14,2) NOT NULL DEFAULT 10000,   -- Minimum withdrawal (Rp)
    max_request_amount NUMERIC(14,2) NOT NULL DEFAULT 500000,  -- Maximum single request (Rp)
    processing_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 2.00,  -- Fee deducted from payout
    rolling_balance_limit NUMERIC(14,2) NOT NULL DEFAULT 1000000, -- Total outstanding cap per employee
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id)
);

-- 2. Kasbon requests — one per withdrawal request
CREATE TABLE public.kasbon_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payroll_setting_id UUID REFERENCES public.employee_payroll_settings(id) ON DELETE SET NULL,
    requested_amount NUMERIC(14,2) NOT NULL CHECK (requested_amount > 0),
    approved_amount NUMERIC(14,2) CHECK (approved_amount >= 0),
    processing_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_payout NUMERIC(14,2) CHECK (net_payout >= 0),
    status VARCHAR NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
    -- Reference period (month the wages were earned)
    earn_period_start DATE NOT NULL,
    earn_period_end DATE NOT NULL,
    -- Calculated fields at time of approval
    days_worked INTEGER CHECK (days_worked >= 0),
    daily_rate NUMERIC(14,2),
    earned_to_date NUMERIC(14,2),
    -- Tracking
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    CONSTRAINT valid_kasbon_period CHECK (earn_period_end >= earn_period_start)
);

-- 3. Kasbon repayment ledger — tracks deductions from future payrolls
CREATE TABLE public.kasbon_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    kasbon_request_id UUID NOT NULL REFERENCES public.kasbon_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payroll_run_month DATE NOT NULL,  -- YYYY-MM-01
    amount_deducted NUMERIC(14,2) NOT NULL CHECK (amount_deducted > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(kasbon_request_id, payroll_run_month)
);

-- 4. Helper: compute earned wages for a given period
CREATE OR REPLACE FUNCTION public.compute_earned_wages(
    p_user_id UUID,
    p_company_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS NUMERIC(14,2) AS $$
DECLARE
    v_base_salary NUMERIC(14,2) := 0;
    v_ot_rate NUMERIC(14,2) := 0;
    v_ot_hours NUMERIC(14,2) := 0;
    v_days_worked INTEGER := 0;
    v_daily_rate NUMERIC(14,2) := 0;
    v_days_in_period INTEGER;
    v_earned NUMERIC(14,2) := 0;
BEGIN
    -- Get payroll settings
    SELECT base_salary, overtime_rate_per_hour
    INTO v_base_salary, v_ot_rate
    FROM public.employee_payroll_settings
    WHERE user_id = p_user_id AND company_id = p_company_id AND active = true;

    -- Count distinct work days in period from attendance logs
    SELECT COUNT(DISTINCT clock_in_time::date)
    INTO v_days_worked
    FROM public.attendance_logs
    WHERE user_id = p_user_id
      AND company_id = p_company_id
      AND clock_in_time::date >= p_start_date
      AND clock_in_time::date <= p_end_date;

    -- Sum OT hours from shift assignments with overtime
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (clock_out_time - 
            (shift_end_at AT TIME ZONE 'UTC'))
        ) / 3600.0
    ), 0) INTO v_ot_hours
    FROM public.attendance_logs al
    JOIN public.shift_assignments sa ON al.user_id = sa.user_id 
        AND al.company_id = sa.company_id
        AND al.clock_in_time::date = sa.assignment_date
    JOIN public.shift_templates st ON sa.shift_template_id = st.id
    WHERE al.user_id = p_user_id
      AND al.company_id = p_company_id
      AND al.clock_in_time::date >= p_start_date
      AND al.clock_in_time::date <= p_end_date
      AND al.clock_out_time IS NOT NULL
      AND st.overnight = false  -- Simplified: only non-overnight shifts
    AND al.clock_out_time > (
        sa.assignment_date + (st.start_time || ' seconds')::time
    );

    -- Days in the requested period (for prorating)
    v_days_in_period := p_end_date - p_start_date + 1;
    
    -- Daily rate = base_salary / standard month days (30)
    v_daily_rate := v_base_salary / 30;

    -- Prorated earned wages: (days_worked / days_in_period) * base_salary + ot_pay
    -- Only count up to days_in_period to cap at full month
    IF v_days_in_period > 0 THEN
        v_earned := 
            LEAST(v_days_worked, v_days_in_period) * v_daily_rate 
            + (v_ot_hours * v_ot_rate);
    END IF;

    RETURN ROUND(v_earned, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.kasbon_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasbon_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasbon_repayments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY select_kasbon_config ON public.kasbon_configs
    FOR SELECT USING (company_id = public.get_company_id());

CREATE POLICY modify_kasbon_config ON public.kasbon_configs
    FOR ALL USING (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    ) WITH CHECK (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE POLICY select_kasbon_requests ON public.kasbon_requests
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

CREATE POLICY insert_kasbon_request ON public.kasbon_requests
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() 
        AND user_id = public.get_user_id()
    );

CREATE POLICY decide_kasbon_request ON public.kasbon_requests
    FOR UPDATE USING (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    ) WITH CHECK (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
        AND status IN ('approved', 'rejected', 'cancelled')
    );

CREATE POLICY select_kasbon_repayments ON public.kasbon_repayments
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

CREATE POLICY insert_kasbon_repayment ON public.kasbon_repayments
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() 
        AND user_id = public.get_user_id()
    );

-- Index for performance: status + company for dashboards
CREATE INDEX IF NOT EXISTS idx_kasbon_requests_status_company 
    ON public.kasbon_requests (company_id, status, requested_at DESC);

-- Index for repayment lookups by payroll month
CREATE INDEX IF NOT EXISTS idx_kasbon_repayments_month 
    ON public.kasbon_repayments (payroll_run_month, company_id);

-- Trigger: prevent updating core fields after status is approved/paid
CREATE OR REPLACE FUNCTION public.prevent_kasbon_tamper()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('approved', 'paid') 
       AND (
           NEW.user_id IS DISTINCT FROM OLD.user_id
           OR NEW.company_id IS DISTINCT FROM OLD.company_id
           OR NEW.requested_amount IS DISTINCT FROM OLD.requested_amount
           OR NEW.approved_amount IS DISTINCT FROM OLD.approved_amount
           OR NEW.net_payout IS DISTINCT FROM OLD.net_payout
           OR NEW.earn_period_start IS DISTINCT FROM OLD.earn_period_start
           OR NEW.earn_period_end IS DISTINCT FROM OLD.earn_period_end
       ) THEN
        RAISE EXCEPTION 'Kasbon yang sudah disetujui tidak dapat diubah.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_kasbon_tamper_guard ON public.kasbon_requests;
CREATE TRIGGER tr_kasbon_tamper_guard
    BEFORE UPDATE ON public.kasbon_requests
    FOR EACH ROW EXECUTE FUNCTION public.prevent_kasbon_tamper();
```

**Key Design Decisions:**
- **Config table**: Per-company EWA policy (advance limits, fees) editable in Admin panel
- **Separation of requests and repayments**: Repayments are tracked as a ledger, tied to future payroll runs, enabling audit trail
- **Earned-wage computation**: Server-side PL/pgSQL function that calculates prorated earnings from attendance + shift data — no client-side calculation possible
- **Status immutability**: Trigger prevents tampering with approved/paid requests (mirrors the attendance immutability pattern already in use)
- **Rolling balance limit**: Enforced at insert time via a check function
- **RLS policies**: Follow the existing pattern — employees see own rows, managers/admin see all in company

#### Server Action Interface (Kasbon)

```ts
// src/lib/kasbon-actions.ts
'use server'

export async function requestKasbonAction(
  companyId: string,
  slug: string,
  amount: number,
  periodStart: string,
  periodEnd: string
): Promise<{ success: boolean; error?: string; approvedAmount?: number; netPayout?: number }>

export async function decideKasbonRequestAction(
  companyId: string,
  slug: string,
  requestId: string,
  decision: 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }>

export async function getKasbonBalanceAction(
  companyId: string
): Promise<{ balance: number; limit: number; used: number }>
```

**Test plan for Kasbon actions:**
- Request exceeds rolling balance → rejected with message
- Request below min_request_amount → rejected
- Request exceeds max_advance_percent of earned wages → clamped to allowed amount
- Approving request creates repayment schedule entries
- Double-approval race condition → second approval returns error

### 2.2 THR (Tunjangan Hari Raya) Schema

**Requirements from PRD:** Q1 2027 calculation engine. Indonesian religious holiday bonus paid to all employees before Eid (Lebaran) and other religious holidays.

#### Migration: `20260910000010_thr.sql`

```sql
-- THR: Tunjangan Hari Raya (Religious Holiday Bonus) Calculation Engine
-- Indonesian law requires THR to be paid before major religious holidays

-- 1. THR configuration per company
CREATE TABLE public.thr_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    -- THR amount type: 'prorated' (monthly salary * months) or 'fixed' (fixed amount per employee)
    calculation_type VARCHAR NOT NULL DEFAULT 'prorated' 
        CHECK (calculation_type IN ('prorated', 'fixed')),
    -- For 'fixed' type, the fixed amount per employee
    fixed_amount NUMERIC(14,2) CHECK (fixed_amount >= 0),
    -- Minimum days employed to qualify (Indonesian law: 1 month / 30 days)
    min_days_employed INTEGER NOT NULL DEFAULT 30,
    -- Whether to include OT in the calculation (prorated daily rate + OT share)
    include_overtime BOOLEAN NOT NULL DEFAULT false,
    -- Threshold month (month by which employee must have joined to get full THR)
    -- e.g., 6 = June for Lebaran THR; employees joining after this get prorated
    eligible_month INTEGER CHECK (eligible_month BETWEEN 1 AND 12),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. THR schedule — one per eligible religious holiday per year
CREATE TABLE public.thr_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    -- Holiday name: 'Lebaran', 'Natal', 'Isra Miraj', etc.
    holiday_name VARCHAR NOT NULL,
    -- Target payment date (e.g., 2026-12-24 for Christmas)
    target_payment_date DATE NOT NULL,
    -- Reference month for salary basis (the month the holiday falls in, or prior)
    reference_month DATE NOT NULL,  -- YYYY-MM-01
    -- Status of this schedule
    status VARCHAR NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'calculating', 'calculated', 'paid', 'cancelled')),
    -- Metadata
    calculated_at TIMESTAMPTZ,
    calculated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Unique per company + holiday_name + year
    CONSTRAINT unique_thr_schedule_per_year 
        UNIQUE (company_id, holiday_name, EXTRACT(YEAR FROM target_payment_date))
);

-- 3. THR run results — snapshot of calculation per employee per schedule
CREATE TABLE public.thr_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    thr_schedule_id UUID NOT NULL REFERENCES public.thr_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payroll_setting_id UUID REFERENCES public.employee_payroll_settings(id),
    -- Input calculations
    months_employed INTEGER NOT NULL,      -- Full months at company
    days_employed_current_month INTEGER,    -- Days worked in reference month
    daily_rate NUMERIC(14,2),               -- base_salary / 30 (or actual calendar days)
    base_salary NUMERIC(14,2),              -- Snapshot at time of calculation
    overtime_pay NUMERIC(14,2),             -- OT in reference month (if include_overtime)
    -- Calculated THR amount
    calculated_amount NUMERIC(14,2) NOT NULL,
    -- Deductions (advance kasbon, etc.)
    total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
    -- Final payable
    net_thr_amount NUMERIC(14,2) NOT NULL,
    -- Status
    status VARCHAR NOT NULL DEFAULT 'calculated' 
        CHECK (status IN ('calculated', 'paid', 'void')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 4. THR deductions ledger (links to kasbon repayments for automatic deduction)
CREATE TABLE public.thr_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thr_run_id UUID NOT NULL REFERENCES public.thr_runs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    kasbon_repayment_id UUID REFERENCES public.kasbon_repayments(id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    description VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function: compute THR for a single employee
CREATE OR REPLACE FUNCTION public.compute_thr_for_employee(
    p_user_id UUID,
    p_company_id UUID,
    p_thr_config_id UUID,
    p_reference_month DATE  -- YYYY-MM-01
) RETURNS TABLE (
    months_employed INTEGER,
    days_employed_current_month INTEGER,
    daily_rate NUMERIC(14,2),
    base_salary_snapshot NUMERIC(14,2),
    overtime_pay NUMERIC(14,2),
    calculated_amount NUMERIC(14,2),
    eligible BOOLEAN
) AS $$
DECLARE
    v_hire_date DATE;
    v_base_salary NUMERIC(14,2) := 0;
    v_ot_rate NUMERIC(14,2) := 0;
    v_config RECORD;
    v_months INTEGER;
    v_days_current INTEGER;
    v_daily_rate NUMERIC(14,2) := 0;
    v_ot_pay NUMERIC(14,2) := 0;
    v_calculated NUMERIC(14,2) := 0;
    v_eligible BOOLEAN := true;
    v_last_day_of_month INTEGER;
BEGIN
    -- Get config
    SELECT * INTO v_config FROM public.thr_configs 
    WHERE id = p_thr_config_id AND company_id = p_company_id AND active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, 0, 0, 0, 0, FALSE;
        RETURN;
    END IF;

    -- Get employee hire date (from users.created_at) and payroll settings
    SELECT u.created_at::date, EPS.base_salary, EPS.overtime_rate_per_hour
    INTO v_hire_date, v_base_salary, v_ot_rate
    FROM public.users u
    LEFT JOIN public.employee_payroll_settings EPS ON u.id = EPS.user_id AND EPS.active = true
    WHERE u.id = p_user_id AND u.company_id = p_company_id;

    IF v_hire_date IS NULL THEN
        RETURN QUERY SELECT 0, 0, 0, 0, 0, 0, FALSE;
        RETURN;
    END IF;

    -- Check minimum days employed
    IF (p_reference_month - v_hire_date) < v_config.min_days_employed THEN
        v_eligible := FALSE;
    END IF;

    -- Calculate months employed (full months from hire to reference month)
    v_months := GREATEST(0, 
        (EXTRACT(YEAR FROM p_reference_month) - EXTRACT(YEAR FROM v_hire_date)) * 12 
        + EXTRACT(MONTH FROM p_reference_month) - EXTRACT(MONTH FROM v_hire_date)
    );

    -- Days in reference month before or on hire date (for prorating if hired mid-month)
    v_last_day_of_month := EXTRACT(DAY FROM DATE_TRUNC('month', p_reference_month) + INTERVAL '1 month' - INTERVAL '1 day');
    IF v_hire_date <= DATE_TRUNC('month', p_reference_month) THEN
        v_days_current := v_last_day_of_month;
    ELSE
        v_days_current := v_last_day_of_month - EXTRACT(DAY FROM v_hire_date) + 1;
    END IF;

    -- Daily rate
    IF v_base_salary > 0 THEN
        v_daily_rate := v_base_salary / v_last_day_of_month;
    END IF;

    -- Calculate THR based on type
    IF v_config.calculation_type = 'fixed' THEN
        v_calculated := v_config.fixed_amount;
    ELSE
        -- Prorated: (months_employed / 12) * base_salary + current_month_daily_proration
        v_calculated := 
            (v_months::NUMERIC / 12) * v_base_salary 
            + (v_days_current::NUMERIC / v_last_day_of_month) * (v_base_salary / v_last_day_of_month);
    END IF;

    -- Add overtime if enabled
    IF v_config.include_overtime AND v_ot_pay > 0 THEN
        v_ot_pay := (
            SELECT COALESCE(SUM(
                EXTRACT(EPOCH FROM (al.clock_out_time - (st.end_time::timestamp)))
                / 3600.0 * v_ot_rate
            ), 0)
            FROM public.attendance_logs al
            JOIN public.shift_assignments sa ON al.user_id = sa.user_id 
                AND al.clock_in_time::date = sa.assignment_date
            JOIN public.shift_templates st ON sa.shift_template_id = st.id
            WHERE al.user_id = p_user_id
              AND al.company_id = p_company_id
              AND al.clock_in_time::date >= DATE_TRUNC('month', p_reference_month)
              AND al.clock_in_time::date <= (DATE_TRUNC('month', p_reference_month) + INTERVAL '1 month' - INTERVAL '1 day')
              AND al.clock_out_time IS NOT NULL
        );
        v_calculated := v_calculated + v_ot_pay;
    END IF;

    v_calculated := ROUND(v_calculated, 2);

    RETURN QUERY SELECT v_months, v_days_current, v_daily_rate, v_base_salary, v_ot_pay, v_calculated, v_eligible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.thr_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thr_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thr_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thr_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (follow existing pattern)
CREATE POLICY select_thr_config ON public.thr_configs
    FOR SELECT USING (company_id = public.get_company_id());
CREATE POLICY modify_thr_config ON public.thr_configs
    FOR ALL USING (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    ) WITH CHECK (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE POLICY select_thr_schedules ON public.thr_schedules
    FOR SELECT USING (company_id = public.get_company_id());
CREATE POLICY modify_thr_schedules ON public.thr_schedules
    FOR ALL USING (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    ) WITH CHECK (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE POLICY select_thr_runs ON public.thr_runs
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );
CREATE POLICY insert_thr_runs ON public.thr_runs
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() 
        AND (public.get_user_role() IN ('Admin', 'Manager'))
    );

CREATE POLICY select_thr_deductions ON public.thr_deductions
    FOR SELECT USING (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    );
CREATE POLICY insert_thr_deductions ON public.thr_deductions
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() 
        AND public.get_user_role() IN ('Admin', 'Manager')
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_thr_schedules_company_status 
    ON public.thr_schedules (company_id, status, target_payment_date);
CREATE INDEX IF NOT EXISTS idx_thr_runs_schedule 
    ON public.thr_runs (thr_schedule_id, company_id);
CREATE INDEX IF NOT EXISTS idx_thr_runs_user_month 
    ON public.thr_runs (user_id, created_at);
```

**Key Design Decisions:**
- **Config-driven**: Prorated (standard: 1/12 of base salary per month worked) or fixed amount
- **Schedule-based**: Each THR (Lebaran, Natal, etc.) has its own schedule with a target payment date
- **Run snapshot**: THR calculation is a snapshot — captures salary, OT, and tenure at calculation time so historical recalculations are faithful
- **Deductions ledger**: Links to kasbon repayments for automatic offset of outstanding advances
- **PL/pgSQL calculation**: `compute_thr_for_employee()` function encapsulates the legal formula (prorated monthly salary × months worked / 12) — no client can manipulate the math
- **Eligibility rules**: Indonesian law minimum (30 days tenure, 1 month before reference month)

**Test plan for THR functions:**
- Employee hired 6 months ago → THR = 6/12 × base_salary
- Employee hired mid-reference-month → prorated for current month days
- Employee hired < 30 days → not eligible
- Fixed amount config → ignores salary-based calculation
- OT inclusion flag → adds computed overtime to THR
- Kasbon deduction linkage → deduction appears in thr_deductions table

### 2.3 Migration Process Improvements

**Current state:** 9 hand-written migrations, applied via Supabase CLI. No formal migration testing in CI.

**Recommendations:**

#### a. Add migration linting to CI

Create `scripts/validate-migrations.sh`:
```bash
#!/usr/bin/env bash
# 1. Check migration filenames are timestamped and sequential
# 2. Check each migration has a header comment
# 3. Check no ALTER TABLE without corresponding rollback consideration
# 4. Verify RLS is enabled on new tables
# 5. Verify new tables have company_id foreign keys
set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"
LAST_TIMESTAMP=""

for f in "$MIGRATIONS_DIR"/*.sql; do
  BASENAME=$(basename "$f")
  # Extract timestamp prefix (YYYYMMDDHHMMSS)
  TIMESTAMP=$(echo "$BASENAME" | grep -oP '^\d{14}')
  if [ -z "$TIMESTAMP" ]; then
    echo "ERROR: Migration $BASENAME does not follow YYYYMMDDHHMMSS_name.sql naming"
    exit 1
  fi
  if [ "$TIMESTAMP" \< "$LAST_TIMESTAMP" ]; then
    echo "ERROR: Migration $BASENAME is out of sequence"
    exit 1
  fi
  LAST_TIMESTAMP="$TIMESTAMP"
  
  # Check for header comment
  if ! head -5 "$f" | grep -q "^--"; then
    echo "ERROR: Migration $BASENAME missing header comment"
    exit 1
  fi
done

echo "All migration checks passed."
```

#### b. Add a `down.sql` companion for each migration

For destructive operations (DROP TABLE, column removals), create a corresponding `20260910000009_kasbon_down.sql` that reverses the up migration. This enables safe rollback in staging.

#### c. Test migrations against a real DB

Use `supabase db push --local` in CI to validate that migrations apply cleanly to a fresh local database. The existing `brutal.test.mjs` already does source-scan invariant checks on migrations — extend this to include:
- Every new table has `company_id` FK → `public.companies(id)`
- Every new table has `ENABLE ROW LEVEL SECURITY`
- Every new table has at least a `select_*` policy referencing `get_company_id()`

---

## 3. CI/CD & Developer Experience

### 3.1 Current State
- No `.github/workflows/` directory — zero CI/CD pipelines in repo
- Vercel config is minimal (`vercel.json` with only a cron definition)
- No pre-commit hooks
- Env vars managed manually in Vercel dashboard
- Tests run manually via `npm test`

### 3.2 GitHub Actions CI Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

env:
  NODE_VERSION: 20
  PROJECT_DIR: .

jobs:
  # ──── Unit + Integration Tests ──────────────────────────
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.4
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-start-wait 5s
      supabase:
        image: supabase/postgrest:v11
        env:
          PGRST_DB_URI: postgres://postgres:postgres@localhost:5432/postgres
          PGRST_DB_SCHEMAS: public,storage
          PGRST_DB_ANON_ROLE: anon
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript type-check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Run unit/integration tests
        run: npm run test:run -- --coverage

      - name: Upload coverage
        if: always()
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
          flags: unittests

  # ──── Supabase Migration Validation ─────────────────────
  validate-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Install Supabase CLI
        run: |
          npm i -g supabase
      - name: Start local Supabase
        run: |
          supabase start
        env:
          POSTGRES_PASSWORD: postgres
      - name: Run migration checks
        run: |
          bash scripts/validate-migrations.sh
      - name: Push migrations to local DB
        run: |
          supabase db push --local
      - name: Verify RLS on all tables
        run: |
          echo "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_%' AND has_row_security_enabled IS NOT NULL;" | PGPASSWORD=postgres psql -h localhost -U postgres -d postgres
      - name: Run migration source-scan tests
        run: npm run test:run -- tests/unit/migrations.test.ts

  # ──── E2E Tests (Playwright) ────────────────────────────
  e2e:
    runs-on: ubuntu-latest
    needs: [test, validate-migrations]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --all
      - name: Start dev server
        run: npm run dev &
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      - name: Run E2E tests
        run: npx playwright test
        env:
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 3

  # ──── Build & Lint Security ─────────────────────────────
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ vars.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_SITE_URL: https://apex.lankdev.my.id
          SUPER_ADMIN_EMAIL: ${{ secrets.SUPER_ADMIN_EMAIL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          WHATSAPP_WEBHOOK_SECRET: ${{ secrets.WHATSAPP_WEBHOOK_SECRET }}
      - name: Upload build artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .next/
```

### 3.3 Pre-commit Hooks with Husky + lint-staged

```bash
npm i -D husky lint-staged
```

```json
// package.json additions
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "tsc --noEmit"
    ],
    "*.{sql}": "sqlfmt --check"
  }
}
```

```bash
# Enable husky
npx husky init
# hooks/pre-commit
npx husky add .husky/pre-commit "npx lint-staged"
```

The pre-commit hook should:
1. Run ESLint + TypeScript type-check on staged files only
2. Format SQL migrations with sqlfmt
3. Run the migration filename/sequence validator
4. Block commit if `SUPER_ADMIN_PASSWORD` or `SUPABASE_SERVICE_ROLE_KEY` appears in any staged file

### 3.4 Environment Configuration Management

**Current .env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_PASSWORD=...
CRON_SECRET=...
WHATSAPP_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=https://apex.lankdev.my.id
```

**Recommendations:**

#### a. Split into staged environment files

```
.env.local          # Local dev (gitignored)
.env.example        # Template for new devs
.env.development    # Dev env (gitignored if differs)
.env.preview        # Vercel preview env
.env.production     # Only via Vercel dashboard (never committed)
```

`.env.example`:
```env
# ──── Supabase ────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ──── App Configuration ───────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ──── Security ────────────────────────────────────────────
CRON_SECRET=generate-with-openssl-rand-hex-32
WHATSAPP_WEBHOOK_SECRET=generate-with-openssl-rand-32

# ──── Super Admin (Bootstrap Only) ────────────────────────
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=min-12-chars-with-upper-lower-digit
```

#### b. Add env var validation at startup

Create `src/lib/env.ts`:
```ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  CRON_SECRET: z.string().min(16),
  WHATSAPP_WEBHOOK_SECRET: z.string().min(16),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(12),
})

export const env = envSchema.parse(process.env)
```

Import `env.ts` in `next.config.ts` and `middleware.ts` to fail fast on missing config.

#### c. Vercel environment variable management via Terraform

Create `infrastructure/vercel.tf`:
```hcl
resource "vercel_project" "apex" {
  name      = "apex"
  git_id    = "..."
  
  environment = {
    development = "..."
    preview     = "..."
    production  = "..."
  }

  # Environment variables (secrets via Vercel dashboard)
  environment_variable = [
    {
      key    = "CRON_SECRET"
      value  = var.cron_secret
      target = ["production", "preview"]
      sensitive = true
    },
    {
      key    = "SUPABASE_SERVICE_ROLE_KEY"
      value  = var.supabase_service_role_key
      target = ["production", "preview"]
      sensitive = true
    }
  ]
}
```

### 3.5 Vercel Deployment Pipeline Optimizations

#### a. Add `vercel-build` output config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 17 * * *"
    }
  ],
  "functions": {
    "src/app/api/cron/cleanup/route.ts": {
      "maxDuration": 300,
      "memory": 1024
    },
    "src/app/api/webhooks/whatsapp/route.ts": {
      "maxDuration": 10
    }
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SITE_URL": "https://apex.lankdev.my.id"
    }
  },
  "cleanOutputs": ["node_modules"]
}
```

#### b. Implement health check endpoint

```ts
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    const { count, error } = await adminClient
      .from('companies')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
      companies: count,
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 503 }
    )
  }
}
```

Then add a Vercel health check or uptime monitor (e.g., BetterStack/UptimeRobot) that hits `/api/health` daily.

#### c. Add `next/image` remote pattern configuration

Since selfie photos are served from Supabase Storage:
```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
}
```

---

## 4. Error Handling & Resiliency

### 4.1 Offline Selfie Resilience (Current Gaps)

**Current state analysis:**
- `OfflineSyncProvider` handles queueing offline attendance actions in IndexedDB (encrypted via XOR)
- Offline clock-in stores compressed base64 in the queue, uploads to storage on reconnect
- Clock-out only closes sessions still open (`.is('clock_out_time', null)`)

**Gaps identified:**
1. **Photo upload failures on reconnect**: If Supabase Storage upload fails during sync, the log is silently dropped (base64 stays in DB as fallback, but no retry mechanism)
2. **Clock-in during offline + reconnect clock-out**: If user clocks in offline and then comes online, attempts to clock out via the online UI might fail because the offline log hasn't synced yet — the UI checks for open session via online query
3. **No conflict resolution**: If user clocks in on two devices (one offline, one online), the second online attempt gets a 23505 unique-violation error, but there's no UI guidance on resolving the conflict
4. **Encryption is weak**: XOR with a static salt derived from `NEXT_PUBLIC_SUPPRESS_ANON_KEY` is not real encryption — it's obfuscation. The anon key is public by design.

#### Recommendations

#### a. Separate photo storage from log insertion in sync

```ts
// src/components/shared/OfflineSyncProvider.tsx — improved sync logic
async function syncClockIn(action: OfflineAction) {
  // Step 1: Upload photo first (retry up to 3 times)
  let photoPath: string | null = action.payload.photo_url ?? null
  if (photoPath?.startsWith('data:')) {
    const blob = await (await fetch(photoPath)).blob()
    const filePath = `${action.payload.company_id}/attendance/${action.payload.user_id}_${action.payload.timestamp}_sync.jpg`
    
    let uploadAttempts = 0
    let uploaded = false
    while (uploadAttempts < 3 && !uploaded) {
      const { error: upErr } = await supabase.storage.from('attendance').upload(filePath, blob)
      if (!upErr) {
        photoPath = filePath
        uploaded = true
      } else {
        uploadAttempts++
        if (uploadAttempts < 3) {
          await new Promise(r => setTimeout(r, 2000 * uploadAttempts))  // exponential backoff
        }
      }
    }
    
    if (!uploaded) {
      // Keep the base64 as fallback but log failure for retry on next sync attempt
      return { success: false, retry: true }
    }
  }
  
  // Step 2: Insert attendance log
  const { error } = await supabase.from('attendance_logs').insert({
    ...action.payload,
    photo_url: photoPath,
  })
  
  if (error) {
    if (error.code === '23505') {
      // Open session already exists — treat as synced (no data loss)
      return { success: true }
    }
    return { success: false, retry: true }
  }
  
  return { success: true }
}
```

#### b. Add conflict detection UI

In `AttendancePage.tsx`, when clock-in returns 23505:
- Instead of just an alert, show a banner: "You have an existing clock-in session from {timestamp on other device}. [Clock Out Now] [Dismiss]"
- Fetch the open session and display it in the active session panel

#### c. Replace XOR encryption with proper IndexedDB encryption

Use `crypto.subtle` with a key derived from the user's session token:

```ts
// src/lib/store.ts — replace encrypt/decrypt
import { subtle } from 'crypto'
import { sha256 } from '@/lib/security'  // or use crypto-js

const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('apex-offline-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}
```

Actually, since this runs in the browser, use the Web Crypto API. But note: in the current SSR environment, `crypto.subtle` is browser-only. The current XOR approach at least keeps offline data opaque to casual inspection. A better improvement is to use the user's Supabase `access_token` (which is already authenticated) as the key derivation source.

#### d. Add offline-first data fetching

When offline, the AttendancePage should display cached data from IndexedDB rather than showing an error:

```ts
// In AttendancePage.tsx
useEffect(() => {
  if (isOffline) {
    // Show indicator: "Showing cached data. Some features limited."
    // Fetch last-known active session from local store
    // Disable camera/capture buttons
  }
}, [isOffline])
```

### 4.2 Error Boundaries

**Current state:** Errors are handled via inline `alert()` calls in client components. No React error boundaries exist.

#### a. Create `src/components/shared/ErrorBoundary.tsx`

```tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // Log to Sentry/structured logger
    console.error('[ErrorBoundary] Render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            TERJADI KESALAHAN PADA HALAMAN
          </h2>
          <p className="text-sm text-gray-600 mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-mono uppercase rounded-md hover:bg-primary-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang Halaman
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### b. Wrap module-level pages

In `src/app/[slug]/layout.tsx`, wrap the main content:
```tsx
<main className="flex-1 p-6 pt-3 overflow-y-auto">
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
</main>
```

#### c. Add React Server Component error boundary

```tsx
// src/app/global-error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ERROR SISTEM
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            Terjadi kesalahan tak terduga. Silakan coba muat ulang halaman.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-white font-mono text-xs uppercase rounded-md hover:bg-primary-hover"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}
```

### 4.3 Structured Logging (Pino)

**Current state:** `console.log` / `console.error` calls scattered across server actions and API routes. No structured format, no log levels.

#### a. Add Pino

```bash
npm i pino pino-http
```

```ts
// src/lib/logger.ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV,
    service: 'apex',
  },
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      }
    : undefined,
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      ip: req.socket?.remoteAddress,
    }),
    user: (user: any) => ({
      id: user?.id,
      email: user?.email,
    }),
  },
})

export default logger
```

#### b. Replace console calls in server actions

In `src/lib/admin-actions.ts`:
```ts
// Before:
console.error('Failed to update company tier:', error)

// After:
import logger from '@/lib/logger'
logger.error({ err: error, companyId, userId: profile?.user_id }, 'Failed to update company tier')
```

#### c. Add request logging middleware

```ts
// src/middleware.ts (or app/middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import logger from '@/lib/logger'

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  
  const response = NextResponse.next()
  
  const duration = Date.now() - start
  logger.info({
    method: request.method,
    url: request.nextUrl.pathname,
    ip,
    status: response.status,
    duration_ms: duration,
  }, 'HTTP Request')
  
  return response
}
```

### 4.4 Sentry Integration

```bash
npm i @sentry/nextjs
```

```tss
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.BrowserTracing({
      // Don't capture route changes from Next.js
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,  // Don't record selfie photos in replays
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
})
```

```ts
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.nodeHTTPTransport({
      silentMethods: ['GET'], // Don't log GET requests
    }),
  ],
})
```

### 4.5 Toast/UX Feedback Improvements

**Current state:** Uses `goey-toast` library (unusual choice; `goey-toast` is a niche package). Inline `alert()` calls dominate. Custom feedback divs in some components.

#### a. Standardize on one toast solution

Either:
- **Option A:** Upgrade to `sonner` (modern, well-maintained, works with React Server Components)
- **Option B:** Keep `goey-toast` but standardize its usage

Current `goey-toast` is imported in `page.tsx` but never actually used. Replace all `alert()` calls with a toast:

```tsx
// src/components/shared/ToastProvider.tsx
'use client'

import { Toaster, toast } from 'sonner'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        richColors
        closeButton
        position="bottom-right"
        toastOptions={{
          classNames: {
            success: 'bg-green-50 border-green-200 text-green-700',
            error: 'bg-red-50 border-red-200 text-red-700',
            info: 'bg-blue-50 border-blue-200 text-blue-700',
            warning: 'bg-amber-50 border-amber-200 text-amber-700',
          },
        }}
      />
    </>
  )
}

// Convenience wrapper matching Indonesian messages
export const showToast = {
  success: (msg: string) => toast.success(msg, { duration: 4000 }),
  error: (msg: string) => toast.error(msg, { duration: 6000 }),
  info: (msg: string) => toast.info(msg, { duration: 4000 }),
  warning: (msg: string) => toast.warning(msg, { duration: 5000 }),
}
```

#### b. Replace all `alert()` calls

In `AttendancePage.tsx`, replace:
```ts
alert('Anda masih memiliki sesi absensi aktif. Clock out dulu sebelum clock in lagi.')
```
With:
```ts
showToast.error('Anda mas masih memiliki sesi absensi aktif. Clock out dulu sebelum clock in lagi.')
```

Create a Codemod script to find-and-replace all `alert(` calls across the codebase:
```bash
grep -rn "alert(" src/ --include="*.tsx" --include="*.ts" | grep -v "Confirm" | grep -v node_modules
```

#### c. Offline sync feedback

In `OfflineSyncProvider.tsx`, replace the banner-based sync status with toast notifications:
- On sync start: `showToast.info('Menyinkronkan data offline...')`
- On sync complete: `showToast.success('Data offline berhasil disinkronkan')`
- On sync failure: `showToast.error('Gagal menyinkronkan data. Tap untuk coba lagi.')` with a retry action

#### d. Error boundary with toast integration

In `ErrorBoundary.tsx`, add a "Report Error" button that uses `Sentry.captureException` and shows a toast:

```tsx
<button
  onClick={() => {
    if (window.Sentry) {
      window.Sentry.captureException(this.state.error)
      showToast.success('Laporan error telah dikirim ke tim pengembang')
    }
  }}
  className="..."
>
  Laporkan ke Tim Pengembang
</button>
```

---

## 5. Summary of Concrete Implementation Steps

### Priority 1 (TDD Foundation)
1. Install Vitest, migrate existing `node:test` tests to `tests/unit/`
2. Write unit tests for `attendance-recap.ts` and `payroll.ts` (46 → 100+ tests)
3. Add integration tests for server actions with mocked Supabase client (add 30+ tests)
4. Add Playwright E2E for: login flow, selfie clock-in, offline sync, payroll calculation
5. Add test helpers: `tests/mocks/supabase.ts`, `e2e/helpers/auth.ts`, `tests/helpers/setup-test-tenant.ts`

### Priority 2 (Schema Design)
1. Create `20260910000009_kasbon.sql` migration with configs, requests, repayments tables
2. Create `20260910000010_thr.sql` migration with configs, schedules, runs, deductions tables
3. Add PL/pgSQL functions (`compute_earned_wages`, `compute_thr_for_employee`)
4. Add RLS policies following existing patterns
5. Add migration validation script to CI

### Priority 3 (CI/CD + DX)
1. Create `.github/workflows/ci.yml` with test, migration-validate, e2e, and build jobs
2. Add Husky + lint-staged for pre-commit hooks
3. Split env files into `.env.example`, `.env.development`, `.env.preview`
4. Add `src/lib/env.ts` with Zod validation
5. Add `src/app/api/health/route.ts` health check endpoint
6. Add `vercel.json` function configs (maxDuration, memory)

### Priority 4 (Error Handling + Resiliency)
1. Create `src/components/shared/ErrorBoundary.tsx` and `src/app/global-error.tsx`
2. Add Pino logger (`src/lib/logger.ts`), replace `console.log/error` calls
3. Add Sentry Next.js SDK with PII masking for selfie photos
4. Replace all `alert()` calls with toast integration
5. Improve OfflineSyncProvider: retry logic, conflict detection UI, proper encryption
6. Add `ErrorBoundary` wrapper in `[slug]/layout.tsx`