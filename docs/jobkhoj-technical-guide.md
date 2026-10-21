# JobKhoj: Source-Grounded Technical Guide

**Repository:** `khanAdnann/jobkhoj`  
**Review basis:** checked source, configuration and SQL in this repository; no production database, Vercel project settings, or live traffic were inspected.  
**Purpose:** explain the current implementation for development and interviews. Recommendations are explicitly marked; they are not claims about deployed infrastructure.

## 1. Executive summary

JobKhoj is a JavaScript React single-page application (SPA), built with Vite and deployed as static assets on Vercel. It uses React Router for browser-side routing and Tailwind CSS for styling. In the configured `live` mode, browser code uses Supabase Auth and the Supabase JavaScript client to access PostgreSQL-backed portal data directly. A set of older service modules still expects a separate REST API, but no Spring Boot or other backend source is present in this repository. In `mock` mode, seeded handlers persist records in browser `localStorage`.

The data boundary is consequently split:

```text
Browser SPA
  ├─ Supabase Auth + PostgREST/Storage ──> Supabase PostgreSQL and private file bucket
  ├─ legacy Axios service contracts ─────> separately deployed REST API (not in this repo)
  └─ local engines/mock handlers ────────> browser memory and namespaced localStorage

Vite build ──> dist/ static files ──> Vercel CDN / SPA rewrite
```

| Area | Assessment | Evidence and qualification |
|---|---|---|
| React SPA, routing, responsive UI | Implemented | React 18, React Router 6, Vite 6 and Tailwind CSS 4 in `package.json` and `src/`. |
| Mock data mode | Implemented | Seed data and handlers under `src/mock/`; persistence through `src/utils/storage.js`. |
| Supabase Auth and portal data | Implemented in source | `src/services/supabaseClient.js`, Supabase services and SQL schema/migrations. Whether all migrations are applied in production is **needs verification**. |
| Separate Spring Boot backend | Not present in this repository | Some services document or call REST contracts. No backend source, Dockerfile, or backend build is present. |
| Private seeker/recruiter access | Implemented at two layers | React guards are UX; Supabase RLS, SQL grants, and Storage policies are the data authorization boundary. Verify deployed policy versions. |
| Admin workflow | Disabled in current source | `/admin/*` redirects home; the migration also disables the admin helper and revokes its RPC grants. Legacy admin UI/services remain in the repository. |
| Search and pagination | Implemented | Mock filtering/sorting in JS; live job search, full-text search and offset pagination through Supabase. |
| Sitemap and robots | Implemented as static files/build output | `prebuild` runs `scripts/generate-sitemap.js`; the generator uses mock seed jobs, not live Supabase data. |
| SEO rendering | Partial | Distinct metadata and JobPosting JSON-LD are set by React after load. Vite does not server-render route HTML. |
| Automated validation | Partial | `npm run smoke`, `npm run lint`, and `npm run build` exist. No standalone unit/component/E2E test framework was found. |
| Production operations | Needs verification | Vercel environment variables, production Supabase migration state, remote REST API, analytics, and real HTTP responses were not checked. |

## 2. Technology and repository inventory

| Concern | Actual implementation |
|---|---|
| Languages | JavaScript/JSX, SQL, HTML and CSS. No application TypeScript source was found. |
| UI | React 18.3.1, React DOM, functional components and hooks. |
| Routing | React Router DOM 6.28.1 with nested layouts, route parameters, `Navigate`, and protected/role route wrappers. |
| Build/dev server | Vite 6.0.7, `@vitejs/plugin-react`, Vite Tailwind plugin; `@` aliases to `src/`. |
| Styling | Tailwind CSS 4 and project CSS in `src/index.css`. |
| Forms | React Hook Form 7.54.2; inspect each form for actual field-specific validation. |
| Charts | Recharts. |
| Network | `@supabase/supabase-js` for direct Supabase data flows; Axios for remaining REST contracts. |
| File/document tools | `pdf-lib`, `pdfjs-dist`, `mammoth`, `jszip`; tool engines live under `src/tools/engine/`. |
| Authentication | Supabase Auth in live mode; mock/local or REST auth in the other branch. |
| Database/storage | Supabase PostgreSQL, RLS, SQL functions/triggers, and private `jobkhoj-resumes` Storage bucket as defined in SQL. |
| Analytics/ads | `@vercel/analytics/react`, Google AdSense script in `index.html`, and ad-unit scripts loaded from `bicea.org` in job search. |
| Deployment | `vercel.json` rewrites SPA routes to `/index.html`, while excluding API, sitemap, robots and Google verification paths. |
| CI/CD | No tracked GitHub Actions workflow, Dockerfile, or CI pipeline configuration was found. Vercel Git integration is plausible but not verifiable from repository files. |
| Test tooling | Custom Node/esbuild smoke harness, ESLint and Vite build. No Vitest/Jest/Testing Library/Playwright configuration or `*.test.*` files were found. |

