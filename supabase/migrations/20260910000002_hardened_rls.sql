-- Migration: 20260910000002_hardened_rls.sql
-- Issues B + C: Drop/recreate all RLS policies as explicit SELECT/INSERT/UPDATE/DELETE
-- with proper USING (read) and WITH CHECK (write) per §1.3 spec.
-- Prerequisite: Migration 1 (20260910000001_auth_id_not_null.sql) must run first.

BEGIN;

-- ============================================================
-- 1. COMPANIES (Issue C: add INSERT/DELETE policies)
-- ============================================================
-- Drop all existing policies on companies
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;
DROP POLICY IF EXISTS "companies_read_own" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_own" ON public.companies;

-- SELECT: user can read their own company
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- INSERT: user can create a company (admin/org-creation flow)
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (
    id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- UPDATE: user can update their own company
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (
    id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- DELETE: user can delete their own company
CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE USING (
    id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 2. USERS
-- ============================================================
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
DROP POLICY IF EXISTS "modify_own_user" ON public.users;

-- SELECT: user can read users in their own company
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- INSERT: user can insert into their own company
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- UPDATE: user can update users in their own company
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- DELETE: user can delete users in their own company
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 3. USER_ROLES
-- ============================================================
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "user_roles_delete" ON public.user_roles
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 4. EMPLOYEE_PAYROLL_SETTINGS
-- ============================================================
DROP POLICY IF EXISTS "employee_payroll_settings_select" ON public.employee_payroll_settings;
DROP POLICY IF EXISTS "employee_payroll_settings_insert" ON public.employee_payroll_settings;
DROP POLICY IF EXISTS "employee_payroll_settings_update" ON public.employee_payroll_settings;
DROP POLICY IF EXISTS "employee_payroll_settings_delete" ON public.employee_payroll_settings;

CREATE POLICY "employee_payroll_settings_select" ON public.employee_payroll_settings
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "employee_payroll_settings_insert" ON public.employee_payroll_settings
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "employee_payroll_settings_update" ON public.employee_payroll_settings
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "employee_payroll_settings_delete" ON public.employee_payroll_settings
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 5. ATTENDANCE
-- ============================================================
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;

CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "attendance_update" ON public.attendance
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "attendance_delete" ON public.attendance
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 6. ATTENDANCE_LOGS
-- ============================================================
DROP POLICY IF EXISTS "attendance_logs_select" ON public.attendance_logs;
DROP POLICY IF EXISTS "attendance_logs_insert" ON public.attendance_logs;
DROP POLICY IF EXISTS "attendance_logs_update" ON public.attendance_logs;
DROP POLICY IF EXISTS "attendance_logs_delete" ON public.attendance_logs;
DROP POLICY IF EXISTS "attendance_logs_own_company" ON public.attendance_logs;
DROP POLICY IF EXISTS "update_attendance_log" ON public.attendance_logs;

CREATE POLICY "attendance_logs_select" ON public.attendance_logs
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "attendance_logs_insert" ON public.attendance_logs
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "attendance_logs_update" ON public.attendance_logs
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  ) WITH CHECK (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "attendance_logs_delete" ON public.attendance_logs
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================================
-- 7. TASKS
-- ============================================================
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "tasks_own_company" ON public.tasks;
DROP POLICY IF EXISTS "update_task_status" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 8. SHIFTS
-- ============================================================
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_own" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert_own" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_own" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete_own" ON public.shifts;

CREATE POLICY "shifts_select" ON public.shifts
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "shifts_insert" ON public.shifts
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "shifts_update" ON public.shifts
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "shifts_delete" ON public.shifts
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 9. SHIFT_TEMPLATES
-- ============================================================
DROP POLICY IF EXISTS "shift_templates_select" ON public.shift_templates;
DROP POLICY IF EXISTS "shift_templates_insert" ON public.shift_templates;
DROP POLICY IF EXISTS "shift_templates_update" ON public.shift_templates;
DROP POLICY IF EXISTS "shift_templates_delete" ON public.shift_templates;

CREATE POLICY "shift_templates_select" ON public.shift_templates
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "shift_templates_insert" ON public.shift_templates
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "shift_templates_update" ON public.shift_templates
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  ) WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "shift_templates_delete" ON public.shift_templates
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- 10. SHIFT_ASSIGNMENTS
-- ============================================================
DROP POLICY IF EXISTS "shift_assignments_select" ON public.shift_assignments;
DROP POLICY IF EXISTS "shift_assignments_insert" ON public.shift_assignments;
DROP POLICY IF EXISTS "shift_assignments_update" ON public.shift_assignments;
DROP POLICY IF EXISTS "shift_assignments_delete" ON public.shift_assignments;

CREATE POLICY "shift_assignments_select" ON public.shift_assignments
  FOR SELECT USING (
    shift_id IN (
      SELECT id FROM public.shifts
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "shift_assignments_insert" ON public.shift_assignments
  FOR INSERT WITH CHECK (
    shift_id IN (
      SELECT id FROM public.shifts
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "shift_assignments_update" ON public.shift_assignments
  FOR UPDATE USING (
    shift_id IN (
      SELECT id FROM public.shifts
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  ) WITH CHECK (
    shift_id IN (
      SELECT id FROM public.shifts
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "shift_assignments_delete" ON public.shift_assignments
  FOR DELETE USING (
    shift_id IN (
      SELECT id FROM public.shifts
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================================
-- 11. LEAVE_REQUESTS
-- ============================================================
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_own_company" ON public.leave_requests;
DROP POLICY IF EXISTS "decide_leave_request" ON public.leave_requests;

CREATE POLICY "leave_requests_select" ON public.leave_requests
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "leave_requests_insert" ON public.leave_requests
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- UPDATE: user can update own requests; manager can decide (status transition)
CREATE POLICY "leave_requests_update" ON public.leave_requests
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  ) WITH CHECK (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "leave_requests_delete" ON public.leave_requests
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================================
-- 12. SHIFT_SWAP_REQUESTS
-- ============================================================
DROP POLICY IF EXISTS "shift_swap_requests_select" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "shift_swap_requests_insert" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "shift_swap_requests_update" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "shift_swap_requests_delete" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "shift_swap_requests_own_company" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "decide_swap_requests" ON public.shift_swap_requests;

CREATE POLICY "shift_swap_requests_select" ON public.shift_swap_requests
  FOR SELECT USING (
    requester_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "shift_swap_requests_insert" ON public.shift_swap_requests
  FOR INSERT WITH CHECK (
    requester_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "shift_swap_requests_update" ON public.shift_swap_requests
  FOR UPDATE USING (
    requester_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  ) WITH CHECK (
    requester_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "shift_swap_requests_delete" ON public.shift_swap_requests
  FOR DELETE USING (
    requester_id IN (
      SELECT id FROM public.users
      WHERE company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================================
-- 13. AUDIT_EVENTS
-- ============================================================
DROP POLICY IF EXISTS "audit_events_select" ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_insert" ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_update" ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_delete" ON public.audit_events;

CREATE POLICY "audit_events_select" ON public.audit_events
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- INSERT only via SECURITY DEFINER trigger (no direct user insert)
CREATE POLICY "audit_events_insert" ON public.audit_events
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- No UPDATE/DELETE on audit events (immutable log)
-- Omitted: audit_events_update, audit_events_delete

COMMIT;
