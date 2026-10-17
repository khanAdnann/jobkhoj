-- Additive JobKhoj portal migration for an installation that already has
-- public.profiles and public.jobs from supabase/schema.sql.
-- Review the project before running this against any non-empty production DB.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter table public.profiles
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists location text not null default '',
  add column if not exists headline text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists skills text[] not null default '{}',
  add column if not exists years_of_experience numeric(4, 1),
  add column if not exists experience jsonb not null default '[]'::jsonb,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists projects jsonb not null default '[]'::jsonb,
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists social jsonb not null default '{}'::jsonb,
  add column if not exists public_profile boolean not null default true,
  add column if not exists status text not null default 'Active',
  add column if not exists resume_path text,
  add column if not exists resume_name text,
  add column if not exists resume_size bigint,
  add column if not exists resume_uploaded_at timestamptz;

do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_status_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_status_allowed check (status in ('Active', 'Blocked'));
  end if;
end;
$constraint$;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where email is not null;

create table if not exists public.companies (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique,
  industry text not null default '',
  website text,
  location text not null default '',
  size text,
  founded integer,
  about text not null default '',
  benefits text[] not null default '{}',
  social jsonb not null default '{}'::jsonb,
  verification text not null default 'Pending'
    check (verification in ('Pending', 'Verified', 'Rejected', 'Suspended')),
  owner_id uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_name_lower_idx
  on public.companies (lower(name));
create index if not exists companies_verification_name_idx
  on public.companies (verification, name);

-- Preserve the current company IDs whenever they are already present in profiles
-- or jobs; names without an ID receive a generated stable database ID.
with sources as (
  select nullif(btrim(company_id), '') as source_id,
         nullif(btrim(company_name), '') as company_name
  from public.profiles
  where nullif(btrim(company_name), '') is not null
  union all
  select nullif(btrim(company_id), ''),
         nullif(btrim(company_name), '')
  from public.jobs
  where nullif(btrim(company_name), '') is not null
), grouped as (
  select min(source_id) as source_id, min(company_name) as company_name
  from sources
  group by lower(company_name)
)
insert into public.companies (id, name, slug, owner_id)
select coalesce(source_id, gen_random_uuid()::text),
       company_name,
       coalesce(
         nullif(trim(both '-' from regexp_replace(lower(company_name), '[^a-z0-9]+', '-', 'g')), ''),
         'company'
       )
         || '-' || substring(md5(lower(company_name)), 1, 6),
       (select p.id from public.profiles p
        where lower(p.company_name) = lower(grouped.company_name)
        order by p.created_at asc limit 1)
from grouped
on conflict (lower(name)) do nothing;

update public.profiles p
set company_id = c.id
from public.companies c
where p.company_name is not null
  and lower(p.company_name) = lower(c.name)
  and p.company_id is distinct from c.id;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  candidate_name text not null default '',
  candidate_email text not null default '',
  candidate_phone text not null default '',
  candidate_location text not null default '',
  headline text not null default '',
  years_of_experience numeric(4, 1),
  skills text[] not null default '{}',
  resume_path text,
  resume_name text,
  cover_letter text not null default '',
  expected_salary text not null default '',
  notice_period text not null default '',
  status text not null default 'Applied'
    check (status in ('Applied', 'Under Review', 'Shortlisted', 'Interview', 'Rejected', 'Hired')),
  stage text not null default 'APPLIED'
    check (stage in ('APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'HIRED', 'REJECTED')),
  timeline jsonb not null default '[]'::jsonb,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists job_applications_applicant_recent_idx
  on public.job_applications (applicant_id, applied_at desc);
create index if not exists job_applications_job_stage_recent_idx
  on public.job_applications (job_id, stage, applied_at desc);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, job_id)
);
create index if not exists saved_jobs_user_recent_idx
  on public.saved_jobs (user_id, saved_at desc);

create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  keywords text[] not null default '{}',
  location text not null default '',
  experience text not null default 'Any',
  department text not null default 'Software Development',
  frequency text not null default 'Daily'
    check (frequency in ('Instantly', 'Daily', 'Weekly')),
  active boolean not null default true,
  matches integer not null default 0 check (matches >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_alerts_user_recent_idx
  on public.job_alerts (user_id, created_at desc);

create or replace function private.is_jobkhoj_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'ADMIN'
      and p.status = 'Active'
  );
$$;

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
      and p.recruiter_approved
      and p.status = 'Active'
  );