### Build scripts

`package.json` defines:

- `npm run dev`: Vite development server (port 5173 by default).
- `npm run build`: runs `prebuild` first, generating `public/sitemap.xml`, then builds to `dist/`.
- `npm run preview`: local preview of the static production build.
- `npm run lint`: ESLint.
- `npm run smoke`: esbuild bundles `scripts/smoke.js` with mock mode and runs it in Node.

The smoke script shims browser storage and directly exercises mock data/service code. It is not a test of live Supabase policies, the separately deployed REST API, production routing, or real browser interactions.

## 3. Architecture and request lifecycle

### Current request/data flow

```text
User action
  ↓
React page/component (props + local useState)
  ↓
Custom hook / event handler
  ├─ useFetch: loading/error/data/refetch and stale-response guard
  └─ useJobFilters: search/filter/sort/page state in the URL
  ↓
Service module (jobService, authService, applicationService, ...)
  ├─ mock mode: handler → seeded data/localStorage
  ├─ live Supabase flow: Supabase JS → PostgREST/Auth/Storage
  └─ legacy live flow: Axios → VITE_API_BASE_URL REST service
  ↓
Supabase RLS/grants/constraints or external API authorization
  ↓
Data result/error → hook/component state → React render
```

There is no mandatory application-server hop for Supabase operations: the browser talks to Supabase using a publishable key and the signed-in user's session. Database policies are therefore essential. A React route guard or hidden button alone does not authorize a database read/write.

### Layer responsibilities

1. **Route/layout layer:** `src/routes/AppRoutes.jsx` maps public, auth, seeker, recruiter and error routes to components; layout routes provide shared chrome.
2. **Page/component layer:** `src/pages/` composes domain UI; `src/components/` contains reusable UI and domain widgets.
3. **State/hooks:** local state is primarily React `useState`; `AuthProvider` exposes a Context; `useFetch` standardizes async state; `useJobFilters` synchronizes search state with URL parameters. There is no Redux/Zustand store.
4. **Service layer:** `src/services/` isolates data operations from pages and maps database rows to UI names.
5. **Provider/persistence layer:** Supabase tables/storage or mock/localStorage; older APIs require an external REST backend.
6. **Trusted policy layer:** SQL RLS, SQL grants, constraints, triggers and Storage policies. In a REST backend deployment, server-side authorization must be implemented by that backend; its code is not in this repository.

### Architecture vocabulary

- **Monolith:** one deployable application containing coupled modules. This codebase is a frontend code repository, not a full-stack monolith containing its database server.
- **Three-tier:** presentation, application/business logic, and data tiers. JobKhoj has a browser presentation tier and hosted data services; some business logic is in client services and some enforcement is in database policies. A separate application tier is absent for Supabase-backed operations.
- **Client-server:** the browser is a client; Supabase Auth/PostgREST/Storage and any REST API are remote servers.
- **Serverless:** Vercel serves static assets from its platform; Supabase is a managed backend service. No custom Vercel Function source was found.
- **Actual design:** static React SPA + managed Supabase backend-as-a-service + mock/localStorage development mode + REST-contract modules that depend on an external backend.

## 4. File map

| Path | Responsibility |
|---|---|
| `src/main.jsx` | React entry point; mounts `StrictMode`, `BrowserRouter`, `App`, analytics and CSS. |
| `src/App.jsx` | App/provider composition and global shell. |
| `src/routes/AppRoutes.jsx` | Actual route table and role wrappers. |
| `src/routes/paths.js` | Shared route constants/builders. |
| `src/routes/ProtectedRoute.jsx`, `RoleRoute.jsx` | Client-side session/role route UX. |
| `src/context/AuthProvider.jsx`, `src/context/authContext.js`, `src/hooks/useAuth.js` | Auth state and actions through React Context. |
| `src/hooks/useFetch.js` | Shared asynchronous data fetching state and stale-response protection. |
| `src/hooks/useJobFilters.js` | Job search URL/state coordination. |
| `src/pages/` | Home, job/company discovery, auth, seeker, recruiter, tools, informational and error screens. |
| `src/components/common/` | Buttons, inputs, forms, modal, table, navigation and other shared UI. |
| `src/components/jobs/` | Job cards, filters, application modal and related widgets. |
| `src/components/seo/PageMetadata.jsx` | Client-side title, description, canonical, robots and selected Open Graph/Twitter tags. |
| `src/utils/jobSeo.js` | Canonical job slug/ID parsing, job indexability and JobPosting JSON-LD data. |
| `src/services/api.js` | Axios base URL, legacy token helpers/interceptors, error normalization, and mock/live dispatcher. |
| `src/services/supabaseClient.js` | Supabase client initialization from Vite environment variables. |
| `src/services/authService.js` | Supabase Auth profile integration and mock/REST auth branches. |
| `src/services/jobService.js`, `supabaseJobs.js` | Mock/live job reads, search, mutations, views and row mapping. |
| `src/services/supabaseApplications.js` | Application reads/writes, pipeline, candidate visibility and short-lived resume links. |
| `src/services/supabaseUsers.js`, `supabaseRecruiter.js`, `supabaseCompanies.js`, `supabaseAdmin.js` | Domain-specific Supabase operations. |
| `src/services/*Service.js` | REST/mock service contracts and tool service boundaries. Some flows have direct Supabase implementations, some still require REST. |
| `src/mock/seed/`, `src/mock/handlers/`, `src/mock/db.js` | Demo data, mock business logic and local persistence. |
| `src/tools/engine/` | Client-side resume/job-description/document engines. |
| `src/utils/storage.js` | JSON localStorage wrapper namespaced under `jobkhoj:`. |
| `supabase/schema.sql` | Guarded first-install SQL for `profiles`, `jobs`, functions, triggers, grants and baseline RLS. |
| `supabase/migrations/` | Additive production schema/policy changes. Apply in timestamp order and verify live state separately. |
| `scripts/generate-sitemap.js` | Build-time static sitemap generation. |
| `scripts/smoke.js` | Node/esbuild mock-mode smoke assertions. |
| `index.html`, `vite.config.js`, `vercel.json` | SPA shell, build configuration and Vercel rewrite. |
| `public/robots.txt`, `public/sitemap.xml`, `public/google2f322d709b9d1144.html` | Static crawler and ownership-verification resources. |

