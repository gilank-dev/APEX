-- 20260910000013: Explicit table grants for anon/authenticated/service_role.
--
-- WHY: Tables created by the `postgres` role in fresh environments inherit a
-- default ACL that only gives anon/authenticated/service_role TRUNCATE /
-- REFERENCES / TRIGGER ("Dxtm") — NO SELECT/INSERT/UPDATE/DELETE. On hosted
-- Supabase this happens to be patched by platform-managed default privileges,
-- so production worked by accident. Local/self-hosted environments (and any
-- future re-provisioning) get a database where every client query fails with
-- "permission denied for table <x>". Migrations were not self-contained.
--
-- This makes the grant surface explicit and identical everywhere:
--   * anon / authenticated: arwd (data access; RLS still gates every row)
--   * service_role: full arwdDxt (bypasses RLS by design in Supabase)

-- Core tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure future tables created by postgres also get sane grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- RLS helper functions must be executable by anon/authenticated, otherwise
-- every policy that calls them fails at runtime.
DO $$
DECLARE
    fn RECORD;
BEGIN
    FOR fn IN
        SELECT p.oid, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prolang <> 12 -- exclude internal
          AND NOT EXISTS (
              SELECT 1 FROM aclexplode(p.proacl) a
              WHERE a.grantee IN ('anon'::regrole, 'authenticated'::regrole)
          )
    LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO anon, authenticated', fn.proname);
    END LOOP;
END $$;
