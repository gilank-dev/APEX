-- 20260910000012: Employee activation state for admin management.
-- Adds is_active to public.users so admins can deactivate/reactivate
-- members without deleting them (headcount quota counts ACTIVE members only).
-- Backfill existing rows as active.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Help the admin user list filter/sort
CREATE INDEX IF NOT EXISTS idx_users_company_active
    ON public.users (company_id, is_active);

-- Headcount quota should count only ACTIVE members. The invite flow checks
-- quota via service role, so no SQL function change is needed; but keep the
-- count helper accurate for any RLS-scoped read:
CREATE OR REPLACE FUNCTION public.count_active_members(p_company_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.users
    WHERE company_id = p_company_id
      AND is_active = TRUE;
$$;

-- Revoke direct execution from anon
REVOKE ALL ON FUNCTION public.count_active_members(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_active_members(UUID) FROM anon, authenticated;