## 5. Routes and feature inventory

The authoritative route list is `src/routes/AppRoutes.jsx`. Route existence does not by itself mean a page is public or indexable.

| Route group | Routes / behavior | Data/auth status |
|---|---|---|
| Public | `/`, `/jobs`, eight fixed `/jobs/<category>-jobs` routes, `/jobs/:id`, `/companies`, `/companies/:slug`, `/about`, `/contact`, `/privacy-policy`, `/terms`, `/help` | Public shell. Job reads are limited to active, non-expired jobs in Supabase RLS. |
| Career tools | `/tools` plus ATS checker, resume builder/optimizer, keyword extractor, skill gap, job match, JD analyzer, salary estimator, PDF converters, cover letter, interview questions, experience/notice calculators and history | Several local engines; some service wrappers call REST in live mode. Usage/history/saved tool results use localStorage. |
| Authentication | `/login`, `/register`, `/forgot-password`, `/reset-password` | Supabase Auth in live mode; mock/legacy REST otherwise. Registration can select seeker or recruiter. |
| Seeker | `/dashboard`, profile, resume, applications, application detail, saved jobs, job alerts, notifications, settings | `ProtectedRoute`; live access additionally depends on RLS/Storage policies. |
| Recruiter | `/recruiter` redirect and dashboard, company, jobs, create/edit/detail, applicants, applicant detail, candidates, analytics, settings | `RoleRoute` for `RECRUITER`; database policies restrict owner/job/application/resume access. |
| Admin | `/admin/*` | Current route redirects to `/`. Legacy admin screens/services/schema definitions remain; SQL migration disables admin authorization. Do not claim admin moderation is live. |
| Errors | `/403`, wildcard `*` | Client screens. With SPA rewrite, unknown browser routes can still receive the static shell's HTTP 200 (soft 404); confirm actual Vercel status handling. |

### User-facing feature flows

#### Home and discovery

`src/pages/Home.jsx` calls `getFeaturedJobs(6)` and `getTopCompanies(6)` through `useFetch`; it renders job cards, skill shortcuts, company cards and navigation to `/jobs`. Featured job selection is randomized from active/eligible candidates. Homepage links are a principal crawlable path into the jobs listing.

#### Search, filter and paginate

`src/pages/jobs/JobSearch.jsx` obtains query/filter/sort/page state from `useJobFilters`, calls `listJobs({ filters, sort, page, pageSize: 12 })` with `useFetch`, and renders skeleton, error, empty and result states. Saved IDs are loaded in one request, not one per card.

- Mock mode: `src/mock/handlers/query.js` normalizes text, AND-matches words across title/company/location/department/experience/skills, applies exact filters and salary overlap, sorts (newest default), then paginates.
- Live mode: `src/services/supabaseJobs.js` filters `status = Active`, excludes expired deadlines, applies exact/in-list/array/text search and salary/date filters, sorts by selected fields, and uses Supabase `.range()` with exact count. Full-text search uses the database `search_document` vector.
- Search/filter query parameters are user state, not separate indexable landing pages. `PageMetadata` canonicalizes the listing path without query filters.

#### Public job detail and apply

