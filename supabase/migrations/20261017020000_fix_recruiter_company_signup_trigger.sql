-- Fix recruiter signup: the profile row must exist before it can be referenced
-- by companies.owner_id. Run this after the portal data migration.
begin;

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

-- Applicant-count and view-count updates are performed by trusted database
-- triggers; they must not be treated as recruiter ownership changes.
drop trigger if exists jobs_bind_owner_company on public.jobs;
create trigger jobs_bind_owner_company
  before insert or update of owner_id, company_id, company_name on public.jobs
  for each row execute function public.jobkhoj_bind_job_owner_company();

commit;
