-- RLS Audit Function Migration
-- Creates a database function that audits RLS coverage across all tables
-- Returns a report of tables with/without RLS enabled and policy counts

-- ============================================================
-- 1. audit_rls_coverage() function
--    Returns JSON report of RLS status for all tables in public schema
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_rls_coverage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  table_record record;
  policy_count bigint;
  tables_without_rls jsonb := '[]'::jsonb;
  tables_with_rls jsonb := '[]'::jsonb;
  total_tables bigint;
  rls_enabled_count bigint;
BEGIN
  -- Count totals
  SELECT count(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  SELECT count(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true;

  -- Build detailed report per table
  FOR table_record IN
    SELECT
      t.tablename,
      t.rowsecurity AS rls_enabled,
      t.forcerowsecurity AS force_rls
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename
  LOOP
    -- Count policies for this table
    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_record.tablename;

    IF table_record.rls_enabled THEN
      tables_with_rls := tables_with_rls || jsonb_build_object(
        'table', table_record.tablename,
        'rls_enabled', true,
        'force_rls', table_record.force_rls,
        'policy_count', policy_count
      );
    ELSE
      tables_without_rls := tables_without_rls || jsonb_build_object(
        'table', table_record.tablename,
        'rls_enabled', false,
        'force_rls', false,
        'policy_count', policy_count
      );
    END IF;
  END LOOP;

  -- Build final report
  result := jsonb_build_object(
    'summary', jsonb_build_object(
      'total_tables', total_tables,
      'rls_enabled', rls_enabled_count,
      'rls_disabled', total_tables - rls_enabled_count,
      'coverage_pct', CASE
        WHEN total_tables > 0
        THEN round((rls_enabled_count::numeric / total_tables) * 100, 1)
        ELSE 0
      END
    ),
    'tables_with_rls', tables_with_rls,
    'tables_without_rls', tables_without_rls
  );

  RETURN result;
END;
$$;

-- ============================================================
-- 2. Grant execute permission to authenticated users
-- ============================================================

GRANT EXECUTE ON FUNCTION public.audit_rls_coverage() TO authenticated;

-- ============================================================
-- 3. Example usage:
--    SELECT public.audit_rls_coverage();
--
--    Returns:
--    {
--      "summary": {
--        "total_tables": 15,
--        "rls_enabled": 12,
--        "rls_disabled": 3,
--        "coverage_pct": 80.0
--      },
--      "tables_with_rls": [...],
--      "tables_without_rls": [...]
--    }
-- ============================================================
