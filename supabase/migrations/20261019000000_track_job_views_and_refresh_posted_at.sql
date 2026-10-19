begin;

create or replace function public.jobkhoj_increment_job_view(p_job_id uuid)
returns integer
language sql
security definer
set search_path = pg_catalog
as $$
  update public.jobs
  set views = views + 1
  where id = p_job_id
    and status = 'Active'
    and (deadline is null or deadline >= current_date)
  returning views;
$$;

revoke all on function public.jobkhoj_increment_job_view(uuid) from public, anon, authenticated;
grant execute on function public.jobkhoj_increment_job_view(uuid) to anon, authenticated;

commit;
