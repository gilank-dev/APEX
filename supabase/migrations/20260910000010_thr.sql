-- 20260910000010_thr.sql
-- THR (Tunjangan Hari Raya): hire date for prorate eligibility, fixed allowance
-- as part of the THR wage basis, and an auditable payment ledger.

-- 1. Hire date drives THR prorate (masa kerja < 12 bulan => proporsional)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hire_date DATE;

-- 2. Tunjangan tetap (fixed allowance) is part of the THR wage basis
ALTER TABLE public.employee_payroll_settings ADD COLUMN IF NOT EXISTS fixed_allowance NUMERIC(14,2) NOT NULL DEFAULT 0;

-- 3. Guard: employees must not rewrite their own hire_date (THR/leave fraud vector).
--    Admin/Manager sessions and service-role (auth.uid() IS NULL) may still set it.
CREATE OR REPLACE FUNCTION public.prevent_hire_date_tamper()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hire_date IS DISTINCT FROM OLD.hire_date
       AND auth.uid() IS NOT NULL
       AND COALESCE(public.get_user_role(), '') NOT IN ('Admin', 'Manager') THEN
        RAISE EXCEPTION 'Tanggal masuk hanya dapat diubah oleh Admin.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_users_hire_date_tamper_guard ON public.users;
CREATE TRIGGER tr_users_hire_date_tamper_guard
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_hire_date_tamper();

-- 4. THR payment ledger: one payment per employee per company per year
CREATE TABLE public.thr_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    holiday VARCHAR(100) NOT NULL,
    months_of_service NUMERIC(5,2) NOT NULL CHECK (months_of_service >= 0),
    thr_basis NUMERIC(14,2) NOT NULL CHECK (thr_basis >= 0),
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    prorated BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id, year)
);

ALTER TABLE public.thr_payments ENABLE ROW LEVEL SECURITY;

-- SELECT: employees see their own THR records; Admin/Manager see all in company
CREATE POLICY select_thr_payments ON public.thr_payments
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

-- Writes are Admin/Manager only (issuing + marking paid)
CREATE POLICY manage_thr_payments ON public.thr_payments
    FOR ALL USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    )
    WITH CHECK (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );
