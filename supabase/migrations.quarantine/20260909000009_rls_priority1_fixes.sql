-- Priority 1: RLS policy fixes
-- Drop/recreate approach for policies missing WITH CHECK clauses
-- All new policies use DROP IF EXISTS + CREATE to be idempotent

-- ============================================================
-- 1. COMPANIES: Add INSERT policy (was missing entirely)
-- ============================================================
DROP POLICY IF EXISTS companies_insert_admin ON public.companies;
CREATE POLICY companies_insert_admin ON public.companies
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT u.auth_id FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE r.name IN ('Super Admin', 'Admin')
    )
  );

-- ============================================================
-- 2. COMPANIES: Add DELETE policy (was missing entirely)
-- ============================================================
DROP POLICY IF EXISTS companies_delete_admin ON public.companies;
CREATE POLICY companies_delete_admin ON public.companies
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT u.auth_id FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE r.name IN ('Super Admin', 'Admin')
    )
  );

-- ============================================================
-- 3. SHIFTS TEMPLATES: Drop old policy, recreate with WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS shift_templates_modify_admin ON public.shift_templates;
CREATE POLICY shift_templates_modify_admin ON public.shift_templates
  FOR ALL
  USING (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Manager')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Manager')
  );

-- ============================================================
-- 4. SHIFT ASSIGNMENTS: Drop old policy, recreate with WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS shift_assignments_modify_admin ON public.shift_assignments;
CREATE POLICY shift_assignments_modify_admin ON public.shift_assignments
  FOR ALL
  USING (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Manager')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Manager')
  );

-- ============================================================
-- 5. KASBON REQUESTS: Add UPDATE policy (Admin/Owner only)
-- ============================================================
DROP POLICY IF EXISTS kasbon_requests_update_admin ON public.kasbon_requests;
CREATE POLICY kasbon_requests_update_admin ON public.kasbon_requests
  FOR UPDATE
  USING (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Owner')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Owner')
  );

-- ============================================================
-- 6. INVENTORY ASSETS: Add INSERT policy (was missing)
-- ============================================================
DROP POLICY IF EXISTS inventory_assets_insert_company ON public.inventory_assets;
CREATE POLICY inventory_assets_insert_company ON public.inventory_assets
  FOR INSERT
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.get_user_role() IN ('Super Admin', 'Admin', 'Manager')
  );
