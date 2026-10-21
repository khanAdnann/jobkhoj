# jobkhoj

## Supabase setup

`VITE_API_MODE=mock` selects the existing localStorage-backed demo mode and
ignores Supabase credentials. `VITE_API_MODE=live` requires both
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and uses Supabase for
Auth, jobs, profiles, applications, saved jobs, alerts, resumes, companies,
recruiter dashboards. Admin tools are temporarily disabled, while the ADMIN
profile role remains supported. Remaining legacy endpoints still
use the configured REST backend; live network failures are shown as errors and
are never replaced with mock data. Never put a Supabase service-role key in a
`VITE_*` variable.

1. Run the entire [`supabase/schema.sql`](./supabase/schema.sql) once in the
   Supabase SQL Editor. It is a guarded first-install script: it aborts if its
   JobKhoj tables, helper functions, indexes, or auth trigger already exist.
   It does not drop or replace existing objects. It creates profiles for new
   Auth signups after installation; it does not backfill existing Supabase
   Auth users or import mock/localStorage users or jobs.
   The job search vector is populated by a trigger (not a generated column),
   avoiding PostgreSQL's immutable-expression restriction on generated
   columns. If an earlier run reported an error before `COMMIT`, check whether
   the tables exist before retrying; the transaction should have rolled back.
   If `public.profiles` and `public.jobs` already exist, **do not rerun that
   first-install script**. Review and run the additive
   [`supabase/migrations/20261017000000_portal_data.sql`](./supabase/migrations/20261017000000_portal_data.sql)
   instead. It adds the portal data tables and columns, RLS policies, private
   resume bucket, and administration functions; it does not create or
   delete existing jobs/profiles tables.
2. Apply the remaining files in [`supabase/migrations/`](./supabase/migrations/)
   in timestamp order through
   [`20261017050000_job_level_company_name.sql`](./supabase/migrations/20261017050000_job_level_company_name.sql).
   This temporarily disables admin authorization, allows active recruiters to
   publish jobs without admin approval, makes existing pending recruiter jobs
   active, and lets recruiters enter the company name for each job. Keep the
   `ADMIN` role and `recruiter_approved` column; neither needs to be removed.
   Active job posts require the recruiter to confirm they are authorized to
   recruit for the named company. Custom names are displayed as recruiter-
   provided and are not independently verified or linked to a verified
   company directory entry. Also apply
   [`20261019010000_add_external_job_application_url.sql`](./supabase/migrations/20261019010000_add_external_job_application_url.sql)
   to let recruiters optionally link directly to an external company or
   LinkedIn job application. Finally, apply
   [`20261021000000_backfill_missing_profiles.sql`](./supabase/migrations/20261021000000_backfill_missing_profiles.sql)
   to create profiles for Auth users who signed up before the profile trigger
   was installed. It is safe to rerun and leaves existing profiles unchanged.
3. Set the Supabase project's URL and **publishable** key under
   **Project Settings → API Keys**. In local `.env`, map them to:

   ```dotenv
   VITE_SUPABASE_URL=<project URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   ```

   The existing `NEXT_PUBLIC_*` names are not read by Vite. Add these same
   `VITE_*` variables in **Vercel → Project Settings → Environment Variables**
   for each environment you use, then redeploy. Set `VITE_API_MODE=live` to
   enable Supabase; `mock` deliberately keeps jobs in browser localStorage.
   Never use a secret/service-role key in either variable. Keep existing localStorage records; this integration
   does not delete or import them. Restart the local Vite server after changing
   `.env`; Vite embeds these values at startup/build time. Rebuild and redeploy
   after changing Vercel environment variables.
3. In **Authentication → URL Configuration**, allow the production site URL
   and the redirect URLs used by the app, including `/login` and
   `/reset-password`; also allow the local Vite origin during development.
4. The seeded demo recruiter is a mock account, not a Supabase Auth user, so
   its demo password cannot authenticate with Supabase. Sign up a real
   recruiter account using the existing registration page, confirm the email
   if Supabase requests it, and sign in. Active recruiter profiles can post
   jobs without a separate admin approval step.
5. If the recruiter already existed in Supabase Auth before this schema was
   installed, the signup trigger did not create their profile retroactively.
   Insert a profile for that specific Auth user:

   ```sql
   insert into public.profiles (id, name, phone, role, company_name, company_size)
   select
     id,
     coalesce(raw_user_meta_data ->> 'name', ''),
     coalesce(raw_user_meta_data ->> 'phone', ''),
     case
       when raw_user_meta_data ->> 'role' = 'RECRUITER' then 'RECRUITER'
       else 'JOB_SEEKER'
     end,
     nullif(raw_user_meta_data ->> 'company_name', ''),
     nullif(raw_user_meta_data ->> 'company_size', '')
   from auth.users
   where id = 'AUTH_USER_UUID'::uuid
   on conflict (id) do nothing;
   ```

In `live` mode, public job reads are limited by RLS to active, non-expired
listings. Active recruiters can manage only their own jobs. Drafts and other
non-public statuses are visible only to their owner. Saved jobs, job
alerts, applications, resumes, and recruiter dashboards require this additive
migration. Resume files are stored in a private bucket; recruiters can receive
short-lived links only for applications to jobs they own. Account deletion is
not available in live mode until a trusted Supabase Edge Function is deployed.
In `mock` mode, records continue to use the browser's local demo data; this
integration does not delete or automatically import those records.