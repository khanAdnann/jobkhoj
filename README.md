# jobkhoj

## Supabase setup

Supabase job persistence is enabled when both `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` are set. The browser uses Supabase Auth for the
existing login and registration screens and RLS-protected queries for public
jobs and recruiter job management. The publishable key is intended for browser
use; never place a Supabase service-role key in a `VITE_*` variable.

1. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor.
2. Set the Supabase project's URL and **publishable** key under
   **Project Settings → API Keys**. In local `.env`, map them to:

   ```dotenv
   VITE_SUPABASE_URL=<project URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   ```

   The existing `NEXT_PUBLIC_*` names are not read by Vite. Add these same
   `VITE_*` variables in **Vercel → Project Settings → Environment Variables**
   for each environment you use, then redeploy. Never use a secret/service-role
   key in either variable. Keep existing localStorage records; this integration
   does not delete or import them.
3. In **Authentication → URL Configuration**, allow the production site URL
   and the redirect URLs used by the app, including `/login` and
   `/reset-password`; also allow the local Vite origin during development.
4. Create/sign up the recruiter using the existing registration page, confirm
   the email if Supabase requests it, and sign in.
5. After reviewing the recruiter, find their UUID in **Authentication →
   Users**, then approve their profile in the SQL Editor:

   ```sql
   update public.profiles
   set recruiter_approved = true
   where id = 'AUTH_USER_UUID' and role = 'RECRUITER';
   ```

   This approval field cannot be changed by the browser client.

Public job reads are limited by RLS to active, non-expired listings. Recruiters
can create, edit, and delete only their own jobs after approval. Drafts and
other non-public statuses are visible only to their owner. Until both Supabase
variables are configured, the app retains its existing development/mock
behavior; that mode is not database persistence. Once configured, job requests
use Supabase and surface errors rather than silently falling back to mock data.