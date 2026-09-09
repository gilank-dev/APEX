-- 20260909000007_attendance_storage.sql
-- Attendance storage hardening + race/behavior fixes

-- 1. Private storage bucket for attendance selfies
insert into storage.buckets (id, name, public)
values ('attendance', 'attendance', false)
on conflict (id) do nothing;

-- 2. Storage RLS: members can read objects under their own company prefix
create policy "attendance_storage_read_company"
on storage.objects for select to authenticated
using (
    bucket_id = 'attendance'
    and (storage.foldername(name))[1] = (select company_id::text from public.users where auth_id = auth.uid() limit 1)
);

-- 3. Storage RLS: members can upload under their own company prefix only
create policy "attendance_storage_write_company"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'attendance'
    and (storage.foldername(name))[1] = (select company_id::text from public.users where auth_id = auth.uid() limit 1)
);

-- 4. One open attendance session per user at a time (blocks double clock-in
--    and overnight double-clock after midnight). Partial unique index.
create unique index if not exists uniq_open_attendance_session
on public.attendance_logs (user_id)
where clock_out_time is null;

-- 5. Harden leave decide policy: enforce terminal transition + decider attribution
drop policy if exists decide_leave_request on public.leave_requests;
create policy decide_leave_request on public.leave_requests
    for update using (
        company_id = public.get_company_id() and
        public.get_user_role() in ('Admin', 'Manager')
    )
    with check (
        company_id = public.get_company_id() and
        public.get_user_role() in ('Admin', 'Manager') and
        status in ('approved', 'rejected') and
        decided_by is not null and
        decided_at is not null
    );

-- 6. Swap policies: split decide (target/manager, terminal states) from cancel (requester, while pending)
drop policy if exists decide_swap_requests on public.shift_swap_requests;
create policy decide_swap_requests on public.shift_swap_requests
    for update using (
        company_id = public.get_company_id() and (
            target_id = public.get_user_id() or
            public.get_user_role() in ('Admin', 'Manager')
        )
    )
    with check (
        company_id = public.get_company_id() and
        status in ('approved', 'rejected')
    );

create policy cancel_swap_request_own on public.shift_swap_requests
    for update using (
        company_id = public.get_company_id() and
        requester_id = public.get_user_id() and
        status = 'pending'
    )
    with check (
        company_id = public.get_company_id() and
        status = 'cancelled'
    );
