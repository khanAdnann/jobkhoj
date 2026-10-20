begin;

alter table public.jobs
  add column if not exists application_url text;

do $constraint$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_application_url_http_check'
  ) then
    alter table public.jobs
      add constraint jobs_application_url_http_check
      check (
        application_url is null
        or (
          length(application_url) <= 2048
          and application_url ~* '^https?://[^[:space:]]+$'
        )
      );
  end if;
end;
$constraint$;

grant select (application_url) on public.jobs to anon, authenticated;
grant insert (application_url) on public.jobs to authenticated;
grant update (application_url) on public.jobs to authenticated;

commit;
