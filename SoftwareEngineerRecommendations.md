# Software Engineering Recommendations for APEX

## 1. TDD Strategy Expansion

### 1.1 Unit Testing with Vitest
Replace the current Node.js test runner with Vitest for better TypeScript support and faster execution:

```bash
# Install dependencies
npm i -D vitest @vitest/ui @vitest/coverage-v8 happy-dom

# Update package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

Create `vitest.config.ts`:
```typescript
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

### 1.2 Test Business Logic
Focus on critical pure functions:

**src/lib/attendance-recap.ts** - `computeMonthlyAttendanceRecap`:
- Test late-minute calculation at exactly 10-minute boundary (should NOT be late)
- Test late-minute at 11 minutes (should be late)
- Test overnight shift OT calculation crossing midnight
- Test absent-days: assigned shift with no log
- Test duplicate logs on same date (multiple clock-ins)
- Test employee with no assignments (no absent days counted)
- Test Indonesian locale date formatting for month display

**src/lib/payroll.ts** - `computeMonthlyPayroll`:
- Test zero OT hours → otPay = 0
- Test OT rounding: `Math.round` behavior at 0.5 boundaries
- Test inactive employee (active=false) still appears in output
- Test missing payroll settings → baseSalary defaults to 0
- Test Indonesian Rupiah formatting (`formatRupiah`) for large numbers
- Test CSV export output format (BOM, semicolon delimiter)

### 1.3 Integration Tests for Server Actions
Create Supabase client mocks in `tests/mocks/supabase.ts`:
```typescript
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

### 1.4 E2E Testing with Playwright
```bash
npm i -D @playwright/test
npx playwright install
```

Create `playwright.config.ts`:
```typescript
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

Key E2E scenarios:
- Selfie Attendance Flow (login, photo capture, clock-in/out)
- Offline Selfie Resilience (queue sync, conflict detection)
- Payroll Flow (settings modification, calculation verification)
- Leave Request Flow (approval workflow, race condition handling)
- Auth & Tenancy Isolation (cross-tenant access prevention)

## 2. Database Schema Design for Kasbon/THR

### 2.1 Kasbon (Earned Wage Access) Schema
Create migration `20260910000009_kasbon.sql`:

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
-- [Function implementation as previously defined]
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.kasbon_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasbon_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasbon_repayments ENABLE ROW LEVEL SECURITY;

-- [RLS Policies as previously defined]

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

### 2.2 THR (Tunjangan Hari Raya) Schema
Create migration `20260910000010_thr.sql`:

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
-- [Function implementation as previously defined]
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.thr_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thr_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thr_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thr_deductions ENABLE ROW LEVEL SECURITY;

-- [RLS Policies as previously defined]

-- Indexes
CREATE INDEX IF NOT EXISTS idx_thr_schedules_company_status 
    ON public.thr_schedules (company_id, status, target_payment_date);
CREATE INDEX IF NOT EXISTS idx_thr_runs_schedule 
    ON public.thr_runs (thr_schedule_id, company_id);
CREATE INDEX IF NOT EXISTS idx_thr_runs_user_month 
    ON public.thr_runs (user_id, created_at);
```

## 3. CI/CD Pipeline Implementation

### 3.1 GitHub Actions Workflow
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
  # Unit + Integration Tests
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
          PGRST_DB_URI: postgres://postgres:***@localhost:5432/postgres
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

  # Supabase Migration Validation
  validate-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Install Supabase CLI
        run: npm i -g supabase
      - name: Start local Supabase
        run: supabase start
        env:
          POSTGRES_PASSWORD: postgres
      - name: Run migration checks
        run: bash scripts/validate-migrations.sh
      - name: Push migrations to local DB
        run: supabase db push --local
      - name: Verify RLS on all tables
        run: echo "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_%' AND has_row_security_enabled IS NOT NULL;" | PGPASSWORD=postgres psql -h localhost -U postgres -d postgres
      - name: Run migration source-scan tests
        run: npm run test:run -- tests/unit/migrations.test.ts

  # E2E Tests (Playwright)
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

  # Build & Lint Security
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

### 3.2 Pre-commit Hooks
```bash
npm i -D husky lint-staged
```

Add to package.json:
```json
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

Setup hooks:
```bash
npx husky init
npx husky add .husky/pre-commit "npx lint-staged"
```

### 3.3 Environment Configuration
Create `.env.example`:
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

Create `src/lib/env.ts`:
```typescript
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

Add health check endpoint `src/app/api/health/route.ts`:
```typescript
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

## 4. Error Handling & Resiliency Improvements

### 4.1 Offline Selfie Resilience Enhancements
Update `OfflineSyncProvider.tsx` with improved sync logic:
```typescript
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

Add conflict detection UI in `AttendancePage.tsx`:
```typescript
// When clock-in returns 23505:
showToast.info('Anda masih memiliki sesi absensi aktif dari perangkat lain. [Clock Out Sekarang] [ABAikan]')
```

### 4.2 Error Boundaries
Create `src/components/shared/ErrorBoundary.tsx`:
```typescript
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

Wrap in `src/app/[slug]/layout.tsx`:
```typescript
<main className="flex-1 p-6 pt-3 overflow-y-auto">
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
</main>
```

### 4.3 Structured Logging with Pino
```bash
npm i pino pino-http
```

Create `src/lib/logger.ts`:
```typescript
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

Replace console calls in server actions:
```typescript
// Before:
console.error('Failed to update company tier:', error)

// After:
import logger from '@/lib/logger'
logger.error({ err: error, companyId, userId: profile?.user_id }, 'Failed to update company tier')
```

### 4.4 Toast/UX Feedback Improvements
```bash
npm i sonner
```

Create `src/components/shared/ToastProvider.tsx`:
```typescript
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

Replace all `alert()` calls:
```typescript
// In AttendancePage.tsx, replace:
alert('Anda masih memiliki sesi absensi aktif. Clock out dulu sebelum clock in lagi.')
// With:
showToast.error('Anda masih memiliki sesi absensi aktif. Clock out dulu sebelum clock in lagi.')
```

### 4.5 Sentry Integration
```bash
npm i @sentry/nextjs
```

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.BrowserTracing({
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

## Implementation Priority

### Priority 1: TDD Foundation
1. Install Vitest and migrate existing tests
2. Write unit tests for attendance-recap.ts and payroll.ts
3. Add integration tests for server actions with mocked Supabase client
4. Add Playwright E2E for critical user journeys
5. Create test helpers for Supabase mocking and test tenant setup

### Priority 2: Schema Design
1. Create Kasbon migration with configs, requests, repayments tables
2. Create THR migration with configs, schedules, runs, deductions tables
3. Add PL/pgSQL functions for earned wage and THR calculations
4. Implement RLS policies following existing patterns
5. Add migration validation to CI pipeline

### Priority 3: CI/CD + Developer Experience
1. Create GitHub Actions CI workflow with test, migration-validation, e2e, and build jobs
2. Add Husky + lint-staged for pre-commit hooks
3. Implement environment validation with Zod
4. Add health check endpoint and Vercel optimizations

### Priority 4: Error Handling + Resiliency
1. Create ErrorBoundary components and wrap application
2. Add Pino logger and replace console.log/error calls
3. Integrate Sentry with PII masking for selfie photos
4. Replace alert() calls with sonner toast notifications
5. Enhance OfflineSyncProvider with retry logic and conflict detection