`src/pages/jobs/JobDetails.jsx` reads the route parameter, extracts the actual job ID from a descriptive slug, loads job and similar jobs, tracks a view, and redirects to the canonical title/company/location URL. It sets per-job title/description/canonical/robots metadata and emits JobPosting JSON-LD only when the job is considered public and has required structured fields.

`src/components/jobs/JobCard.jsx` links using `getJobDetailsPath(job)` and shows company, location, work mode, employment type, experience, salary, skills and posted time. Job details link back to search and related jobs, creating internal crawl paths.

Application route: unauthenticated users are sent to login; eligible seekers submit through `ApplyModal`; the Supabase implementation loads the seeker's profile and inserts a `job_applications` row. A unique `(job_id, applicant_id)` constraint prevents duplicate applications. When the recruiter supplied an application URL, the job detail page provides an external link validated to HTTP(S), opened with `noopener noreferrer`; otherwise the in-app apply flow is used.

#### Identity and account recovery

`Register.jsx` uses React Hook Form, validates matching passwords in the page, and lets a user choose seeker/recruiter. In Supabase mode `authService.register` calls `supabase.auth.signUp`, sends profile metadata and may require email confirmation. A database trigger creates the associated `profiles` row. Login/password reset/logout use Supabase Auth when configured. The `AuthProvider` restores Supabase identity at startup; mock/legacy mode uses cached user/token data and validates the session in the background.

#### Seeker workspace

Profile editing, private resume management, applications, saved jobs, job alerts and settings are represented by routes under `/dashboard`. Supabase operations use `profiles`, `job_applications`, `saved_jobs`, `job_alerts` and private Storage. Resume downloads use short-lived signed URLs; RLS limits recruiters to files attached to applications for jobs they own. Tool preferences/history/usage are different: those are browser-local, not persistent server-side subscription controls.

#### Recruiter workspace

Active recruiter accounts can create/edit/close jobs and manage applicants. The recruiter job form supports per-job company name and optional external apply URL. The database trigger binds the owner/company identity from the signed-in profile; RLS scopes updates/deletes to owned jobs. Applicant stages are updated through `job_applications`; recruiter access is constrained to applications belonging to owned jobs. Candidate search reads the recruiter-scoped public profile view.

Recruiter approval is no longer required by the latest migration. Job publication eligibility still depends on active role/status, required company name and row policies. Company authorization checkbox means recruiter attestation; it is not independent verification.

#### Company and informational pages

Company directory/detail pages use company services and show company facts/open jobs. Supabase only exposes verified companies publicly; owners/recruiters have separate visibility/update paths. About, contact, help, privacy and terms routes are content pages. Confirm contact form delivery behavior in the UI/service before describing it as a working email integration; Vercel itself does not automatically send mail.

#### Career tools

The route table exposes 23 tool paths. `src/tools/engine/` includes deterministic local analysis/conversion engines. ATS checking extracts resume text in the browser and scores via `src/tools/engine/ats.js` in mock mode; related job-description and matching services likewise have local code. Some `src/services/*` wrappers call REST endpoints in live mode and do not silently fall back to mock after a live error. File tools use `pdf-lib`, `pdfjs-dist`, `mammoth` and `jszip`.

Tool history, saved results and free-run counters are stored in browser localStorage. A user can clear or edit this storage; it is a UX limit, not a trusted billing/abuse control. The repository does not contain an AI model service or subscription backend.

## 6. Important React implementation walkthroughs

### Shared fetch state: `src/hooks/useFetch.js`

```js
const { data, loading, error, refetch } = useFetch(
  () => listJobs({ filters, sort, page, pageSize: PAGE_SIZE }),
  [JSON.stringify(filters), sort, page],
)
```

1. The callback is the data operation; the dependency list re-runs it when search inputs change.
2. `useFetch` keeps data/loading/error/refetching in component hook state.
3. A monotonically increasing request ID means a slower prior request cannot overwrite a newer search result.
4. Errors are stored and rendered explicitly by the page; retries call `refetch`.
5. It does not cancel the network request itself; it ignores stale/unmounted responses.

### URL-backed filters

The search page passes normalized filter state to `listJobs`; the hook owns synchronization with `URLSearchParams`. The URL makes search state shareable and browser navigation useful. Canonical metadata deliberately does not create separate canonicals for every filter query, reducing duplicate search URLs.

### Auth Context

`AuthProvider` stores the current app user, initialization state, and login/register/logout/refresh operations. `useAuth` reads the context and throws if called outside the provider. `hasRole` is a UI helper; it is not a substitute for SQL policy enforcement.

### Job item lists

`JobCard` receives a job object as a prop and maps `job.skills` with a stable `skill` key. The job title anchor links to a canonical descriptive URL; nested save/company actions use elevated stacking/handlers to keep card link behavior from swallowing them.

## 7. Database and Supabase

### What Supabase is in this application

