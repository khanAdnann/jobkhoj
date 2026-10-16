-- One-time install for a project without these JobKhoj objects. This guard
-- prevents this script from replacing existing tables, functions, or triggers.
begin;

do $preflight$
begin
  if to_regclass('public.profiles') is not null
    or to_regclass('public.jobs') is not null then
    raise exception
      'JobKhoj profiles/jobs already exist. Stop and prepare a migration instead of running this installer.';
  end if;

  if to_regprocedure('public.set_updated_at()') is not null
    or to_regprocedure('public.set_job_search_document()') is not null
    or to_regprocedure('public.bind_job_owner_company()') is not null
    or to_regprocedure('public.create_profile_for_auth_user()') is not null then
    raise exception
      'A JobKhoj trigger function already exists. Inspect it before installing this schema.';
  end if;

  if to_regclass('public.jobs_public_status_deadline_posted_idx') is not null
    or to_regclass('public.jobs_owner_posted_idx') is not null
    or to_regclass('public.jobs_search_document_idx') is not null then
    raise exception
      'A JobKhoj index name already exists. Inspect it before installing this schema.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created_jobkhoj'
      and not tgisinternal
  ) then
    raise exception
      'The JobKhoj auth trigger already exists. Inspect it before installing this schema.';
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

create function public.set_updated_at()
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
  for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create function public.set_job_search_document()
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

revoke all on function public.set_job_search_document() from public, anon, authenticated;

create trigger jobs_search_document
  before insert or update on public.jobs
  for each row execute function public.set_job_search_document();

create function public.bind_job_owner_company()
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

create trigger jobs_bind_owner_company
  before insert or update on public.jobs
  for each row execute function public.bind_job_owner_company();

create function public.create_profile_for_auth_user()
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

create trigger on_auth_user_created_jobkhoj
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

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

create policy "Public can read published jobs"
  on public.jobs for select to anon, authenticated
  using (status = 'Active' and (deadline is null or deadline >= current_date));

create policy "Owners can read their jobs"
  on public.jobs for select to authenticated
  using (owner_id = (select auth.uid()));

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

commit;
 