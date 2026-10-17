begin;

-- Keep ADMIN as a valid profile role, but disable its authorization path.
create or replace function private.is_jobkhoj_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select false;
$$;

revoke all on function private.is_jobkhoj_admin() from public, anon, authenticated;
revoke all on function public.admin_set_profile_status(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_set_company_verification(text, text) from public, anon, authenticated;

-- Recruiter approval is no longer required; an active recruiter still must own
-- the job and have a company name. Keep this helper for existing policy callers.
create or replace function private.is_approved_jobkhoj_recruiter()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'RECRUITER'
      and p.status = 'Active'
  );
$$;

revoke all on function private.is_approved_jobkhoj_recruiter() from public, anon;
grant execute on function private.is_approved_jobkhoj_recruiter() to authenticated;

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

  if actor.id is null or actor.status <> 'Active' then
    raise exception 'An active JobKhoj account is required to manage jobs.';
  end if;
  if actor.role <> 'RECRUITER'
    or nullif(btrim(actor.company_name), '') is null then
    raise exception 'Only active recruiters with a company name can manage jobs.';
  end if;

  new.owner_id = actor.id;
  new.company_id = actor.company_id;
  new.company_name = actor.company_name;
  return new;
end;
$$;

-- Restrict the ownership trigger to ownership fields so application-count
-- updates do not accidentally require recruiter ownership authorization.
drop trigger if exists jobs_bind_owner_company on public.jobs;
create trigger jobs_bind_owner_company
  before insert or update of owner_id, company_id, company_name on public.jobs
  for each row execute function public.jobkhoj_bind_job_owner_company();

drop policy if exists "Approved recruiters can create their own jobs" on public.jobs;
drop policy if exists "Approved recruiters can update their own jobs" on public.jobs;
drop policy if exists "Approved recruiters can delete their own jobs" on public.jobs;
drop policy if exists "Recruiters can create their own jobs" on public.jobs;
create policy "Recruiters can create their own jobs"
  on public.jobs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and p.status = 'Active'
        and nullif(btrim(p.company_name), '') is not null
    )
  );

drop policy if exists "Recruiters can update their own jobs" on public.jobs;
create policy "Recruiters can update their own jobs"
  on public.jobs for update to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  )
  with check (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  );

drop policy if exists "Recruiters can delete their own jobs" on public.jobs;
create policy "Recruiters can delete their own jobs"
  on public.jobs for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  );

-- Remove admin-only table access. Existing own-profile, public-job,
-- applicant, and job-owner policies remain in place.
drop policy if exists "JobKhoj admins can read all profiles" on public.profiles;
drop policy if exists "JobKhoj admins can moderate profiles" on public.profiles;
drop policy if exists "JobKhoj admins can read all jobs" on public.jobs;
drop policy if exists "JobKhoj admins can moderate jobs" on public.jobs;
drop policy if exists "JobKhoj admins can read all companies" on public.companies;
drop policy if exists "JobKhoj admins can manage companies" on public.companies;
drop policy if exists "JobKhoj admins can read all applications" on public.job_applications;

-- Existing pending recruiter listings should become available immediately.
update public.jobs j
set status = 'Active'
where j.status = 'Pending Approval'
  and exists (
    select 1 from public.profiles p
    where p.id = j.owner_id
      and p.role = 'RECRUITER'
      and p.status = 'Active'
  );

create or replace view public.public_candidate_profiles
with (security_invoker = false)
as
select id, name, avatar_url, location, headline, bio, skills,
       years_of_experience, education, projects, certifications, social
from public.profiles
where public_profile
  and role = 'JOB_SEEKER'
  and status = 'Active'
  and (select private.is_approved_jobkhoj_recruiter());
grant select on public.public_candidate_profiles to authenticated;

drop policy if exists "Recruiters can read resumes for owned applications" on storage.objects;
create policy "Recruiters can read resumes for owned applications"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'jobkhoj-resumes'
    and (select private.is_approved_jobkhoj_recruiter())
    and exists (
      select 1
      from public.job_applications a
      join public.jobs j on j.id = a.job_id
      where a.resume_path = storage.objects.name
        and j.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Restrict access to JobKhoj resumes" on storage.objects;
create policy "Restrict access to JobKhoj resumes"
  on storage.objects as restrictive for select to authenticated
  using (
    bucket_id <> 'jobkhoj-resumes'
    or (storage.foldername(name))[1] = (select auth.uid())::text
    or (
      (select private.is_approved_jobkhoj_recruiter())
      and exists (
        select 1
        from public.job_applications a
        join public.jobs j on j.id = a.job_id
        where a.resume_path = storage.objects.name
          and j.owner_id = (select auth.uid())
      )
    )
  );

commit;
