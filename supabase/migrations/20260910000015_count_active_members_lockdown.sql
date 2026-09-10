-- 20260910000015_count_active_members_lockdown.sql
-- Post-audit follow-up: `supabase db advisors` (after 20260910000013/14) still
-- flags public.count_active_members as anon-executable. Migration
-- 20260910000014's auto-grant loop re-exposed it after migration
-- 20260910000012 had revoked PUBLIC access. This function is a headcount
-- helper; anon has no business calling it. Keep authenticated (used by
-- RLS-scoped reads per migration 12), close anon only.

REVOKE EXECUTE ON FUNCTION public.count_active_members(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_active_members(UUID) TO authenticated;