$$;

revoke all on function private.is_jobkhoj_admin() from public, anon;
revoke all on function private.is_approved_jobkhoj_recruiter() from public, anon;
grant execute on function private.is_jobkhoj_admin() to authenticated;
grant execute on function private.is_approved_jobkhoj_recruiter() to authenticated;

create or replace function public.admin_set_profile_status(target_id uuid, next_status text)
returns text
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  result_status text;
begin
  if not (select private.is_jobkhoj_admin()) then
    raise exception 'Only a JobKhoj administrator can moderate profiles.';
  end if;
  if target_id = (select auth.uid()) then
    raise exception 'You cannot block your own administrator account.';
  end if;
  if next_status not in ('Active', 'Blocked') then
    raise exception 'Unsupported profile status.';
  end if;

  update public.profiles set status = next_status where id = target_id
  returning status into result_status;
  if result_status is null then
    raise exception 'Profile not found.';
  end if;
  return result_status;
end;
$$;

create or replace function public.admin_set_company_verification(target_id text, next_status text)
returns public.companies
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  result public.companies%rowtype;
begin
  if not (select private.is_jobkhoj_admin()) then
    raise exception 'Only a JobKhoj administrator can verify companies.';
  end if;
  if next_status not in ('Pending', 'Verified', 'Rejected', 'Suspended') then
    raise exception 'Unsupported company verification status.';
  end if;

  update public.companies
    set verification = next_status,
        verified_at = case when next_status = 'Verified' then now() else null end
    where id = target_id
    returning * into result;
  if result.id is null then
    raise exception 'Company not found.';
  end if;
  return result;
end;
$$;
revoke all on function public.admin_set_profile_status(uuid, text) from public, anon;
revoke all on function public.admin_set_company_verification(text, text) from public, anon;
grant execute on function public.admin_set_profile_status(uuid, text) to authenticated;
grant execute on function public.admin_set_company_verification(text, text) to authenticated;

-- Extend the existing auth profile trigger to keep the trusted auth email in
-- sync. User-editable metadata can never set role, status, or recruiter approval.
create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.profiles (id, name, email, phone, role, company_name, company_size)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'role' = 'RECRUITER'
      then 'RECRUITER' else 'JOB_SEEKER' end,
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_size', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;

create or replace function public.sync_jobkhoj_profile_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
revoke all on function public.sync_jobkhoj_profile_email() from public, anon, authenticated;
drop trigger if exists on_auth_user_email_updated_jobkhoj on auth.users;
create trigger on_auth_user_email_updated_jobkhoj
  after update of email on auth.users
  for each row execute function public.sync_jobkhoj_profile_email();

-- Existing job ownership trigger prevented admin moderation. Admins may update
-- permitted job columns through RLS; recruiters remain bound to their own company.
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
  if actor.role = 'ADMIN' then
    return new;
  end if;
  if actor.role <> 'RECRUITER'
    or not actor.recruiter_approved
    or nullif(btrim(actor.company_name), '') is null then
    raise exception 'Only approved recruiters can manage jobs.';
  end if;

  new.owner_id = actor.id;
  new.company_id = actor.company_id;
  new.company_name = actor.company_name;
  return new;
end;
$$;
revoke all on function public.jobkhoj_bind_job_owner_company() from public, anon, authenticated;
drop trigger if exists jobs_bind_owner_company on public.jobs;
create trigger jobs_bind_owner_company
  before insert or update of owner_id, company_id, company_name on public.jobs
  for each row execute function public.jobkhoj_bind_job_owner_company();

create or replace function public.ensure_jobkhoj_company_for_recruiter()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  company_row public.companies%rowtype;
  company_slug text;
