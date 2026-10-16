# jobkhoj

## Supabase setup

`VITE_API_MODE=mock` selects localStorage-backed demo authentication and job
storage. This mode ignores Supabase credentials and saves jobs only in the
current browser. `VITE_API_MODE=live` enables Supabase Auth and jobs when both
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set; other services
may use the configured REST backend. Never put a Supabase service-role key in
a `VITE_*` variable.

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
2. Set the Supabase project's URL and **publishable** key under
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
   if Supabase requests it, and sign in. This creates a profile with approval
   disabled.
5. After reviewing the recruiter, find their UUID in **Authentication →
   Users**, then approve their profile in the SQL Editor:

   ```sql
   update public.profiles
   set recruiter_approved = true
   where id = 'AUTH_USER_UUID' and role = 'RECRUITER';
   ```

   This approval field cannot be changed by the browser client.

   If the recruiter already existed in Supabase Auth before this schema was
   installed, the signup trigger did not create their profile retroactively.
   Insert a profile for that specific Auth user before approving them:

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
listings. Recruiters can manage only their own jobs after approval. Drafts and
other non-public statuses are visible only to their owner. In `mock` mode,
jobs are saved in the browser and are not shared with Supabase or other users.