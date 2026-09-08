-- 20260708000001_rls_hardening.sql
-- Apex RLS Security Hardening Migration

-- 1. Helper function to retrieve the caller's current role_id
CREATE OR REPLACE FUNCTION public.get_user_role_id()
RETURNS UUID AS $$
  SELECT role_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Harden users update policy (modify_own_user)
-- Disallow employees from self-promoting by mutating role_id
DROP POLICY IF EXISTS modify_own_user ON public.users;
CREATE POLICY modify_own_user ON public.users
    FOR UPDATE
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid() AND role_id = public.get_user_role_id());

-- 3. Harden attendance logs update policy (update_attendance_log)
-- Enforce that updated logs cannot change user_id or company_id ownership
DROP POLICY IF EXISTS update_attendance_log ON public.attendance_logs;
CREATE POLICY update_attendance_log ON public.attendance_logs
    FOR UPDATE
    USING (
        company_id = public.get_company_id() AND
        user_id = public.get_user_id()
    )
    WITH CHECK (
        company_id = public.get_company_id() AND
        user_id = public.get_user_id()
    );

-- 4. Harden tasks update status policy (update_task_status)
-- Ensure assignees can only update their own assigned tasks without altering company/assignee
DROP POLICY IF EXISTS update_task_status ON public.tasks;
CREATE POLICY update_task_status ON public.tasks
    FOR UPDATE
    USING (
        company_id = public.get_company_id() AND
        assignee_id = public.get_user_id()
    )
    WITH CHECK (
        company_id = public.get_company_id() AND
        assignee_id = public.get_user_id()
    );

-- 5. Harden company update policy (update_company)
-- Tier lock: Block tenant admins from upgrading their tier via anon/authenticated client sessions.
-- Legit super-admin tier updates occur via server adminClient (service-role) which bypasses RLS.
-- Upgrade path: webhooks with HMAC or manual super-admin actions.
DROP POLICY IF EXISTS update_company ON public.companies;
CREATE POLICY update_company ON public.companies
    FOR UPDATE
    USING (id = public.get_company_id() AND public.get_user_role() = 'Admin')
    WITH CHECK (
        id = public.get_company_id() AND
        public.get_user_role() = 'Admin' AND
        tier = (SELECT c.tier FROM public.companies c WHERE c.id = public.companies.id)
    );

-- Trigger: prevent_tier_self_change as defense-in-depth against direct SQL updates
CREATE OR REPLACE FUNCTION public.prevent_tier_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tier IS DISTINCT FROM NEW.tier AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Tier modifications are restricted to super administrators.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_tier_self_change ON public.companies;
CREATE TRIGGER tr_prevent_tier_self_change
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tier_self_change();
