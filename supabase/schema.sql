-- One-time install for a project without the JobKhoj profiles/jobs tables.
-- Existing auth signup trigger is preserved and its function is refreshed;
-- other helper functions use namespaced names to avoid collisions.
begin;

do $preflight$
begin
  if to_regclass('public.profiles') is not null
    or to_regclass('public.jobs') is not null then
    raise exception
      'JobKhoj profiles/jobs already exist. Stop and prepare a migration instead of running this installer.';
  end if;

  if to_regclass('public.jobs_public_status_deadline_posted_idx') is not null
    or to_regclass('public.jobs_owner_posted_idx') is not null
    or to_regclass('public.jobs_search_document_idx') is not null then
    raise exception
      'A JobKhoj index name already exists. Inspect it before installing this schema.';
  end if;
end;
$preflight$;

create table public.profiles (
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

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  company_id text,
  company_name text not null,
  company_authorized boolean not null default false,
  application_url text
    check (
      application_url is null
      or (
        length(application_url) <= 2048
        and application_url ~* '^https?://[^[:space:]]+$'
      )
    ),
  title text not null
    check (length(btrim(title)) between 1 and 80),
  department text not null default '' check (length(btrim(department)) > 0),
  location text not null check (length(btrim(location)) > 0),
  work_mode text not null default '' check (length(btrim(work_mode)) > 0),
  employment_type text not null default '' check (length(btrim(employment_type)) > 0),
  experience_min integer not null default 0 check (experience_min between 0 and 30),
  experience_max integer not null default 0
    check (experience_max between experience_min and 30),
  experience_label text not null default 'Not specified',
  salary_min numeric(10, 2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(10, 2) check (salary_max is null or salary_max >= 0),
  skills text[] not null default '{}' check (cardinality(skills) <= 15),
  preferred_skills text[] not null default '{}' check (cardinality(preferred_skills) <= 10),
  education text not null default '',
  description text not null default '' check (length(description) <= 3000),
  responsibilities text[] not null default '{}' check (cardinality(responsibilities) <= 10),
  requirements text[] not null default '{}' check (cardinality(requirements) <= 10),
  benefits text[] not null default '{}' check (cardinality(benefits) <= 10),
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
  search_document tsvector not null default ''::tsvector,
  check (salary_min is null or salary_max is null or salary_max >= salary_min),
  check (
    status <> 'Active'
    or (
      length(btrim(title)) > 0
      and length(btrim(department)) > 0
      and length(btrim(location)) > 0
      and length(btrim(work_mode)) > 0
      and length(btrim(employment_type)) > 0
      and length(btrim(description)) > 0
    )
  )
);

create index jobs_public_status_deadline_posted_idx
  on public.jobs (status, deadline, posted_at desc);
create index jobs_owner_posted_idx
  on public.jobs (owner_id, posted_at desc);
create index jobs_search_document_idx
  on public.jobs using gin (search_document);

create function public.jobkhoj_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.jobkhoj_set_updated_at();

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.jobkhoj_set_updated_at();

create function public.jobkhoj_set_job_search_document()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.search_document := pg_catalog.to_tsvector(
    'pg_catalog.simple'::pg_catalog.regconfig,
    coalesce(new.title, '') || ' ' ||
    coalesce(new.company_name, '') || ' ' ||
    coalesce(new.department, '') || ' ' ||
    coalesce(new.location, '') || ' ' ||
    coalesce(new.experience_label, '') || ' ' ||
    coalesce(pg_catalog.array_to_string(new.skills, ' '), '')
  );
  return new;
end;
$$;

revoke all on function public.jobkhoj_set_job_search_document() from public, anon, authenticated;

create trigger jobs_search_document
  before insert or update on public.jobs
  for each row execute function public.jobkhoj_set_job_search_document();

create function public.jobkhoj_bind_job_owner_company()
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

  if recruiter.id is null or recruiter.role <> 'RECRUITER' then
    raise exception 'Only recruiters can manage jobs.';
  end if;

  new.owner_id = recruiter.id;
  new.company_name = coalesce(nullif(btrim(new.company_name), ''), recruiter.company_name);
  if new.company_name is null or length(new.company_name) > 120 then
    raise exception 'Enter a company name of 1 to 120 characters.';
  end if;
  if new.status = 'Active' and not new.company_authorized then
    raise exception 'Confirm authorization to recruit for this company before publishing.';
  end if;
  new.company_id = case
    when recruiter.company_name is not null
      and lower(new.company_name) = lower(recruiter.company_name)
      then recruiter.company_id
    else null
  end;
  return new;
end;
$$;

revoke all on function public.jobkhoj_bind_job_owner_company() from public, anon, authenticated;

create trigger jobs_bind_owner_company
  before insert or update of owner_id, company_id, company_name on public.jobs
  for each row execute function public.jobkhoj_bind_job_owner_company();

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

do $auth_trigger$
begin
  if not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created_jobkhoj'
      and not tgisinternal
  ) then
    execute $trigger$
      create trigger on_auth_user_created_jobkhoj
      after insert on auth.users
      for each row execute function public.create_profile_for_auth_user()
    $trigger$;
  end if;
end;
$auth_trigger$;

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, company_name, company_size) on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users can update editable profile fields"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.jobs from anon, authenticated;
grant select (
  id,
  company_id,
  company_name,
  company_authorized,
  application_url,
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
  company_name,
  company_authorized,
  application_url,
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
  company_name,
  company_authorized,
  application_url,
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

create policy "Public can read published jobs"
  on public.jobs for select to anon, authenticated
  using (status = 'Active' and (deadline is null or deadline >= current_date));

create policy "Owners can read their jobs"
  on public.jobs for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Recruiters can create their own jobs"
  on public.jobs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
        and (jobs.status <> 'Active' or jobs.company_authorized)
    )
  );

create policy "Recruiters can update their own jobs"
  on public.jobs for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
    )
    and length(btrim(company_name)) between 1 and 120
    and (jobs.status <> 'Active' or jobs.company_authorized)
  );

create policy "Recruiters can delete their own jobs"
  on public.jobs for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'RECRUITER'
    )
  );

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
 