Supabase is the hosted backend platform used here: Auth manages identities/sessions; its client exposes PostgreSQL through PostgREST; Storage holds private resume files; SQL functions/triggers and RLS are the trusted data rules. A `VITE_SUPABASE_PUBLISHABLE_KEY` is expected to be visible in browser bundles; it is not a server secret. Never use a service-role/secret key in a `VITE_*` variable.

### Entity relationship diagram

```text
auth.users
   1 ───── 0..1 profiles (profiles.id references auth.users.id, cascade)
                 │
                 ├── 1 ───── 0..* jobs (jobs.owner_id → profiles.id, cascade)
                 │                 │
                 │                 └── 1 ───── 0..* job_applications
                 │                                  (job_id → jobs.id, cascade)
                 ├── 1 ───── 0..* job_applications
                 │                 (applicant_id → profiles.id, cascade)
                 ├── 1 ───── 0..* saved_jobs (user_id → profiles.id, cascade)
                 ├── 1 ───── 0..* job_alerts (user_id → profiles.id, cascade)
                 └── 1 ───── 0..* companies (owner_id → profiles.id, SET NULL)

companies.id is TEXT. profiles.company_id and jobs.company_id are TEXT values,
not declared foreign keys. Job company names can intentionally differ per post.
Resume files are Storage objects, referenced by profile.resume_path and
job_applications.resume_path; Storage policies protect object access.
```

### Tables and key fields

| Table | Purpose and representative data | Keys, constraints and access |
|---|---|---|
| `profiles` | Auth-linked role, name, contact, company, seeker bio/skills/experience/education/projects/certifications/social, privacy flag, status and resume metadata. | `id` UUID references `auth.users`; role/status checks; unique lowercased email index; self-read/update policies; sensitive profile data is not granted to anon. Public candidate view exposes a selected subset to active recruiters when `public_profile` is true. |
| `jobs` | Listings, company/title/location/mode/type, experience, salary, skills, description arrays, openings, feature/status, dates, view/applicant counts, search vector. | UUID PK; `owner_id` FK to profiles; length/range/status checks; public `(status, deadline, posted_at)` and owner/date indexes; GIN full-text index. `company_id` has no FK. RLS exposes active/non-expired listings and separately owned rows. |
| `companies` | Directory/profile, website, location, size, verification, benefits/social and owner. | Text PK, unique slug and case-insensitive name index; `owner_id` FK `SET NULL`; only verified rows public by policy; active owner can update allowed columns. |
| `job_applications` | Candidate snapshot, job/applicant IDs, resume path/name, cover letter, expected salary, notice period, application status/stage/timeline/dates. | UUID PK; job/profile FKs cascade; unique `(job_id, applicant_id)` prevents duplicate; indexes on applicant/recent and job/stage/recent. Applicant reads own; recruiter reads/updates only owned-job applications. |
| `saved_jobs` | Per-user saved listing association. | UUID PK; FKs to profile/job cascade; unique `(user_id, job_id)`; user-scoped RLS and recent index. |
| `job_alerts` | User-owned keywords/location/experience/department/frequency/active/match count. | UUID PK; user FK cascade; name/frequency/count checks; user-scoped RLS and user/date index. Stored alert rules do not prove that a delivery scheduler/email service exists. |
| Supabase Storage `jobkhoj-resumes` | Resume document objects, private bucket with 5 MB limit and PDF/DOC/DOCX MIME allowlist. | Object key starts with user UUID; own-user read/write; recruiter read only for owned applications; restrictive policies prevent public/anon reads. |

Other schema objects include a `public_candidate_profiles` view, SQL triggers for profile creation, updated timestamps, job search vector, owner/company binding, application preparation/counting, and a job-view RPC. In the current admin-disable migration, the admin predicate always returns false and admin grants are revoked.

### SQL and performance concepts in context

- **Primary/foreign keys:** enforce identity and referential integrity. `ON DELETE CASCADE` removes child rows with a deleted profile/job; company owner uses `SET NULL`.
- **Unique/check/not-null:** reject duplicate applications/saves and invalid enum/range/length values independently of browser validation.
- **Indexing:** B-tree indexes support status/deadline/posted ordering and per-user/job history; GIN supports `tsvector` full-text search. Indexes have write/storage costs and need query-plan measurement.
- **Search:** `search_document` is built by a database trigger from title/company/department/location/experience/skills. Live query uses `textSearch(... type: 'websearch', config: 'simple')`.
- **Pagination:** `.range(start,end)` is offset pagination with exact count. Deep offsets can get expensive at large scale; keyset pagination is a future option.
- **Transactions:** migrations explicitly use `begin`/`commit`; trigger-backed writes execute within the underlying SQL statement transaction. Client sequences across multiple requests are not automatically one transaction.
- **Normalization:** identities, jobs, companies, applications and saved relations are separate. Some company name/ID and job application snapshot fields are intentionally denormalized. `company_id` text columns do not have FK guarantees.