begin
  if new.role <> 'RECRUITER' or nullif(btrim(new.company_name), '') is null then
    return new;
  end if;

  company_slug := trim(both '-' from regexp_replace(lower(new.company_name), '[^a-z0-9]+', '-', 'g'));
  company_slug := coalesce(nullif(company_slug, ''), 'company');

  insert into public.companies (name, slug, size, owner_id)
  values (
    btrim(new.company_name),
    company_slug || '-' || substring(md5(lower(btrim(new.company_name))), 1, 6),
    nullif(new.company_size, ''),
    new.id
  )
  on conflict (lower(name)) do update
    set owner_id = coalesce(public.companies.owner_id, excluded.owner_id)
  returning * into company_row;

  update public.profiles
  set company_id = company_row.id
  where id = new.id
    and company_id is distinct from company_row.id;

  return new;
end;
$$;
revoke all on function public.ensure_jobkhoj_company_for_recruiter() from public, anon, authenticated;
drop trigger if exists profiles_ensure_jobkhoj_company on public.profiles;
create trigger profiles_ensure_jobkhoj_company
  after insert or update of role, company_name, company_size on public.profiles
  for each row execute function public.ensure_jobkhoj_company_for_recruiter();

create or replace function public.prepare_jobkhoj_application()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor public.profiles%rowtype;
  target_job public.jobs%rowtype;
  now_at timestamptz := now();
begin
  if tg_op = 'INSERT' then
    select * into actor from public.profiles where id = (select auth.uid());
    select * into target_job from public.jobs where id = new.job_id;
    if actor.id is null or actor.role <> 'JOB_SEEKER' or actor.status <> 'Active' then
      raise exception 'An active job seeker account is required to apply.';
    end if;
    if target_job.id is null or target_job.status <> 'Active'
      or (target_job.deadline is not null and target_job.deadline < current_date) then
      raise exception 'This job is no longer accepting applications.';
    end if;

    new.applicant_id := actor.id;
    new.candidate_name := coalesce(nullif(btrim(new.candidate_name), ''), actor.name);
    new.candidate_email := coalesce(nullif(btrim(new.candidate_email), ''), actor.email);
    new.candidate_phone := coalesce(nullif(btrim(new.candidate_phone), ''), actor.phone);
    new.candidate_location := coalesce(nullif(btrim(new.candidate_location), ''), actor.location);
    new.headline := actor.headline;
    new.years_of_experience := coalesce(new.years_of_experience, actor.years_of_experience);
    new.skills := actor.skills;
    new.resume_path := actor.resume_path;
    new.resume_name := actor.resume_name;
    new.status := 'Applied';
    new.stage := 'APPLIED';
    new.applied_at := now_at;
    new.updated_at := now_at;
    new.timeline := jsonb_build_array(jsonb_build_object(
      'label', 'Applied', 'at', now_at, 'stage', 'APPLIED'
    ));
    return new;
  end if;

  if new.job_id <> old.job_id or new.applicant_id <> old.applicant_id then
    raise exception 'Application ownership and job cannot be changed.';
  end if;
  if new.stage is distinct from old.stage then
    new.status := case new.stage
      when 'SCREENING' then 'Under Review'
      when 'SHORTLISTED' then 'Shortlisted'
      when 'INTERVIEW' then 'Interview'
      when 'SELECTED' then 'Interview'
      when 'HIRED' then 'Hired'
      when 'REJECTED' then 'Rejected'
      else 'Applied'
    end;
    new.timeline := coalesce(old.timeline, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'label', initcap(replace(new.stage, '_', ' ')),
        'at', now_at,
        'stage', new.stage
      )
    );
  end if;
  new.updated_at := now_at;
  return new;
end;
$$;
revoke all on function public.prepare_jobkhoj_application() from public, anon, authenticated;
drop trigger if exists job_applications_prepare on public.job_applications;
create trigger job_applications_prepare
  before insert or update on public.job_applications
  for each row execute function public.prepare_jobkhoj_application();

create or replace function public.update_jobkhoj_applicant_count()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.jobs
    set applicant_count = (select count(*) from public.job_applications a where a.job_id = new.job_id)
    where id = new.job_id;
  return new;
end;
$$;
revoke all on function public.update_jobkhoj_applicant_count() from public, anon, authenticated;
drop trigger if exists job_applications_update_job_count on public.job_applications;
create trigger job_applications_update_job_count
  after insert on public.job_applications
  for each row execute function public.update_jobkhoj_applicant_count();

create or replace function public.set_jobkhoj_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_jobkhoj_updated_at() from public, anon, authenticated;
drop trigger if exists companies_set_jobkhoj_updated_at on public.companies;
create trigger companies_set_jobkhoj_updated_at before update on public.companies
  for each row execute function public.set_jobkhoj_updated_at();
