-- 20260909000005_leave.sql
-- Leave and permission requests with single-level approval

CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type VARCHAR NOT NULL CHECK (leave_type IN ('cuti', 'izin', 'sakit')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_range CHECK (end_date >= start_date)
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: company members see own rows; Admin/Manager see all in company
CREATE POLICY select_leave_requests ON public.leave_requests
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

-- INSERT: employees create their OWN pending requests only
CREATE POLICY insert_own_leave_request ON public.leave_requests
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() AND
        user_id = public.get_user_id() AND
        status = 'pending' AND decided_by IS NULL
    );

-- UPDATE: only Admin/Manager decide (approve/reject). Enforce terminal states.
CREATE POLICY decide_leave_request ON public.leave_requests
    FOR UPDATE USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    )
    WITH CHECK (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );
