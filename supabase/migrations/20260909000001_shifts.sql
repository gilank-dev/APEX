-- 20260909000001_shifts.sql
-- Shift templates and weekly roster assignments with company-level RLS

-- shift_templates: reusable shift definitions per company
CREATE TABLE public.shift_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,                 -- e.g. 'Pagi', 'Siang', 'Malam'
    start_time TIME NOT NULL,              -- e.g. 07:00
    end_time TIME NOT NULL,                 -- e.g. 15:00
    overnight BOOLEAN NOT NULL DEFAULT false, -- true if end_time < start_time (e.g. 22:00-06:00)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- shift_assignments: who works which template on which date
CREATE TABLE public.shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shift_template_id UUID NOT NULL REFERENCES public.shift_templates(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, assignment_date)
);

-- Enable RLS
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

-- Shift templates policies
CREATE POLICY select_shift_templates ON public.shift_templates
    FOR SELECT USING (company_id = public.get_company_id());

CREATE POLICY modify_shift_templates ON public.shift_templates
    FOR ALL USING (company_id = public.get_company_id() AND public.get_user_role() IN ('Admin', 'Manager'));

-- Shift assignments policies
CREATE POLICY select_shift_assignments ON public.shift_assignments
    FOR SELECT USING (company_id = public.get_company_id());

CREATE POLICY modify_shift_assignments ON public.shift_assignments
    FOR ALL USING (company_id = public.get_company_id() AND public.get_user_role() IN ('Admin', 'Manager'));
