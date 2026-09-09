-- 20260909000008_attendance_immutable.sql
-- Attendance log integrity: core fields immutable, clock_out append-only.

CREATE OR REPLACE FUNCTION public.prevent_attendance_tamper()
RETURNS TRIGGER AS $$
BEGIN
  -- Core identity/timing fields can never be rewritten.
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.clock_in_time IS DISTINCT FROM OLD.clock_in_time THEN
    RAISE EXCEPTION 'Data inti absensi tidak dapat diubah.';
  END IF;

  -- clock_out_time is append-only: set once (NULL -> value), never rewritten.
  IF OLD.clock_out_time IS NOT NULL AND NEW.clock_out_time IS DISTINCT FROM OLD.clock_out_time THEN
    RAISE EXCEPTION 'Jam clock-out sudah tercatat dan tidak dapat diubah.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_attendance_tamper_guard ON public.attendance_logs;
CREATE TRIGGER tr_attendance_tamper_guard
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_attendance_tamper();
