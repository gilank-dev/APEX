-- 20260910000011_selfie_integrity.sql
-- Client-side SHA-256 selfie integrity: store the hash + salt captured at
-- clock-in alongside the log. Append-only like clock_out_time (tamper guard
-- already covers core fields; these columns are set once at insert).

ALTER TABLE public.attendance_logs
    ADD COLUMN IF NOT EXISTS photo_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS photo_salt VARCHAR(64);

-- photos are verified by re-deriving SHA-256(salt || bytes); the stored pair
-- must never be rewritten after insert.
CREATE OR REPLACE FUNCTION public.prevent_photo_integrity_tamper()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.photo_hash IS NOT NULL AND NEW.photo_hash IS DISTINCT FROM OLD.photo_hash THEN
    RAISE EXCEPTION 'Hash selfie tidak dapat diubah setelah absensi tercatat.';
  END IF;
  IF OLD.photo_salt IS NOT NULL AND NEW.photo_salt IS DISTINCT FROM OLD.photo_salt THEN
    RAISE EXCEPTION 'Salt selfie tidak dapat diubah setelah absensi tercatat.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_photo_integrity_guard ON public.attendance_logs;
CREATE TRIGGER tr_photo_integrity_guard
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_photo_integrity_tamper();