drop trigger if exists job_applications_set_jobkhoj_updated_at on public.job_applications;
create trigger job_applications_set_jobkhoj_updated_at before update on public.job_applications
  for each row execute function public.set_jobkhoj_updated_at();
drop trigger if exists job_alerts_set_jobkhoj_updated_at on public.job_alerts;
create trigger job_alerts_set_jobkhoj_updated_at before update on public.job_alerts
  for each row execute function public.set_jobkhoj_updated_at();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.companies enable row level security;
alter table public.job_applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;

drop policy if exists "JobKhoj admins can read all profiles" on public.profiles;
create policy "JobKhoj admins can read all profiles"
  on public.profiles for select to authenticated
  using ((select private.is_jobkhoj_admin()));
drop policy if exists "JobKhoj admins can moderate profiles" on public.profiles;
create policy "JobKhoj admins can moderate profiles"
  on public.profiles for update to authenticated
  using ((select private.is_jobkhoj_admin()))
  with check ((select private.is_jobkhoj_admin()));
drop policy if exists "Recruiters can read public candidate profiles" on public.profiles;

drop policy if exists "JobKhoj admins can read all jobs" on public.jobs;
create policy "JobKhoj admins can read all jobs"
  on public.jobs for select to authenticated
  using ((select private.is_jobkhoj_admin()));
drop policy if exists "JobKhoj admins can moderate jobs" on public.jobs;
create policy "JobKhoj admins can moderate jobs"
  on public.jobs for update to authenticated
  using ((select private.is_jobkhoj_admin()))
  with check ((select private.is_jobkhoj_admin()));
drop policy if exists "Companies are readable when verified" on public.companies;
create policy "Companies are readable when verified"
  on public.companies for select to anon, authenticated
  using (verification = 'Verified');
drop policy if exists "Company owners can read their company" on public.companies;
create policy "Company owners can read their company"
  on public.companies for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (
      (select private.is_approved_jobkhoj_recruiter())
      and id = (
        select p.company_id from public.profiles p
        where p.id = (select auth.uid())
      )
    )
  );
drop policy if exists "JobKhoj admins can read all companies" on public.companies;
create policy "JobKhoj admins can read all companies"
  on public.companies for select to authenticated
  using ((select private.is_jobkhoj_admin()));
drop policy if exists "JobKhoj admins can manage companies" on public.companies;
create policy "JobKhoj admins can manage companies"
  on public.companies for all to authenticated
  using ((select private.is_jobkhoj_admin()))
  with check ((select private.is_jobkhoj_admin()));
drop policy if exists "Approved recruiters can update their company" on public.companies;
create policy "Approved recruiters can update their company"
  on public.companies for update to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  )
  with check (
    owner_id = (select auth.uid())
    and (select private.is_approved_jobkhoj_recruiter())
  );

drop policy if exists "Applicants can read their applications" on public.job_applications;
create policy "Applicants can read their applications"
  on public.job_applications for select to authenticated
  using (applicant_id = (select auth.uid()));
drop policy if exists "Recruiters can read applications to owned jobs" on public.job_applications;
create policy "Recruiters can read applications to owned jobs"
  on public.job_applications for select to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and j.owner_id = (select auth.uid())
    )
    and (select private.is_approved_jobkhoj_recruiter())
  );
drop policy if exists "JobKhoj admins can read all applications" on public.job_applications;
create policy "JobKhoj admins can read all applications"
  on public.job_applications for select to authenticated
  using ((select private.is_jobkhoj_admin()));
drop policy if exists "Active job seekers can apply to published jobs" on public.job_applications;
create policy "Active job seekers can apply to published jobs"
  on public.job_applications for insert to authenticated
  with check (
    applicant_id = (select auth.uid())
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.status = 'Active'
        and (j.deadline is null or j.deadline >= current_date)
    )
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'JOB_SEEKER'
        and p.status = 'Active'
    )
  );
drop policy if exists "Recruiters can update applications to owned jobs" on public.job_applications;
create policy "Recruiters can update applications to owned jobs"
  on public.job_applications for update to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and j.owner_id = (select auth.uid())
    )
    and (select private.is_approved_jobkhoj_recruiter())
  )
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and j.owner_id = (select auth.uid())
    )
    and (select private.is_approved_jobkhoj_recruiter())
  );

