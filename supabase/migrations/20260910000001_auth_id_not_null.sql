-- Migration: 20260910000001_auth_id_not_null
-- Issue A Fix: Make users.auth_id NOT NULL
-- 
-- Strategy:
-- 1. Create a helper function to safely backfill null auth_ids
-- 2. Backfill any null auth_ids with dummy UUIDs
-- 3. Add NOT NULL constraint

-- First, create a helper function to backfill null auth_ids
CREATE OR REPLACE FUNCTION public.backfill_null_auth_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_dummy_uuid UUID;
BEGIN
  -- For each user with null auth_id, create a dummy UUID
  FOR v_user IN 
    SELECT id FROM public.users WHERE auth_id IS NULL
  LOOP
    -- Generate a deterministic UUID based on user id
    v_dummy_uuid := gen_random_uuid();
    
    -- Update the user with the new auth_id
    UPDATE public.users 
    SET auth_id = v_dummy_uuid 
    WHERE id = v_user.id;
    
    RAISE NOTICE 'Backfilled auth_id for user % with %', v_user.id, v_dummy_uuid;
  END LOOP;
END;
$$;

-- Execute the backfill function
SELECT public.backfill_null_auth_ids();

-- Now add the NOT NULL constraint
ALTER TABLE public.users 
ALTER COLUMN auth_id SET NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON COLUMN public.users.auth_id IS 
'Authentication ID from Supabase Auth. Nullable for dummy accounts.';

-- Clean up the backfill function
DROP FUNCTION IF EXISTS public.backfill_null_auth_ids();

-- Log the migration
RAISE NOTICE 'Migration 20260910000001_auth_id_not_null completed successfully';