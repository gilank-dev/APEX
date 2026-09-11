-- Dashboard realtime stats: single round-trip aggregate RPC + realtime publication.
-- Adds one security-definer function scoped to the caller's own company so the
-- dashboard pulls all stats in one call instead of ~10 sequential queries.
-- Cross-tenant probing is rejected: target must match the JWT-derived company.

create or replace function public.get_dashboard_stats(target_company_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  caller_company uuid;
begin
  select public.get_company_id() into caller_company;

  if caller_company is null or caller_company <> target_company_id then
    raise exception 'ACCESS DENIED: stats are scoped to your own company'
      using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'attendance_today', (
        select count(*) from attendance_logs
        where company_id = target_company_id
          and clock_in_time >= date_trunc('day', now())
      ),
      'open_tasks', (
        select count(*) from tasks
        where company_id = target_company_id
          and status <> 'done'
      ),
      'total_tasks', (
        select count(*) from tasks
        where company_id = target_company_id
      ),
      'tasks_todo', (
        select count(*) from tasks
        where company_id = target_company_id and status = 'todo'
      ),
      'tasks_in_progress', (
        select count(*) from tasks
        where company_id = target_company_id and status = 'in_progress'
      ),
      'tasks_review', (
        select count(*) from tasks
        where company_id = target_company_id and status = 'review'
      ),
      'tasks_done', (
        select count(*) from tasks
        where company_id = target_company_id and status = 'done'
      ),
      'low_stock', (
        select count(*) from inventory_assets
        where company_id = target_company_id and quantity <= 10
      ),
      'total_members', (
        select count(*) from users
        where company_id = target_company_id
      ),
      'active_sessions', (
        select count(*) from attendance_logs
        where company_id = target_company_id
          and clock_out_time is null
          and clock_in_time >= date_trunc('day', now())
      ),
      'daily_trend', (
        select coalesce(json_agg(t order by t.day), '[]'::json)
        from (
          select to_char(d.day, 'YYYY-MM-DD') as day,
                 count(al.id) as present
          from generate_series(
                 date_trunc('day', now()) - interval '5 days',
                 date_trunc('day', now()),
                 interval '1 day'
               ) as d(day)
          left join attendance_logs al
            on al.company_id = target_company_id
           and al.clock_in_time >= d.day
           and al.clock_in_time < d.day + interval '1 day'
          group by d.day
        ) t
      )
    )
  );
end;
$$;

-- Realtime publication: only the tables the dashboard charts listen to.
alter publication supabase_realtime add table public.attendance_logs;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.inventory_assets;

-- Explicit execute grant (mirror of 20260910000014 policy: self-contained ACLs).
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO anon, authenticated;
