-- Migration 20260910000003_audit_events_reconciliation.sql
-- §2.3 Tamper-Evident Log Chaining
-- Adds `previous_hash` column to `audit_events` and creates a trigger function
-- that automatically chains hashes when new rows are inserted.

-- 1. Add `previous_hash` column (nullable for historical rows)
ALTER TABLE public.audit_events
  ADD COLUMN IF NOT EXISTS previous_hash text;

-- 2. Create trigger function: auto-populate `previous_hash` and `chain_hash`
CREATE OR REPLACE FUNCTION public.set_audit_previous_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_previous_hash text;
  v_chain_input text;
BEGIN
  -- Fetch the most recent chain_hash for the same company (or global if null)
  SELECT chain_hash INTO v_previous_hash
  FROM public.audit_events
  WHERE (NEW.company_id IS NULL AND company_id IS NULL)
     OR company_id = NEW.company_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no previous hash exists, use genesis sentinel
  IF v_previous_hash IS NULL THEN
    v_previous_hash := 'GENESIS';
  END IF;

  -- Chain input: previous_hash + event_type + table_name + record_id + new_data
  v_chain_input := v_previous_hash
    || '|' || COALESCE(NEW.event_type, '')
    || '|' || COALESCE(NEW.table_name, '')
    || '|' || COALESCE(NEW.record_id::text, '')
    || '|' || COALESCE(NEW.new_data::text, '');

  -- Set the columns
  NEW.previous_hash := v_previous_hash;
  NEW.chain_hash    := encode(digest(v_chain_input, 'sha256'), 'hex');

  RETURN NEW;
END;
$function$;

-- 3. Attach trigger to `audit_events`
DROP TRIGGER IF EXISTS trg_set_audit_previous_hash ON public.audit_events;
CREATE TRIGGER trg_set_audit_previous_hash
  BEFORE INSERT ON public.audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_audit_previous_hash();

-- 4. Ensure pgcrypto extension is available (for digest())
CREATE EXTENSION IF NOT EXISTS pgcrypto;
