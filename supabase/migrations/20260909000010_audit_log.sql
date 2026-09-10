-- Audit Log Migration
-- Creates tamper-evident audit trail for compliance and forensic analysis
-- Includes: audit_events table, RLS policies, modification prevention trigger,
--           tamper-evident chain linking

-- ============================================================
-- 1. Create audit_events table
--    Stores immutable audit trail of all data modifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,          -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  table_name    text NOT NULL,          -- 'users', 'companies', 'attendance_logs', etc.
  record_id     uuid NOT NULL,          -- ID of the affected record
  company_id    uuid,                   -- Company scope (nullable for system events)
  user_id       uuid,                   -- Who performed the action
  old_data      jsonb,                  -- Previous state (NULL for INSERT)
  new_data      jsonb,                  -- New state (NULL for DELETE)
  metadata      jsonb DEFAULT '{}',     -- Additional context (IP, user agent, etc.)
  chain_hash    text NOT NULL,          -- SHA-256 hash for tamper detection
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at
  ON public.audit_events (created_at DESC);

-- Index for company-scoped queries
CREATE INDEX IF NOT EXISTS idx_audit_events_company_id
  ON public.audit_events (company_id, created_at DESC);

-- Index for table-specific audit lookups
CREATE INDEX IF NOT EXISTS idx_audit_events_table_name
  ON public.audit_events (table_name, record_id);

-- ============================================================
-- 2. RLS policies for audit_events
--    Company members can read their own audit trail
--    System/admin can insert (via triggers)
-- ============================================================

-- Read: company members see their own company's audit events
DROP POLICY IF EXISTS "audit_events_read_company" ON public.audit_events;

CREATE POLICY "audit_events_read_company"
  ON public.audit_events
  FOR SELECT
  USING (company_id = get_company_id());

-- Insert: authenticated users can insert (triggers handle this)
DROP POLICY IF EXISTS "audit_events_insert_auth" ON public.audit_events;

CREATE POLICY "audit_events_insert_auth"
  ON public.audit_events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE allowed — audit trail is immutable

-- ============================================================
-- 3. Prevent direct modifications to audit_events
--    Trigger ensures no UPDATE or DELETE can bypass RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_audit_event_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are immutable. Direct UPDATE/DELETE is not permitted.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_event_update ON public.audit_events;
CREATE TRIGGER trg_prevent_audit_event_update
  BEFORE UPDATE ON public.audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_event_modification();

DROP TRIGGER IF EXISTS trg_prevent_audit_event_delete ON public.audit_events;
CREATE TRIGGER trg_prevent_audit_event_delete
  BEFORE DELETE ON public.audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_event_modification();

-- ============================================================
-- 4. Tamper-evident chain function
--    Each audit event includes a hash of the previous event,
--    creating a blockchain-like chain for integrity verification
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_audit_chain_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prev_hash text;
  payload   text;
BEGIN
  -- Get the hash of the most recent audit event for this company
  SELECT chain_hash INTO prev_hash
  FROM public.audit_events
  WHERE company_id = NEW.company_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no previous event, use a genesis hash
  IF prev_hash IS NULL THEN
    prev_hash = 'GENESIS';
  END IF;

  -- Build the payload to hash
  payload := json_build_object(
    'event_type', NEW.event_type,
    'table_name', NEW.table_name,
    'record_id', NEW.record_id,
    'company_id', NEW.company_id,
    'user_id', NEW.user_id,
    'old_data', NEW.old_data,
    'new_data', NEW.new_data,
    'prev_hash', prev_hash,
    'created_at', NEW.created_at::text
  )::text;

  -- Generate SHA-256 hash
  NEW.chain_hash = encode(digest(payload, 'sha256'), 'hex');

  RETURN NEW;
END;
$$;

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TRIGGER IF EXISTS trg_audit_chain_hash ON public.audit_events;
CREATE TRIGGER trg_audit_chain_hash
  BEFORE INSERT ON public.audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_audit_chain_hash();
