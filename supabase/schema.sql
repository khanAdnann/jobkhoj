create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  role text not null default 'JOB_SEEKER'
    check (role in ('JOB_SEEKER', 'RECRUITER', 'ADMIN')),
  company_name text,
  company_size text,
  company_id text,
  recruiter_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  company_id text,
  company_name text not null,
  title text not null check (length(title) between 1 and 120),
  department text not null default '',
  location text not null,
  work_mode text not null default '',
  employment_type text not null default '',
  experience_min integer not null default 0 check (experience_min >= 0),
  experience_max integer not null default 0 check (experience_max >= experience_min),
  experience_label text not null default 'Not specified',
  salary_min numeric(10, 2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(10, 2) check (salary_max is null or salary_max >= 0),
  skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  education text not null default '',
  description text not null default '',
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  benefits text[] not null default '{}',
  openings integer not null default 1 check (openings between 1 and 99),
  featured boolean not null default false,
  status text not null default 'Draft'
    check (status in ('Draft', 'Pending Approval', 'Active', 'Closed', 'Rejected', 'Expired')),
  posted_at timestamptz not null default now(),
  deadline date,
  views integer not null default 0 check (views >= 0),
  applicant_count integer not null default 0 check (applicant_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(company_name, '') || ' ' ||
      coalesce(department, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(experience_label, '') || ' ' ||
      coalesce(array_to_string(skills, ' '), '')
    )
  ) stored,
  check (salary_min is null or salary_max is null or salary_max >= salary_min)
);

create index if not exists jobs_public_status_deadline_posted_idx
  on public.jobs (status, deadline, posted_at desc);
create index if not exists jobs_owner_posted_idx
  on public.jobs (owner_id, posted_at desc);
create index if not exists jobs_search_document_idx
  on public.jobs using gin (search_document);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create or replace function public.bind_job_owner_company()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  recruiter public.profiles%rowtype;
begin
  select * into recruiter
  from public.profiles
  where id = (select auth.uid());

  if recruiter.id is null
    or recruiter.role <> 'RECRUITER'
    or not recruiter.recruiter_approved
    or nullif(btrim(recruiter.company_name), '') is null then
    raise exception 'Only approved recruiters can manage jobs.';
  end if;

  new.owner_id = recruiter.id;
  new.company_id = recruiter.company_id;
  new.company_name = recruiter.company_name;
  return new;
end;
$$;

revoke all on function public.bind_job_owner_company() from public, anon, authenticated;

drop trigger if exists jobs_bind_owner_company on public.jobs;
create trigger jobs_bind_owner_company
  before insert or update on public.jobs
  for each row execute function public.bind_job_owner_company();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.profiles (id, name, phone, role, company_name, company_size)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case
      when new.raw_user_meta_data ->> 'role' = 'RECRUITER' then 'RECRUITER'
      else 'JOB_SEEKER'
    end,
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_size', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_jobkhoj on auth.users;
create trigger on_auth_user_created_jobkhoj
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, company_name, company_size) on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can update editable profile fields" on public.profiles;
create policy "Users can update editable profile fields"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.jobs from anon, authenticated;
grant select (
  id,
  company_id,
  company_name,
  title,
  department,
  location,
  work_mode,
  employment_type,
  experience_min,
  experience_max,
  experience_label,
  salary_min,
  salary_max,
  skills,
  preferred_skills,
  education,
  description,
  responsibilities,
  requirements,
  benefits,
  openings,
  featured,
  status,
  posted_at,
  deadline,
  views,
  applicant_count,
  created_at,
  updated_at,
  search_document
) on public.jobs to anon, authenticated;
grant select (owner_id) on public.jobs to authenticated;
grant insert (
  owner_id,
  title,
  department,
  location,
  work_mode,
  employment_type,
  experience_min,
  experience_max,
  experience_label,
  salary_min,
  salary_max,
  skills,
  preferred_skills,
  education,
  description,
  responsibilities,
  requirements,
  benefits,
  openings,
  status,
  deadline
) on public.jobs to authenticated;
grant update (
  title,
  department,
  location,
  work_mode,
  employment_type,
  experience_min,
  experience_max,
  experience_label,
  salary_min,
  salary_max,
  skills,
  preferred_skills,
  education,
  description,
  responsibilities,
  requirements,
  benefits,
  openings,
  status,
  deadline
) on public.jobs to authenticated;
grant delete on public.jobs to authenticated;

drop policy if exists "Public can read published jobs" on public.jobs;
create policy "Public can read published jobs"
  on public.jobs for select to anon, authenticated
  using (status = 'Active' and (deadline is null or deadline >= current_date));

drop policy if exists "Owners can read their jobs" on public.jobs;
create policy "Owners can read their jobs"
  on public.jobs for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Approved recruiters can create their own jobs" on public.jobs;
create policy "Approved recruiters can create their own jobs"
  on public.jobs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and p.recruiter_approved
    )
  );

drop policy if exists "Approved recruiters can update their own jobs" on public.jobs;
create policy "Approved recruiters can update their own jobs"
  on public.jobs for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and p.recruiter_approved
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and p.recruiter_approved
    )
  );

drop policy if exists "Approved recruiters can delete their own jobs" on public.jobs;
create policy "Approved recruiters can delete their own jobs"
  on public.jobs for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and p.recruiter_approved
    )
  );
