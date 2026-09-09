-- 20260909000002_payroll.sql
-- Employee payroll settings table and RLS policies

CREATE TABLE public.employee_payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,   -- monthly, Rupiah
    overtime_rate_per_hour NUMERIC(14,2) NOT NULL DEFAULT 0, -- Rupiah/hour
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.employee_payroll_settings ENABLE ROW LEVEL SECURITY;

-- Select: Tenant members can view payroll settings in their company
-- (Admins & Managers see all employees in company; Employees see only their own row)
CREATE POLICY select_payroll_settings ON public.employee_payroll_settings
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

-- Modify: Only Admin and Manager can create, update, or delete payroll settings
CREATE POLICY modify_payroll_settings ON public.employee_payroll_settings
    FOR ALL USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );
