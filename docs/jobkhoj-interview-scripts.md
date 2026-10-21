# JobKhoj Interview Scripts

These are grounded in the repository, not a claim about individual ownership, team size, business impact, or traffic. Replace the contribution wording with what you personally did and can defend.

## 30-second introduction

“JobKhoj is a React 18 job portal built with Vite, React Router and Tailwind. It supports public job discovery, recruiter job management, seeker applications and profiles, and career-preparation tools. In its live data path, the browser uses Supabase Auth and PostgreSQL through RLS-protected Supabase services; a mock mode uses seeded localStorage data. Some older services still expect an external REST backend, so I distinguish those contracts from the Supabase flows actually present in the repository.”

## 1-minute project explanation

“The UI is a Vite-built React SPA with public, seeker and recruiter route groups. Job search state is reflected in the URL, and the shared `useFetch` hook manages loading, errors, retries and stale responses. The job service selects either mock handlers or direct Supabase queries. In live mode, Supabase handles auth, jobs, profiles, applications, saved jobs, alerts and private resumes, with RLS and Storage policies enforcing data boundaries. Job search uses database filters, full-text search and offset pagination. The repository has no Spring Boot server source; some legacy services define REST contracts and need a separately deployed API. SEO metadata and job schema are client-rendered, while the current sitemap is generated from mock seed data, which is an area to improve for production discovery.”

## 3-minute detailed explanation

“JobKhoj is organized by route, UI, hook, service and data-provider concerns. `src/main.jsx` mounts React with `BrowserRouter`; `AppRoutes.jsx` defines public routes, protected seeker routes, recruiter-only routes and a disabled admin redirect. The UI uses functional components, Context for authentication, React Hook Form for forms and reusable components for job cards, filters, modals and layouts.

“For a listing, the search page gets filter/sort/page values from `useJobFilters`, invokes `listJobs` through `useFetch`, then renders skeleton, error, empty or result UI. Mock mode runs matching and pagination in JavaScript over seeded localStorage data. Live mode asks Supabase for active, unexpired listings, applies filters and full-text search, orders by the selected sort, and uses range pagination with an exact count. The service maps snake_case database rows into UI-shaped objects.

“For an application, the seeker signs in through Supabase Auth, completes the application modal, and the service writes a `job_applications` row with the profile and resume reference. SQL RLS checks the applicant identity and job status; a unique job/applicant constraint prevents duplicates. Recruiter queries are restricted to their own job rows and applications. Resumes are stored in a private bucket and short-lived signed URLs are created only when Storage policy permits.

“Vercel serves static assets and rewrites application paths to the SPA shell. The build creates a sitemap, but the generator currently reads mock seed jobs rather than production DB state. React sets job-specific metadata and JobPosting JSON-LD after client rendering, so SSR/prerender and dynamic production sitemap generation are clear SEO improvements. Validation currently consists of a custom mock smoke suite, ESLint and Vite build; those do not replace live RLS or browser E2E testing.”

## 5-minute architecture walkthrough

1. **Entry/routing:** `src/main.jsx` mounts `StrictMode`, `BrowserRouter`, `App` and Vercel Analytics. `src/routes/AppRoutes.jsx` maps layouts and route groups. `vercel.json` supports direct route refreshes by rewriting app paths to `index.html`.
2. **Identity:** `AuthProvider` exposes auth state and methods via Context. In live mode, `authService` uses Supabase Auth and maps the Auth user to `profiles`. In mock/legacy mode, the service uses localStorage or an Axios contract.
3. **Data state:** pages keep transient state locally; `useFetch` centralizes async state; `useJobFilters` keeps discovery controls aligned with URL params.
4. **Service boundary:** pages call domain services, not raw SQL. `jobService` chooses mock or Supabase operations. Supabase services map row shapes and throw explicit errors. Older services may issue Axios requests to `VITE_API_BASE_URL`.
5. **Trusted data security:** the publishable key is expected in the client. SQL RLS, grants, triggers and private Storage policies are the real access controls. React role guards are not security boundaries. A server-role secret must never be bundled.
6. **Search:** live listing filters/sorts/paginates in PostgreSQL via PostgREST; the mock counterpart uses array transformations. Full-text search uses a trigger-maintained `tsvector` and GIN index.
7. **Reliability:** search screens have loading, empty and error/retry states. Live failures are not replaced with mock content. Resume updates are multi-step operations with cleanup if metadata save fails.
8. **Delivery/SEO:** Vite builds static assets; Vercel hosts them. SEO tags update on the client. The static sitemap is generated from mock seed data and is not synchronized with live jobs.
9. **What is not in this architecture:** no Spring Boot source, custom serverless functions, CI workflow, automated browser suite, queue, cache, or managed search service is present in the repository.

## Prepared answers to common questions

### “What was your contribution?”

**Customize this to truth:** “My contribution was building/maintaining [specific areas you personally implemented]. In the code I can walk through [specific component/service/migration], explain the decisions and tests, and distinguish existing Supabase integration from REST contracts that still need an external backend. I would not claim parts I did not personally author.”

### “Why this tech stack?”

“React and React Router fit an interactive multi-role SPA; Vite gives a fast development/build loop; Tailwind lets the existing UI use consistent utility styles; React Hook Form handles multi-field forms; Supabase provides Auth, PostgreSQL, RLS and private Storage without a custom API tier for core portal operations. The trade-off is more responsibility in database policy design and client-side SEO. A separate Spring Boot service would be justified for centralized business workflows, integrations, quotas or server-side rendering needs.”

### “What was the biggest technical challenge?”

“A source-visible challenge is maintaining the same domain behavior across mock and live data paths while avoiding success-shaped mock fallbacks when production requests fail. The service layer and row mappers create that seam. I’d support this answer with the particular bug or change I personally handled rather than inventing an impact metric.”

### “How did you handle security?”

“Supabase Auth identifies the user; SQL RLS and grants authorize database operations; Storage rules protect resumes; unique constraints enforce duplicate-application prevention. React route guards are only UX. I would still verify the deployed migration state, review candidate-profile consent defaults, and add trusted abuse controls. I would never put a service-role key in a Vite variable.”

### “How does database integration work?”

“The Supabase JS client is created from the Vite URL and publishable key. Services query tables and map database rows to UI objects. The application role/session is sent with requests; RLS policies run in PostgreSQL. The job search uses filtered, ordered range queries and exact counts. Migrations define schema evolution, constraints, triggers and policies.”

### “How is it deployed?”

“The repository configures a Vite static build to `dist/`, a prebuild sitemap generator and a Vercel SPA rewrite. The actual Vercel project variables, Git deployment trigger and production database migration state must be checked in the Vercel/Supabase consoles; they cannot be proven from this repo.”

### “How would you scale it?”

“I’d start with measurements: database query plans, API latency, bundle/Core Web Vitals and storage usage. Then improve indexes/pagination/caching where measurements show bottlenecks, add trusted rate limits and move expensive or sensitive workflows behind an API. Queues or a dedicated search engine would be future choices based on requirements, not current components.”

### “Why didn’t you use a Spring Boot backend?”

“The current core live data architecture uses Supabase directly, and no Spring Boot source is in this repository. Some service modules contain Spring Boot-shaped REST contracts, but that does not prove an API is deployed. Direct Supabase reduces backend operations for a small app, but a Spring Boot API could centralize validation, authorization, integrations, email and abuse controls as those needs grow.”

### “What is one SEO limitation?”

“Route-specific metadata and JobPosting JSON-LD are added by React after page load, and the sitemap build script reads local seed jobs instead of production Supabase. I’d align sitemap URLs to active/unexpired canonical DB listings and consider SSR/prerender for job details.”

### “What tests protect the app?”

“The repo has a mock-mode smoke script, ESLint and Vite build. The smoke assertions cover mock handlers and service delegation. It does not test live RLS, deployed Vercel routing or browser workflows. I’d add staging RLS integration tests and a browser suite for seeker/recruiter flows.”

## Defense checklist before an interview

- Be ready to show where the service chooses mock vs Supabase and how errors behave.
- Explain one RLS policy in terms of `auth.uid()` and why a browser guard is insufficient.
- State precisely that no backend source exists here; do not claim deployed Spring Boot without evidence.
- Distinguish stored job alerts from an email/notification scheduler.
- Distinguish localStorage tool usage limits from server-side billing enforcement.
- Verify whether the external job application URL migration is applied to the live project.
- Use your own verified contribution, project ownership, team size and outcomes; this guide cannot infer them.