drop policy if exists "Users manage their own saved jobs" on public.saved_jobs;
create policy "Users manage their own saved jobs"
  on public.saved_jobs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "Users manage their own job alerts" on public.job_alerts;
create policy "Users manage their own job alerts"
  on public.job_alerts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select (id, name, phone, role, company_name, company_size, company_id,
  recruiter_approved, created_at, updated_at, email, avatar_url, location,
  headline, bio, skills, years_of_experience, experience, education, projects,
  certifications, social, public_profile, status, resume_path, resume_name,
  resume_size, resume_uploaded_at) on public.profiles to authenticated;
grant update (name, phone, company_name, company_size, avatar_url, location,
  headline, bio, skills, years_of_experience, education, projects, certifications,
  experience, social, public_profile, resume_path, resume_name, resume_size, resume_uploaded_at)
  on public.profiles to authenticated;
revoke all on public.companies from anon, authenticated;
grant select on public.companies to anon, authenticated;
grant update (industry, website, location, size, founded, about, benefits, social)
  on public.companies to authenticated;
grant select on public.companies to anon;
grant select on public.job_applications to authenticated;
grant insert (job_id, applicant_id, candidate_name, candidate_email, candidate_phone,
  candidate_location, years_of_experience, resume_path, resume_name, cover_letter,
  expected_salary, notice_period) on public.job_applications to authenticated;
grant update (stage) on public.job_applications to authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert, update, delete on public.job_alerts to authenticated;

-- Explicitly remove public/anon access to candidate and application data.
revoke all on public.job_applications from anon;
revoke all on public.saved_jobs from anon;
revoke all on public.job_alerts from anon;

create or replace view public.public_candidate_profiles
with (security_invoker = false)
as
select id, name, avatar_url, location, headline, bio, skills,
       years_of_experience, education, projects, certifications, social
from public.profiles
where public_profile
  and role = 'JOB_SEEKER'
  and status = 'Active'
  and ((select private.is_approved_jobkhoj_recruiter())
       or (select private.is_jobkhoj_admin()));
grant select on public.public_candidate_profiles to authenticated;

-- Private resume bucket. Do not overwrite a bucket that already exists.
do $bucket$
declare
  existing_bucket storage.buckets%rowtype;
begin
  select * into existing_bucket
  from storage.buckets
  where id = 'jobkhoj-resumes';

  if existing_bucket.id is null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'jobkhoj-resumes',
      'jobkhoj-resumes',
      false,
      5242880,
      array['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    );
  elsif existing_bucket.public then
    raise exception
      'The existing jobkhoj-resumes bucket is public. Make it private and review its Storage policies before rerunning this migration.';
  elsif existing_bucket.file_size_limit is null
    or existing_bucket.file_size_limit > 5242880
    or existing_bucket.allowed_mime_types is null
    or not (
      array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]::text[] <@ existing_bucket.allowed_mime_types
    ) then
    raise exception
      'The existing jobkhoj-resumes bucket does not enforce the expected 5 MB document limits. Review its configuration before rerunning this migration.';
  end if;
end;
$bucket$;

drop policy if exists "Users manage only their resume files" on storage.objects;
create policy "Users manage only their resume files"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'jobkhoj-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'jobkhoj-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Recruiters can read resumes for owned applications" on storage.objects;
create policy "Recruiters can read resumes for owned applications"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'jobkhoj-resumes'
    and (
      (select private.is_jobkhoj_admin())
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
    )
  );

-- Restrictive policies prevent any unrelated permissive Storage policy from
-- making this private bucket readable to anon or unauthorized users.
drop policy if exists "JobKhoj resumes are never public" on storage.objects;
create policy "JobKhoj resumes are never public"
  on storage.objects as restrictive for select to anon
  using (bucket_id <> 'jobkhoj-resumes');
drop policy if exists "Restrict access to JobKhoj resumes" on storage.objects;
create policy "Restrict access to JobKhoj resumes"
  on storage.objects as restrictive for select to authenticated
  using (
    bucket_id <> 'jobkhoj-resumes'
    or (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_jobkhoj_admin())
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
