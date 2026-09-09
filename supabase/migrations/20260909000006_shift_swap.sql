-- 20260909000006_shift_swap.sql
-- Shift swap requests between employees with RLS

CREATE TABLE public.shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requester_assignment_id UUID NOT NULL REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
    target_assignment_id UUID NOT NULL REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_swap_requests ON public.shift_swap_requests
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            requester_id = public.get_user_id() OR
            target_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

CREATE POLICY insert_own_swap_request ON public.shift_swap_requests
    FOR INSERT WITH CHECK (
        company_id = public.get_company_id() AND
        requester_id = public.get_user_id() AND
        status = 'pending'
    );

CREATE POLICY decide_swap_requests ON public.shift_swap_requests
    FOR UPDATE USING (
        company_id = public.get_company_id() AND (
            target_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );
