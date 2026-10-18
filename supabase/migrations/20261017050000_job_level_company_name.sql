begin;

alter table public.jobs
  add column if not exists company_authorized boolean not null default false;

create or replace function public.jobkhoj_bind_job_owner_company()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor public.profiles%rowtype;
begin
  select * into actor
  from public.profiles
  where id = (select auth.uid());

  if actor.id is null
    or actor.role <> 'RECRUITER'
    or actor.status <> 'Active' then
    raise exception 'An active recruiter account is required to manage jobs.';
  end if;

  new.owner_id = actor.id;
  new.company_name = coalesce(
    nullif(btrim(new.company_name), ''),
    nullif(btrim(actor.company_name), '')
  );

  if new.company_name is null or length(new.company_name) > 120 then
    raise exception 'Enter a company name of 1 to 120 characters.';
  end if;

  if new.status = 'Active' and not new.company_authorized then
    raise exception 'Confirm authorization to recruit for this company before publishing.';
  end if;

  -- Keep a directory link only when the job uses the recruiter's registered
  -- company; a custom name is displayed as recruiter-provided and unverified.
  new.company_id = case
    when actor.company_name is not null
      and lower(new.company_name) = lower(actor.company_name)
      then actor.company_id
    else null
  end;

  return new;
end;
$$;

drop trigger if exists jobs_bind_owner_company on public.jobs;
create trigger jobs_bind_owner_company
  before insert or update of owner_id, company_id, company_name on public.jobs
  for each row execute function public.jobkhoj_bind_job_owner_company();

drop policy if exists "Recruiters can create their own jobs" on public.jobs;
drop policy if exists "Approved recruiters can create their own jobs" on public.jobs;
create policy "Recruiters can create their own jobs"
  on public.jobs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and length(btrim(company_name)) between 1 and 120
    and (jobs.status <> 'Active' or jobs.company_authorized)
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and p.status = 'Active'
    )
  );

drop policy if exists "Recruiters can update their own jobs" on public.jobs;
drop policy if exists "Approved recruiters can update their own jobs" on public.jobs;
create policy "Recruiters can update their own jobs"
  on public.jobs for update to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  )
  with check (
    owner_id = (select auth.uid())
    and length(btrim(company_name)) between 1 and 120
    and (jobs.status <> 'Active' or jobs.company_authorized)
    and (select private.is_approved_jobkhoj_recruiter())
  );

drop policy if exists "Recruiters can delete their own jobs" on public.jobs;
drop policy if exists "Approved recruiters can delete their own jobs" on public.jobs;
create policy "Recruiters can delete their own jobs"
  on public.jobs for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  );

grant select (company_authorized) on public.jobs to anon, authenticated;
grant insert (company_name, company_authorized) on public.jobs to authenticated;
grant update (company_name, company_authorized) on public.jobs to authenticated;

commit;
