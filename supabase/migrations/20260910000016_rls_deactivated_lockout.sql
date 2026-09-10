-- 20260910000015: Deactivated employees are locked out at the RLS layer.
--
-- WHY: The app-level gate (layout sign-out) is the only thing that stopped a
-- deactivated employee with a live session from reading tenant data. RLS
-- itself did not care about is_active. If any page forgets the check, or a
-- bug re-introduces a client-side read, a deactivated user could still see
-- company data until their session expired.
--
-- Fix: the tenancy helpers every policy relies on (get_company_id,
-- get_user_id, get_user_role, get_user_role_id) now return NULL/empty for
-- deactivated rows. Every `company_id = get_company_id()` comparison then
-- fails, locking the user out of every table at the database level.
--
-- NOTE: CREATE OR REPLACE FUNCTION drops proconfig (search_path), so the
-- migration 13 hardening (search_path = '', EXECUTE revoked from PUBLIC/anon)
-- is re-applied after each replace.

CREATE OR REPLACE FUNCTION public.get_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users
  WHERE auth_id = auth.uid()
    AND (is_active = TRUE OR is_active IS NULL)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users
  WHERE auth_id = auth.uid()
    AND (is_active = TRUE OR is_active IS NULL)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
  SELECT r.name FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_id = auth.uid()
    AND (u.is_active = TRUE OR u.is_active IS NULL)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role_id()
RETURNS UUID AS $$
  SELECT role_id FROM public.users
  WHERE auth_id = auth.uid()
    AND (is_active = TRUE OR is_active IS NULL)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Re-apply function hardening (reset by CREATE OR REPLACE)
ALTER FUNCTION public.get_company_id() SET search_path = '';
ALTER FUNCTION public.get_user_id() SET search_path = '';
ALTER FUNCTION public.get_user_role() SET search_path = '';
ALTER FUNCTION public.get_user_role_id() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role_id() FROM PUBLIC, anon;