### RLS summary and production dependency

The SQL source enables RLS on profiles, jobs, companies, applications, saved jobs and alerts. The intended controls are: public read of published jobs/verified companies; own profile, saves and alerts; applicants own their applications; recruiters own jobs and access applications for those jobs; candidate public-view rows only for authenticated active recruiters who meet the view predicate; resumes private to owner and the relevant job recruiter. The public client is not a trusted authorization layer—RLS and SQL grants are.

**Production caveat:** source SQL cannot prove what is installed remotely. In particular, the external application URL migration adds `jobs.application_url`, which the live client selects. If production reports PostgreSQL `42703` for that column, apply `supabase/migrations/20261019010000_add_external_job_application_url.sql` to the exact Supabase project configured in Vercel, then verify schema and the live job read. Do not rerun the first-install `schema.sql` against an existing installation.

## 8. Authentication and authorization flow

```text
Register page
  → AuthProvider.register
  → authService.register
  → Supabase Auth signUp(email, password, profile metadata)
  → auth.users insert
  → SQL trigger creates profiles row
  → email confirmation may be required

App reload
  → AuthProvider startup effect
  → supabase.auth.getUser()
  → authService maps profile row to app-user shape
  → Context user/initialising state
  → ProtectedRoute/RoleRoute decide client navigation
  → Supabase sends session identity to PostgREST
  → RLS/grants decide database access
```

Mock/legacy mode differs: the namespaced localStorage wrapper stores a user/token for demo or REST flows; Axios attaches a bearer token; a 401 clears legacy token state and invokes subscribers. In Supabase mode, `@supabase/supabase-js` handles persistent session/refresh and the app maps `auth.users` plus `profiles`.

Authentication answers **who is signed in**. Authorization answers **what that identity may do**. React route wrappers improve UX but are client-controlled. Database policies enforce job, application, profile, company and Storage boundaries for direct Supabase calls. For legacy REST paths, server-side enforcement must exist in the external service; this repository cannot demonstrate it.

## 9. API and data-operation reference

### Direct Supabase operations in source

| Domain | Operations / principal tables | Access enforcement |
|---|---|---|
| Identity | Supabase Auth sign-up, sign-in, sign-out, get user, password/email reset/update; profile lookup/update | Auth session + profiles grants/RLS; signup trigger. |
| Jobs | `jobs` select/insert/update/delete; filters/count/range; view-count RPC `jobkhoj_increment_job_view` | Published/owner read rules, active recruiter/owner write rules, SQL checks/triggers. |
| Companies | `companies` and related job/profile lookups; verification RPCs remain in source | Public verified read and owner policies; admin authorization disabled in latest migration. |
| Applications | `job_applications` select/insert/update stage; joins to jobs; `profiles` for application prefill | Applicant/owned-job RLS; duplicate uniqueness; stage validation in service. |
| Saved jobs and alerts | `saved_jobs`, `job_alerts` CRUD | User ID filtered in query and enforced by RLS. |
| Resumes | `profiles` resume metadata and private Storage upload/remove/signed URL | Own folder + recruiter-owned application Storage policies; five-minute signed links. |
| Candidate search | `public_candidate_profiles` view; applications query for visible candidate | Authenticated active recruiter view predicate plus application RLS. |

### REST contracts that need an external backend

`src/services/api.js` uses `VITE_API_BASE_URL` (default `http://localhost:8080/api`) and Axios. In `live` mode, `request(liveCall, mockCall)` calls the live function and rethrows errors; it does not fall back to mock data. Service code references these paths:

