-- 20260910000009_kasbon.sql
-- Earned Wage Access (kasbon): salary advance requests with approval,
-- installment repayment schedule, and a DB-enforced repayment cap.

-- 1. KASBON REQUESTS
CREATE TABLE public.kasbon_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    reason TEXT,
    installment_count INTEGER NOT NULL DEFAULT 1 CHECK (installment_count BETWEEN 1 AND 12),
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fully_repaid')),
    decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kasbon_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: employees see their own kasbon; Admin/Manager see all in company
CREATE POLICY select_kasbon_requests ON public.kasbon_requests
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

-- INSERT: employees submit their OWN pending request only
CREATE POLICY insert_own_kasbon_request ON public.kasbon_requests
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() AND
        user_id = public.get_user_id() AND
        status = 'pending' AND decided_by IS NULL
    );

-- UPDATE: only Admin/Manager decide and mark repayment status
CREATE POLICY decide_kasbon_request ON public.kasbon_requests
    FOR UPDATE USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    )
    WITH CHECK (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE INDEX idx_kasbon_requests_company_user ON public.kasbon_requests(company_id, user_id);

-- 2. REPAYMENT SCHEDULE (installment rows created by an admin action on approval;
--    payment marking happens via payroll deduction or manual admin action)
CREATE TABLE public.kasbon_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kasbon_id UUID NOT NULL REFERENCES public.kasbon_requests(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    paid_at TIMESTAMPTZ,
    payroll_month VARCHAR(7) CHECK (payroll_month IS NULL OR payroll_month ~ '^[0-9]{4}-[0-9]{2}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kasbon_repayments ENABLE ROW LEVEL SECURITY;

-- SELECT: employees see their own repayment schedule; Admin/Manager see all
CREATE POLICY select_kasbon_repayments ON public.kasbon_repayments
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

-- ALL writes on repayments are Admin/Manager only (schedule + payment recording)
CREATE POLICY manage_kasbon_repayments ON public.kasbon_repayments
    FOR ALL USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    )
    WITH CHECK (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE INDEX idx_kasbon_repayments_kasbon ON public.kasbon_repayments(kasbon_id);

-- 3. MONEY INVARIANT (DB-enforced): repayments must stay consistent with the
--    parent kasbon (same company + user) and can never exceed the approved amount.
CREATE OR REPLACE FUNCTION public.enforce_kasbon_repayment_integrity()
RETURNS TRIGGER AS $$
DECLARE
    k_company UUID;
    k_user UUID;
    k_amount NUMERIC(14,2);
    existing_total NUMERIC(14,2);
BEGIN
    SELECT company_id, user_id, amount
      INTO k_company, k_user, k_amount
      FROM public.kasbon_requests
     WHERE id = NEW.kasbon_id;

    IF k_company IS NULL THEN
        RAISE EXCEPTION 'Kasbon induk tidak ditemukan.';
    END IF;

    IF NEW.company_id <> k_company OR NEW.user_id <> k_user THEN
        RAISE EXCEPTION 'Data cicilan tidak cocok dengan kasbon induk.';
    END IF;

    SELECT COALESCE(SUM(amount), 0)
      INTO existing_total
      FROM public.kasbon_repayments
     WHERE kasbon_id = NEW.kasbon_id AND id <> NEW.id;

    IF existing_total + NEW.amount > k_amount THEN
        RAISE EXCEPTION 'Total cicilan melebihi nilai kasbon yang disetujui.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_kasbon_repayment_integrity ON public.kasbon_repayments;
CREATE TRIGGER tr_kasbon_repayment_integrity
  BEFORE INSERT OR UPDATE ON public.kasbon_repayments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kasbon_repayment_integrity();
