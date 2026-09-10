-- Priority 1 RLS Fixes
-- Addresses: WITH CHECK gaps, missing INSERT policies, auth_id security gap
-- Strategy: Drop + recreate FOR ALL policies with WITH CHECK, add missing INSERT/UPDATE policies
--
-- Safety: Each policy is wrapped in IF EXISTS/IF NOT EXISTS checks.
--         All FOR ALL policies get both USING and WITH CHECK to prevent arbitrary inserts.

-- ============================================================
-- 1. attendance_logs — replace FOR ALL with WITH CHECK
--    Current: FOR ALL USING — no protection against arbitrary inserts
--    Fix: Recreate with WITH CHECK using same owner/member logic
-- ============================================================

DROP POLICY IF EXISTS "attendance_logs_own_company" ON public.attendance_logs;

CREATE POLICY "attendance_logs_own_company"
  ON public.attendance_logs
  FOR ALL
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

-- ============================================================
-- 2. tasks — replace FOR ALL with WITH CHECK
--    Current: FOR ALL USING — unprotected inserts
--    Fix: Recreate with WITH CHECK
-- ============================================================

DROP POLICY IF EXISTS "tasks_own_company" ON public.tasks;

CREATE POLICY "tasks_own_company"
  ON public.tasks
  FOR ALL
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

-- ============================================================
-- 3. shifts — replace FOR ALL with WITH CHECK
--    Current: FOR ALL USING — unprotected inserts
--    Fix: Recreate with WITH CHECK
-- ============================================================

DROP POLICY IF EXISTS "shifts_own_company" ON public.shifts;

CREATE POLICY "shifts_own_company"
  ON public.shifts
  FOR ALL
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

-- ============================================================
-- 4. companies — add INSERT policy (currently missing)
--    Only Owner and Super Admin can create companies
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'companies'
      AND policyname = 'companies_insert_owner_admin'
  ) THEN
    CREATE POLICY "companies_insert_owner_admin"
      ON public.companies
      FOR INSERT
      WITH CHECK (
        get_user_role() IN ('owner', 'super_admin')
      );
  END IF;
END
$$;

-- ============================================================
-- 5. companies — add DELETE policy (currently missing)
--    Only Owner can delete companies
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'companies'
      AND policyname = 'companies_delete_owner_only'
  ) THEN
    CREATE POLICY "companies_delete_owner_only"
      ON public.companies
      FOR DELETE
      USING (
        get_user_role() = 'owner'
      );
  END IF;
END
$$;

-- ============================================================
-- 6. inventory_assets — add INSERT policy (currently missing)
--    Company members can insert into their own company
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_assets'
      AND policyname = 'inventory_assets_insert_company'
  ) THEN
    CREATE POLICY "inventory_assets_insert_company"
      ON public.inventory_assets
      FOR INSERT
      WITH CHECK (company_id = get_company_id());
  END IF;
END
$$;

-- ============================================================
-- 7. kasbon_requests — add Admin-only UPDATE policy
--    Only Admin/Owner can approve/reject kasbon requests
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kasbon_requests'
      AND policyname = 'kasbon_requests_update_admin'
  ) THEN
    CREATE POLICY "kasbon_requests_update_admin"
      ON public.kasbon_requests
      FOR UPDATE
      USING (
        company_id = get_company_id()
        AND get_user_role() IN ('owner', 'super_admin', 'admin')
      )
      WITH CHECK (
        company_id = get_company_id()
        AND get_user_role() IN ('owner', 'super_admin', 'admin')
      );
  END IF;
END
$$;
