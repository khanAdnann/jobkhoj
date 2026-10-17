-- Keep job ownership binding limited to insert and ownership/company changes.
-- Application submissions update applicant_count through a SECURITY DEFINER
-- trigger; that counter update must not require the applicant to be a recruiter.
begin;

drop trigger if exists jobs_bind_owner_company on public.jobs;
create trigger jobs_bind_owner_company
  before insert or update of owner_id, company_id, company_name on public.jobs
  for each row execute function public.jobkhoj_bind_job_owner_company();

commit;
