-- 20260910000013_function_hardening.sql
-- Security hardening from `supabase db advisors` security audit (2026-09-10):
--   1. function_search_path_mutable — 9 SECURITY DEFINER functions had no
--      pinned search_path (search_path hijack risk).
--   2. anon_security_definer_function_executable — helper/tamper-guard
--      functions were RPC-callable by the anon role via PostgREST.
--
-- Remediation follows the official Supabase pattern (docs: RLS / security
-- definer functions): revoke EXECUTE from PUBLIC and anon, keep an explicit
-- grant for authenticated because RLS policies evaluate these helpers under
-- the calling user's role (removing authenticated's grant would break every
-- policy). Bodies are NOT redefined — only ALTER FUNCTION ... SET and
-- GRANT/REVOKE — so trigger logic verified in prod on 2026-09-10 stays
-- byte-for-byte identical.

-- 1) Pin search_path on every SECURITY DEFINER helper/trigger function.
ALTER FUNCTION public.get_user_id() SET search_path = '';
ALTER FUNCTION public.get_company_id() SET search_path = '';
ALTER FUNCTION public.get_user_role() SET search_path = '';
ALTER FUNCTION public.get_user_role_id() SET search_path = '';
ALTER FUNCTION public.prevent_attendance_tamper() SET search_path = '';
ALTER FUNCTION public.prevent_tier_self_change() SET search_path = '';
ALTER FUNCTION public.prevent_hire_date_tamper() SET search_path = '';
ALTER FUNCTION public.prevent_photo_integrity_tamper() SET search_path = '';
ALTER FUNCTION public.enforce_kasbon_repayment_integrity() SET search_path = '';

-- 2) Close the anon RPC surface, keep authenticated working for RLS.
REVOKE EXECUTE ON FUNCTION public.get_user_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_attendance_tamper() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_tier_self_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_hire_date_tamper() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_photo_integrity_tamper() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_kasbon_repayment_integrity() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_attendance_tamper() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_tier_self_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_hire_date_tamper() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_photo_integrity_tamper() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_kasbon_repayment_integrity() TO authenticated;
