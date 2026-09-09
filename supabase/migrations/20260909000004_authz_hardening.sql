-- 20260909000004_authz_hardening.sql
-- Role-permission audit fixes

-- 1. CRITICAL: anon users could enumerate all tenants' roles (incl. invite_code).
--    The anon clause was never needed: register/join flows use the service-role client.
DROP POLICY IF EXISTS select_roles ON public.roles;
CREATE POLICY select_roles ON public.roles
    FOR SELECT USING (company_id = public.get_company_id());

-- 2. CRITICAL: modify_own_user pinned role_id but not company_id — an employee
--    could move their own profile into another tenant, hijacking get_company_id().
--    Pin both company_id and role_id in USING and WITH CHECK.
DROP POLICY IF EXISTS modify_own_user ON public.users;
CREATE POLICY modify_own_user ON public.users
    FOR UPDATE
    USING (
        auth_id = auth.uid()
        AND company_id = public.get_company_id()
        AND role_id = public.get_user_role_id()
    )
    WITH CHECK (
        auth_id = auth.uid()
        AND company_id = public.get_company_id()
        AND role_id = public.get_user_role_id()
    );

-- 3. Defense-in-depth: users cannot INSERT/DELETE their own or any profile row
--    via the anon/authenticated API (only service role / RLS policies allow).
CREATE POLICY users_no_client_insert ON public.users
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY users_no_client_delete ON public.users
    FOR DELETE
    USING (false);
