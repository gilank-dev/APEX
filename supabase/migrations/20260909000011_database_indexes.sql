-- Database Indexes Migration
-- Adds strategic indexes for frequently queried and filtered columns
-- Each index is conditional (IF NOT EXISTS) for safe re-runs

-- ============================================================
-- 1. kasbon_requests — status filtering + company scoping
--    Current: No indexes on status or company_id
--    Query pattern: WHERE company_id = X AND status = 'pending'
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_kasbon_requests_company_status
  ON public.kasbon_requests (company_id, status);

-- ============================================================
-- 2. kasbon_requests — user lookups
--    Query pattern: WHERE user_id = X ORDER BY created_at DESC
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_kasbon_requests_user_id
  ON public.kasbon_requests (user_id, created_at DESC);

-- ============================================================
-- 3. thr_runs — company scoping + year filtering
--    Query pattern: WHERE company_id = X AND year = Y
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_thr_runs_company_year
  ON public.thr_runs (company_id, year);

-- ============================================================
-- 4. thr_runs — status filtering
--    Query pattern: WHERE status = 'draft' OR status = 'finalized'
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_thr_runs_status
  ON public.thr_runs (status);

-- ============================================================
-- 5. audit_events — time-range queries (already created in audit migration)
--    Included here as reference; actual CREATE INDEX is in 000010
--    This migration only adds indexes NOT covered by other migrations
-- ============================================================

-- (audit_events indexes are in 20260909000010_audit_log.sql)

-- ============================================================
-- 6. attendance_logs — date range filtering
--    Query pattern: WHERE company_id = X AND date BETWEEN Y AND Z
--    Note: Only if date column exists and is not already indexed
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_logs'
      AND column_name = 'date'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'attendance_logs'
      AND indexname = 'idx_attendance_logs_company_date'
  ) THEN
    CREATE INDEX idx_attendance_logs_company_date
      ON public.attendance_logs (company_id, date DESC);
  END IF;
END
$$;

-- ============================================================
-- 7. inventory_assets — category filtering
--    Query pattern: WHERE company_id = X AND category = Y
--    Note: Only if category column exists
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_assets'
      AND column_name = 'category'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'inventory_assets'
      AND indexname = 'idx_inventory_assets_company_category'
  ) THEN
    CREATE INDEX idx_inventory_assets_company_category
      ON public.inventory_assets (company_id, category);
  END IF;
END
$$;

-- ============================================================
-- 8. shifts — date range filtering
--    Query pattern: WHERE company_id = X AND shift_date BETWEEN Y AND Z
--    Note: Only if shift_date column exists
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shifts'
      AND column_name = 'shift_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'shifts'
      AND indexname = 'idx_shifts_company_date'
  ) THEN
    CREATE INDEX idx_shifts_company_date
      ON public.shifts (company_id, shift_date DESC);
  END IF;
END
$$;

-- ============================================================
-- 9. payroll_runs — company + period filtering
--    Query pattern: WHERE company_id = X AND pay_period = Y
--    Note: Only if pay_period column exists
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payroll_runs'
      AND column_name = 'pay_period'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'payroll_runs'
      AND indexname = 'idx_payroll_runs_company_period'
  ) THEN
    CREATE INDEX idx_payroll_runs_company_period
      ON public.payroll_runs (company_id, pay_period DESC);
  END IF;
END
$$;