| Domain | Path patterns found | Important limit |
|---|---|---|
| Legacy auth/user | `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`, `/auth/reset-password`, `/users/me`, `/users/me/password`, resume endpoints | Supabase branches cover several core auth/profile/resume flows; legacy branches still exist. |
| Applications/candidates | `/applications`, `/applications/stats`, `/applications/:id`, `/jobs/:id/applicants`, `/jobs/:id/pipeline`, `/applications/:id/{stage,shortlist,reject,hire}`, `/candidates` | Supabase implementation exists for core application/candidate operations. |
| Company/recruiter | `/companies`, `/companies/:id`, `/companies/top`, `/companies/me`, `/recruiter/profile`, `/recruiter/dashboard`, `/recruiter/analytics` | Many have Supabase alternatives; inspect specific service dispatch before assuming a REST request is used. |
| Admin | `/admin/...` | Legacy service contracts; route and SQL authorization are currently disabled. |
| Notifications | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` | Mock or external REST contract; no notifications table was found in the Supabase schema. |
| Career tools | `/tools/ats/analyze`, `/tools/jd/*`, `/tools/salary/*`, `/tools/interview/*`, `/api/tools/documents/*` | Some local deterministic engines exist; live mode requires an API. Verify configured URL and endpoint-prefix conventions. |

**Backend status:** no controllers, Spring Boot project, serverless functions or endpoint deployment are included here. `documentService.js` documents a Spring Boot-shaped future contract; that is not evidence a backend exists. Also check the document-service paths, which include an `/api/` prefix while the default Axios base URL already ends in `/api`; normalize and integration-test this contract before deploying a backend.

### Useful HTTP concepts

GET reads, POST creates/actions, PUT replaces/updates a resource, PATCH updates selected fields, DELETE removes. JSON is serialized in request/response bodies; status codes communicate success/auth/validation/server errors. CORS is controlled by the API provider, not Axios. Idempotency is operation-specific: a unique application constraint prevents duplicate applicant/job rows, but arbitrary POST actions need an idempotency strategy if retries can repeat side effects. No application-level rate limiter is present in this repository.

## 10. Search, performance and resilience

- Live search is database-side; mock search is browser-side. Both default to newest-first and support multi-criteria filtering/pagination.
- `useFetch` prevents stale responses overwriting fresh results but does not debounce input or abort in-flight requests. Inspect `useJobFilters`/toolbar before claiming a debounce.
- Supabase queries use exact counts and offsets; facets may add another call. This is acceptable for moderate catalogs but should be measured with real query plans.
- Similar jobs in the live service fetch a bounded candidate set (up to 100) and score skill/department/location/experience overlap in the browser.
- Skeleton, empty and retryable error states are implemented in discovery screens. Saved-job indicator failures are intentionally non-fatal.
- Vite config splits React/router and Recharts chunks; build disables sourcemaps.
- At larger scale, first measure API latency, query plans, bundle size and Core Web Vitals. Consider keyset pagination, cached public read models and server rendering only when measurements/search requirements justify them.

## 11. SEO, analytics and indexability

### Present

- `index.html` has generic root title/description, Open Graph defaults, a default image and Twitter summary card.
- `PageMetadata.jsx` updates title, description, robots, canonical, `og:title`, `og:description`, `og:url`, and Twitter title/description in a React effect.
- `jobSeo.js` creates descriptive job URLs and JobPosting JSON-LD only when the job is active, within deadline, and required fields exist. JSON is escaped for safe insertion into a script element.
- Job detail page canonical redirects a valid legacy/ID form to the descriptive path. Closed/expired jobs are marked `noindex`.
- Category pages are marked `noindex` when successfully loaded with zero matches.
- `public/robots.txt` allows all and points to the production sitemap. Google verification file is present under `public/` and Vercel rewrite excludes it.
- `scripts/generate-sitemap.js` runs during `prebuild` and emits absolute HTTPS URLs.
- Analytics package is mounted in `RouteAnalytics.jsx`; AdSense loads from the root HTML and job listing injects third-party ad scripts.

### SEO limitations to understand

1. **Client rendering:** route-specific metadata, job content and JSON-LD are installed after JavaScript runs. Raw `index.html` has only generic root metadata and no server-rendered job body. Google can render JS, but discovery/snippet freshness is less deterministic than SSR/prerender.
2. **Sitemap is seed-based:** generator imports `src/mock/seed/jobs.js`, then appends routes for the seed jobs except a fixed ID exclusion list. It does not query the live Supabase database or test HTTP status; new production jobs are not automatically added. It also does not check each seed job's status/deadline in the filtering expression. Verify current seeds and replace this with a trusted dynamic sitemap/periodic build feed before describing it as a complete production inventory.
3. **Static URL inventory:** category/static paths are hard-coded; company details and career-tool paths are not listed. Only include them if they are genuinely public, useful and canonical; do not add thin/empty/filter pages indiscriminately.
4. **HTTP soft 404:** Vercel sends unmatched non-excluded paths to `index.html`. React can show `NotFound`, but the static host may respond HTTP 200. A crawler may classify this as soft 404. Verify actual HTTP status and consider a routing/render strategy for true not-found status.
5. **Per-route social tags:** `PageMetadata` does not update `og:image`, `og:type`, or `twitter:card`; social crawlers may see generic root tags.
6. **Freshness/removal:** sitemap entries must be reconciled when jobs close/expire/delete. Job pages return a noindex UI for ineligible records only after app JavaScript/data load; the sitemap does not currently synchronize with that status.

No Google indexing or ranking result is guaranteed. Production sitemap fetchability and Search Console state need production-side verification.

## 12. Vercel deployment and operational flow

1. Developer changes code and commits/pushes to the connected Git repository (repository files do not prove the Vercel Git integration settings).
2. Vercel installs dependencies and runs the configured build command; `prebuild` generates `public/sitemap.xml`, then Vite emits `dist/`.
3. Vercel serves static assets. `vercel.json` rewrites non-API/non-sitemap/non-robots/non-verification routes to `/index.html` for React Router refreshes.
4. Vite environment values are embedded during build. `VITE_API_MODE=live` requires Supabase URL and publishable key; never expose a service-role secret. Add variables separately to the intended Vercel environments and rebuild after changing them.
5. Browser calls Supabase directly for implemented domains; remaining live REST flows require a reachable `VITE_API_BASE_URL`.

No production environment values, domain control panel, GitHub workflow, rollback procedure, or Vercel deployment logs were inspected. The existence of `vercel.json` supports Vercel routing; it does not prove production variables or migration state. For local verification use `npm run build` then `npm run preview` and request sitemap/robots/verification assets from the preview server. Avoid claiming production HTTP 200 based only on local source.

## 13. System design and evolution

### Functional/non-functional requirements reflected in the code

Functional: discover/filter jobs; job details/apply; seeker profiles/resumes/saves/alerts; recruiter job management and applicant pipeline; company profiles; local career tools. Non-functional: role separation, private resume storage, accessible loading/error states, responsive design, crawlable public route paths, and bounded paginated queries.

### Current scaling characteristics

The SPA can be served through a CDN. Supabase provides the relational data/API layer. Search and counts currently query PostgreSQL directly; the frontend owns some scoring/filter orchestration. Offset pagination, exact counts, broad candidate-profile searches and data fetching from the browser become candidates for measurement as the catalog grows. No cache, search service, queue, or separate server-side app is in the repository.

### Growth stages (qualitative; no traffic or capacity claims)

| Stage | Keep/change |
|---|---|
| Small portal | Current SPA + Supabase is operationally simple. Keep RLS, backups, migrations, monitoring and query/index review. |
| 10k daily users | Measure real query/egress and auth/storage usage; cache public read paths where safe; add pagination and abuse controls; decide which REST-backed tools need a server. Do not assume a specific instance size without workload data. |
| 100k daily users | Move expensive search/aggregations and sensitive business operations to a trusted service/API where policy, quotas and observability are centralized; add CDN caching for immutable/public content and background jobs for alerts. |
| 1M daily users | Evaluate managed search/read replicas, partitioning only if measurements require, queues for email/analytics, and a BFF/API boundary. Define SLOs, capacity tests, recovery objectives and data retention before adding infrastructure. |

### Future Spring Boot option (proposed, not current)

```text
React SPA → Spring Boot API (JWT/session verification, validation, rate limits)
          → PostgreSQL/Supabase DB (least-privileged DB role/RLS retained)
          → private object storage, email provider, background workers
```

Migration sequence: inventory each service contract; define DTOs and stable error schemas; implement server-side identity/role/ownership checks; add integration tests; migrate one domain at a time (e.g. notifications or application workflows); avoid service-role credentials in the browser; compare behavior against current Supabase operations; then switch environment per domain with rollback.

## 14. Gaps and recommended next steps

1. Replace the sitemap's seed/static list with production-eligible job data or a controlled feed; verify status/deadline and canonical route for each URL.
2. Decide on SSR/prerender for SEO-critical job pages; ensure true 404/410 behavior for missing/closed jobs.
3. Verify production Supabase schema, especially the `application_url` migration and all security migrations.
4. Decide whether recruiter discovery of candidate profiles is opt-in. The current database migration defaults `public_profile` to true, and the UI exposes a toggle; align default and consent language with privacy policy.
5. Replace project-specific values in tracked `.env.example` with placeholders. Its Supabase key type is publishable by design, but do not place a service-role/secret key there. The ignored local `.env` was not inspected.
6. Add independent component/integration/browser tests for live flows and RLS; the current smoke harness is primarily mock-mode.
7. Add abuse controls (signup/job-post rate limits, verification/moderation policy) at a trusted server/provider layer.
8. Audit third-party ad scripts and define CSP/security headers that are compatible with required providers.
9. Confirm legacy REST backend presence, endpoint base/prefix conventions, CORS, server-side auth, rate limits and deployment. In the absence of `VITE_API_BASE_URL`, the client default points at localhost.
10. Add automated migration-state checks and a safe staged migration/recovery process; do not run first-install SQL against existing production tables.

## 15. Hinglish checkpoint

**Simple samajh:** JobKhoj ka UI React SPA hai. Live mode mein browser kuch data seedha Supabase se leta hai; alag Spring Boot source is repo mein nahi hai. React ke guards sirf screen access ko control karte hain, asli data security SQL RLS policies karti hain. Search database mein live mode par hoti hai, mock mode mein JavaScript/localStorage par. Sitemap build time par mock seed se banti hai, isliye live naye jobs ka automatic sitemap mein aana abhi guaranteed nahi.

**Interview mein yaad rakhein:** jo cheez repo mein sirf API contract ya README mein likhi hai usse deployed backend mat batayein. Production DB migrations, Vercel variables, actual sitemap response, and traffic metrics ko separately verify karna hoga.
