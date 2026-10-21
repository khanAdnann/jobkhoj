# JobKhoj: 104 Project-Specific Interview Questions and Answers

Answers are deliberately short enough to practice aloud. “Code” is the repository evidence to open during preparation. Follow-up and common-trap notes are included so the answers can be defended rather than memorized. No answer claims unverified traffic, team size, performance results, production settings, or personal ownership.

## A. Project overview and architecture

### Q001. What is JobKhoj?
**Answer:** A React job portal SPA with public discovery, seeker/recruiter workflows and career tools. It is built with React/Vite; the current live data path uses Supabase for core domains. **Code:** `package.json`, `src/routes/AppRoutes.jsx`.  
**Follow-up:** Which feature did you personally implement? **Trap:** Claiming business impact or users without evidence.

### Q002. What architectural style does it use?
**Answer:** A client-server SPA with managed Supabase services and a mock/localStorage mode; it is not a backend monolith in this repository. **Code:** `src/services/jobService.js`, `src/services/supabaseClient.js`.  
**Follow-up:** Which domains still expect REST? **Trap:** Calling service contracts a deployed backend.

### Q003. Is there a Spring Boot backend?
**Answer:** No Spring Boot source/build is in the repository. Some services document/call REST paths designed for a separately deployed API. **Code:** `src/services/api.js`, `src/services/documentService.js`.  
**Follow-up:** What would you move to Spring Boot first? **Trap:** Saying “yes” because Java endpoints appear in comments.

### Q004. Why use a service layer?
**Answer:** Pages call domain functions, while services choose a provider and map data to UI shapes. This isolates components from provider details. **Code:** `src/services/jobService.js`, `src/services/supabaseJobs.js`.  
**Follow-up:** What is the cost? **Trap:** Duplicating business rules across mock and live paths without parity tests.

### Q005. How does mock/live selection work?
**Answer:** `API_MODE` selects mock handlers only when explicitly `mock`; Supabase operations use the direct client in live mode, and `request()` executes the live callback without silent mock fallback. **Code:** `src/services/api.js`.  
**Follow-up:** Why is live-to-mock fallback dangerous? **Trap:** Describing local mock records as production data.

### Q006. Where does business logic reside?
**Answer:** UI flows and provider mapping are in React/services; mock rules are in handlers; data integrity and authorization are in SQL constraints, triggers and RLS. **Code:** `src/mock/handlers/`, `supabase/`.  
**Follow-up:** What logic should move server-side as complexity grows? **Trap:** Assuming all client code is trusted.

### Q007. What is three-tier architecture, and does it apply?
**Answer:** It separates presentation, application and data tiers. JobKhoj has a browser UI and hosted data services, but no separate application-server tier for core Supabase flows. **Code:** `src/services/supabaseClient.js`.  
**Follow-up:** What would a BFF/API tier add? **Trap:** Forcing every project into a classic three-server diagram.

### Q008. What are the main trade-offs?
**Answer:** Supabase accelerates identity/data/storage integration, while browser-direct access demands carefully reviewed RLS; client rendering simplifies SPA deployment but complicates SEO and HTTP not-found statuses. **Code:** SQL policies, `PageMetadata.jsx`, `vercel.json`.  
**Follow-up:** How would SSR change the design? **Trap:** Presenting recommendations as current implementation.

## B. React and frontend

### Q009. What is a functional component?
**Answer:** A JavaScript function that returns React UI and can use hooks. `JobCard` accepts a job prop and returns an article. **Code:** `src/components/jobs/JobCard.jsx`.  
**Follow-up:** How do props differ from state? **Trap:** Calling JSX plain HTML.

### Q010. What is JSX?
**Answer:** Syntax for describing React elements inside JavaScript; Vite's React plugin transforms it for the browser. **Code:** `src/main.jsx`, `vite.config.js`.  
**Follow-up:** How does conditional rendering work? **Trap:** Assuming the browser parses JSX natively.

### Q011. How is shared authentication state provided?
**Answer:** `AuthProvider` stores user/loading/actions in React state and exposes them through `AuthContext`; `useAuth` reads the context. **Code:** `src/context/AuthProvider.jsx`, `src/hooks/useAuth.js`.  
**Follow-up:** What triggers consumers to rerender? **Trap:** Treating Context as a server-side session.

### Q012. What does `useState` do in the app?
**Answer:** It stores component state such as modal visibility, search controls, result data or auth state; state updates schedule rerenders. **Code:** `src/pages/jobs/JobDetails.jsx`.  
**Follow-up:** When should state be lifted? **Trap:** Storing all domain data globally by default.

### Q013. What is `useEffect` used for here?
**Answer:** Synchronizing React with external systems such as data loads, session restore, analytics or view tracking. **Code:** `src/hooks/useFetch.js`, `src/context/AuthProvider.jsx`.  
**Follow-up:** How do you avoid stale async writes? **Trap:** Using effects for every calculation.

### Q014. Why does `JobCard` use list keys?
**Answer:** Keys let React associate list items across updates; skills use the skill string as a stable key. **Code:** `src/components/jobs/JobCard.jsx`.  
**Follow-up:** Why avoid array indexes for reorderable lists? **Trap:** Saying keys are passed as normal props.

### Q015. How are forms managed?
**Answer:** React Hook Form registers fields, handles submit state/errors, and components display validation feedback. **Code:** `src/pages/auth/Register.jsx`, `src/pages/recruiter/JobForm.jsx`.  
**Follow-up:** Which checks must also exist in SQL? **Trap:** Treating browser validation as authoritative.

### Q016. How are loading and errors represented?
**Answer:** `useFetch` returns data/loading/error/refetching; pages choose skeleton, result, empty or retry UI. **Code:** `src/hooks/useFetch.js`, `src/pages/jobs/JobSearch.jsx`.  
**Follow-up:** What happens if two requests resolve out of order? **Trap:** Showing a success-shaped empty list for every failure.

## C. JavaScript

### Q017. Why use `async`/`await`?
**Answer:** It expresses asynchronous service operations in sequential syntax while promises still represent completion/errors. `JobDetails` awaits share/copy and services return promises. **Code:** `src/pages/jobs/JobDetails.jsx`.  
**Follow-up:** Where should a rejection be handled? **Trap:** Thinking `await` makes a request synchronous.

### Q018. What is a closure?
**Answer:** A function retains access to its lexical variables. Event callbacks and effect cleanup functions use values from their component render. **Code:** `src/hooks/useFetch.js`.  
**Follow-up:** How can stale closures happen? **Trap:** Describing closure as a React-only concept.

### Q019. Why use `Set` for saved job IDs?
**Answer:** It gives simple membership checks and add/remove semantics without duplicate IDs. The search page stores a `Set` in state. **Code:** `src/pages/jobs/JobSearch.jsx`.  
**Follow-up:** What update pattern keeps React aware? **Trap:** Mutating the existing Set in place.

### Q020. What is optional chaining used for?
**Answer:** It safely accesses possibly absent nested values, e.g. optional company or query fields. **Code:** `src/services/supabaseJobs.js`.  
**Follow-up:** When should a missing value be validated instead? **Trap:** Using it to silently mask required-data bugs.

### Q021. What does `Object.fromEntries` do in the Supabase mapper?
**Answer:** It constructs an object from key/value pairs; the mapper filters only provided payload fields and maps names to database columns. **Code:** `src/services/supabaseJobs.js`.  
**Follow-up:** Why is this useful for partial updates? **Trap:** Passing every `undefined` property to a write.

### Q022. Why normalize search text?
**Answer:** Consistent casing/whitespace makes matching predictable. Mock query helper lowercases and trims before token matching. **Code:** `src/mock/handlers/query.js`.  
**Follow-up:** How does live text search differ? **Trap:** Assuming browser and database tokenization are identical.

### Q023. What is a promise rejection?
**Answer:** An asynchronous failure represented by a rejected promise; service errors are caught by `useFetch` or page handlers. **Code:** `src/hooks/useFetch.js`.  
**Follow-up:** Why not swallow every error? **Trap:** Converting all errors into empty success results.

### Q024. What is the purpose of `finally`?
**Answer:** Cleanup that runs after either success or failure, such as clearing loading/submitting flags. **Code:** `src/hooks/useFetch.js`, `src/components/jobs/ApplyModal.jsx`.  
**Follow-up:** Does `finally` suppress the error? **Trap:** Forgetting to rethrow after cleanup in a service.

## D. Database and SQL

### Q025. Which database is used?
**Answer:** PostgreSQL managed through Supabase. The schema and migrations define typed tables, constraints, indexes and policies. **Code:** `supabase/schema.sql`.  
**Follow-up:** How does the browser query it? **Trap:** Saying data is stored in React state only.

### Q026. What is a primary key?
**Answer:** A stable unique row identifier. `jobs.id` and `job_applications.id` are UUID primary keys. **Code:** `supabase/schema.sql`, portal migration.  
**Follow-up:** Why use UUIDs? **Trap:** Claiming UUIDs make authorization unnecessary.

### Q027. Explain a foreign key in this project.
**Answer:** `job_applications.job_id` references `jobs.id`, maintaining referential integrity and cascading dependent applications on job deletion. **Code:** `20261017000000_portal_data.sql`.  
**Follow-up:** Which company IDs are not FK-constrained? **Trap:** Assuming matching column names imply a constraint.

### Q028. How is duplicate application prevented?
**Answer:** A unique constraint on `(job_id, applicant_id)` prevents duplicate pairs at the database level. **Code:** `supabase/migrations/20261017000000_portal_data.sql`.  
**Follow-up:** How should the UI handle the constraint error? **Trap:** Relying on a disabled button only.

### Q029. How does full-text search work?
**Answer:** A trigger creates a `tsvector` from job fields; a GIN index supports text queries; Supabase uses `textSearch` with web-search syntax. **Code:** `supabase/schema.sql`, `src/services/supabaseJobs.js`.  
**Follow-up:** What is a GIN index suited for? **Trap:** Calling it fuzzy semantic AI search.

### Q030. Why add indexes?
**Answer:** Indexes accelerate reads/filter/order at a storage and write-maintenance cost. Job status/date, owner/date, application history and full-text indexes are defined. **Code:** SQL schema/migration.  
**Follow-up:** How do you prove an index helps? **Trap:** Adding indexes to every column.

### Q031. How does pagination work?
**Answer:** Live queries use range offsets and exact counts; the UI uses pages of bounded size. **Code:** `src/services/supabaseJobs.js`, `JobSearch.jsx`.  
**Follow-up:** What degrades for deep offsets? **Trap:** Calling this cursor/keyset pagination.

### Q032. What do SQL triggers do here?
**Answer:** They maintain timestamps/search vectors, create profiles after Auth signup, bind job ownership/company data, prepare application rows and update applicant counts. **Code:** `supabase/schema.sql`, migrations.  
**Follow-up:** Why keep business integrity in the DB? **Trap:** Forgetting trigger work is part of write latency/transaction behavior.

## E. Supabase

### Q033. What Supabase services are used?
**Answer:** Auth, PostgreSQL through PostgREST, and Storage for private resumes. **Code:** `src/services/supabaseClient.js`, `supabaseApplications.js`.  
**Follow-up:** Is there a custom Supabase Edge Function in this repo? **Trap:** Assuming every Supabase feature is used.

### Q034. What does the publishable key mean?
**Answer:** It is a client-visible project identifier/key, not a substitute for policies. RLS must constrain every exposed table and bucket. **Code:** `supabaseClient.js`.  
**Follow-up:** Which key must never be bundled? **Trap:** Calling the publishable key a password or using service-role in Vite.

### Q035. What is RLS?
**Answer:** PostgreSQL evaluates row predicates for each role/request; it filters or rejects rows even if callers bypass the React app. **Code:** SQL policies in portal migration.  
**Follow-up:** How do applicant and recruiter policies differ? **Trap:** Trusting filters written only in client queries.

### Q036. Why use `.select()` after an insert?
**Answer:** The application requests the inserted row/ID for subsequent mapping or UI display. The service often selects one row after writing. **Code:** `supabaseApplications.js`.  
**Follow-up:** Which grant/policy permits that readback? **Trap:** Assuming insert permission automatically proves read permission.

### Q037. What protects resumes?
**Answer:** A private bucket, user-prefixed paths, Storage RLS, file size/type allowlists and short-lived signed URLs. **Code:** portal migration, `supabaseUsers.js`.  
**Follow-up:** How would you test a foreign recruiter? **Trap:** Claiming browser MIME checks alone are enough.

### Q038. How do migrations work here?
**Answer:** `schema.sql` is a guarded first install; timestamped scripts are additive changes. Apply them in order and verify production separately. **Code:** `supabase/`, `README.md`.  
**Follow-up:** Why not rerun the installer? **Trap:** Treating a SQL file as safely repeatable without checking its preflight.

### Q039. What is a signed URL?
**Answer:** A time-limited access URL for a private object, created after the authenticated client passes Storage policies. The code uses five-minute expiry. **Code:** `src/services/supabaseUsers.js`.  
**Follow-up:** What if the URL leaks? **Trap:** Treating it as permanent public access.

### Q040. Why can a missing column break production?
**Answer:** The client query selects `application_url`; if the remote schema lacks the additive migration, PostgreSQL returns undefined-column error. **Code:** `supabaseJobs.js`, external URL migration.  
**Follow-up:** How to resolve safely? **Trap:** Editing the client to hide a schema mismatch without confirming DB state.

## F. Authentication and authorization

### Q041. How does Supabase login work?
**Answer:** `authService.login` invokes `signInWithPassword`, then maps the Auth identity to a JobKhoj profile. **Code:** `src/services/authService.js`.  
**Follow-up:** Where is the role retrieved? **Trap:** Saying the role comes only from a browser form.

### Q042. How is a profile created?
**Answer:** Signup sends allowed metadata; a database trigger inserts a linked `profiles` row with the Auth user ID. **Code:** auth service and `create_profile_for_auth_user` in SQL.  
**Follow-up:** What if the trigger/schema was not installed? **Trap:** Claiming profile creation is an extra REST endpoint.

### Q043. How is session restored?
**Answer:** Supabase SDK restores its persisted session; `AuthProvider` calls `getUser()` and loads profile data before finishing initialization. **Code:** `AuthProvider.jsx`.  
**Follow-up:** What is the mock/REST restore path? **Trap:** Confusing cached UI user with verified identity.

### Q044. What is authentication vs authorization?
**Answer:** Authentication establishes identity; authorization decides whether that identity can perform an action on a row. Supabase RLS does the latter for direct DB calls. **Code:** route guards plus SQL policy.  
**Follow-up:** Why isn't hiding a button enough? **Trap:** Calling role-based navigation secure data access.

### Q045. What happens on a legacy 401?
**Answer:** Axios clears the legacy token and notifies registered handlers; `AuthProvider` clears the cached user. **Code:** `src/services/api.js`, `AuthProvider.jsx`.  
**Follow-up:** Does this path govern Supabase Auth errors? **Trap:** Applying the Axios interceptor to direct Supabase requests.

### Q046. How is password reset implemented?
**Answer:** Supabase mode calls `resetPasswordForEmail` with a redirect, then updates password through Auth on reset; mock/REST mode uses contracts. **Code:** `authService.js`.  
**Follow-up:** Which redirect URLs must be allowed in Supabase? **Trap:** Saying the app sends email through Vercel.

### Q047. What are route guards for?
**Answer:** They improve navigation UX and prevent accidental view access; database policies remain authoritative. **Code:** `ProtectedRoute.jsx`, `RoleRoute.jsx`.  
**Follow-up:** How to probe direct table access? **Trap:** Calling a route guard backend authorization.

### Q048. What happens to admin authorization?
**Answer:** Current router sends `/admin/*` to home; latest migration makes the admin predicate false and revokes admin grants. Legacy artifacts remain. **Code:** `AppRoutes.jsx`, disable-admin migration.  
**Follow-up:** How do you safely re-enable it? **Trap:** Assuming old admin UI files prove the feature is available.

## G. REST APIs and backend

### Q049. What is REST?
**Answer:** A resource-oriented HTTP style using methods/statuses and representations; JobKhoj has some REST client contracts but not the backend implementation. **Code:** `src/services/api.js`.  
**Follow-up:** Name one Supabase operation that bypasses Axios. **Trap:** Saying every operation uses the same backend.

### Q050. How does Axios configure requests?
**Answer:** A shared instance defines base URL, timeout and JSON headers; interceptors add legacy bearer token and normalize failures. **Code:** `src/services/api.js`.  
**Follow-up:** Where does the URL default point? **Trap:** Assuming it is a deployed service.

### Q051. What does `request(liveCall, mockCall)` do?
**Answer:** It calls mock only when mode equals `mock`; otherwise it calls live and lets errors propagate. **Code:** `api.js`.  
**Follow-up:** Why expose an explicit error UI? **Trap:** Saying the function retries with seeded data.

### Q052. What is CORS?
**Answer:** A browser-enforced cross-origin access policy set by the responding server; Axios cannot grant itself CORS permission. **Code:** API config shows client only.  
**Follow-up:** Where must allowed origins be configured? **Trap:** Trying to fix CORS by adding arbitrary request headers.

### Q053. What is idempotency?
**Answer:** Repeating an operation has the same effective result. The application unique constraint helps prevent duplicate application rows, while other side effects need their own strategy. **Code:** SQL unique application constraint.  
**Follow-up:** How would you handle a retry after timeout? **Trap:** Assuming all POST requests are safely repeatable.

### Q054. Which REST domains require an external service?
**Answer:** Notifications and several tool/admin/legacy flows still reference Axios endpoint paths. **Code:** `notificationService.js`, `atsService.js`, `documentService.js`.  
**Follow-up:** What happens when live REST fails? **Trap:** Claiming the repository contains matching controllers.

### Q055. How would you introduce Spring Boot?
**Answer:** Define DTOs/contracts, verify identity server-side, centralize validation/rate limits, add integration tests, migrate one service at a time while preserving RLS. **Code:** current services define seams.  
**Follow-up:** Which feature would benefit first? **Trap:** Moving to microservices without requirements.

### Q056. How should server errors be exposed?
**Answer:** Return stable, user-safe messages while logging diagnostic detail server-side. The client normalizes Axios errors but trusts a server message if supplied. **Code:** `api.js`.  
**Follow-up:** What should never be returned? **Trap:** Showing SQL details/stack traces to end users.

## H. Security

### Q057. What is the most important authorization layer?
**Answer:** SQL RLS/grants and Storage policies for direct Supabase calls; React guards alone are bypassable. **Code:** SQL migrations and route wrappers.  
**Follow-up:** How do you test RLS? **Trap:** Testing only with the owner/admin account.

### Q058. Is the Supabase key a secret?
**Answer:** The publishable key is designed to be included in a browser app; permissions must be least-privileged. No service-role key should be compiled into Vite. **Code:** `supabaseClient.js`.  
**Follow-up:** How should secret keys be used? **Trap:** Reproducing a key in logs/docs.

### Q059. What candidate data is exposed to recruiters?
**Answer:** The candidate view exposes selected profile fields only when public profile is enabled and requester meets the active recruiter predicate; it excludes email/resume fields. **Code:** migration view.  
**Follow-up:** What is the current default? **Trap:** Calling the view anonymously public.

### Q060. What privacy concern exists with profile discovery?
**Answer:** The migration adds `public_profile` with default true, so users may be discoverable before consciously enabling it. Consider explicit opt-in and migration policy. **Code:** portal migration and Settings toggle.  
**Follow-up:** How would you change existing values safely? **Trap:** Flipping everyone without consent/product review.

### Q061. How is SQL injection mitigated?
**Answer:** Supabase query builder parameterizes operations; job search sanitizes terms; candidate `.or()` terms are restricted to a safe character set. **Code:** `supabaseJobs.js`, `supabaseApplications.js`.  
**Follow-up:** What other query input needs review? **Trap:** Assuming any ORM/query builder makes every raw fragment safe.

### Q062. Is there an XSS concern?
**Answer:** React escapes ordinary text; the JobPosting JSON serialization escapes `<`, `>`, `&` before script insertion. Still audit any future HTML rendering and third-party scripts. **Code:** `jobSeo.js`.  
**Follow-up:** Why can external scripts still matter? **Trap:** Claiming a client app has no XSS attack surface.

### Q063. How are external apply links handled?
**Answer:** URL normalization allows only HTTP(S), and the new tab uses `noopener noreferrer`; recruiter-supplied destination trust remains a product/phishing concern. **Code:** `jobSeo.js`, `JobDetails.jsx`.  
**Follow-up:** Would you use a domain allowlist? **Trap:** Calling it an app-controlled redirect endpoint.

### Q064. Is resume upload secure?
**Answer:** The bucket is private with size/MIME restrictions and user/owned-application access policies. MIME metadata alone is not content scanning. **Code:** portal migration, user service.  
**Follow-up:** What extra controls might be needed? **Trap:** Saying a file extension proves safe content.

## I. Deployment and DevOps

### Q065. How is the SPA built?
**Answer:** `npm run build` executes a sitemap prebuild then Vite outputs static files in `dist/`. **Code:** `package.json`, `vite.config.js`.  
**Follow-up:** What environment values are embedded? **Trap:** Claiming runtime server-side Vite variables.

### Q066. Why is a Vercel rewrite configured?
**Answer:** It sends client application paths to `/index.html` so React Router can resolve direct loads/refreshes, with static resources excluded. **Code:** `vercel.json`.  
**Follow-up:** What issue can this create for unknown URLs? **Trap:** Claiming every unknown route returns true HTTP 404.

### Q067. How do environment variables work in Vite?
**Answer:** `VITE_*` values are available to browser build code and should be treated as public. Vercel must rebuild after environment changes. **Code:** `supabaseClient.js`.  
**Follow-up:** Which values must stay server-only? **Trap:** Putting a service-role key in `.env.example` or a `VITE_` variable.

### Q068. Is CI/CD configured?
**Answer:** No tracked GitHub workflow or Dockerfile was found. Vercel configuration exists, but actual Git integration and deploy automation need console verification. **Code:** repo config inventory.  
**Follow-up:** What would you add? **Trap:** Assuming Vercel automatically means CI tests run.

### Q069. What is a preview deployment?
**Answer:** A separate deployment used to test changes before production; whether configured depends on Vercel project/Git settings not in source. **Code:** no repository proof.  
**Follow-up:** How should preview credentials differ? **Trap:** Using production database accidentally in previews.

### Q070. What deployment config is missing for live REST?
**Answer:** If `VITE_API_BASE_URL` is absent, the client default is localhost, unsuitable for public visitors. **Code:** `src/services/api.js`.  
**Follow-up:** How do you verify? **Trap:** Debugging only in dev where localhost works.

### Q071. How would you investigate a deployment failure?
**Answer:** Check Vercel build logs, built env mode, browser network/console, Supabase URL/project/migration, Auth redirects, and rewrite/static file behavior. **Code:** `vercel.json`, service configuration.  
**Follow-up:** Which local build step generates sitemap? **Trap:** Changing production settings without evidence or authorization.

### Q072. How are rollbacks handled?
**Answer:** Repository does not document a rollback workflow; use Vercel deployment history if available and coordinate any DB migration rollback separately. **Code:** no rollback config found.  
**Follow-up:** Why can code rollback be insufficient? **Trap:** Reverting a database migration as if it were a static asset.

## J. SEO and performance

### Q073. How are titles and canonicals set?
**Answer:** `PageMetadata` uses a React effect to set title/meta/canonical per route; job detail supplies a descriptive canonical path. **Code:** `PageMetadata.jsx`, `JobDetails.jsx`.  
**Follow-up:** Are they in raw initial HTML? **Trap:** Claiming SSR metadata.

### Q074. How is JobPosting structured data generated?
**Answer:** `createJobPosting` builds schema.org fields for eligible listings and the page serializes them safely into JSON-LD. **Code:** `jobSeo.js`, `JobDetails.jsx`.  
**Follow-up:** What fields prevent emission? **Trap:** Claiming markup alone guarantees rich results.

### Q075. How is the sitemap generated?
**Answer:** Prebuild script writes static XML using fixed routes plus mock-seed job routes, excluding a fixed ID list. It does not query production DB. **Code:** `scripts/generate-sitemap.js`.  
**Follow-up:** How would you make it accurate? **Trap:** Saying new DB jobs automatically appear.

### Q076. Why is the sitemap not enough?
**Answer:** It is a discovery hint; URLs still need to be canonical, crawlable, useful and return appropriate status/content. **Code:** sitemap generator and SPA rewrite.  
**Follow-up:** How do you detect a soft 404? **Trap:** Promising indexing.

### Q077. What is a canonical URL?
**Answer:** The preferred URL for equivalent content. Job details redirect to a descriptive slug and set canonical; search queries canonicalize to the listing path. **Code:** `jobSeo.js`, `PageMetadata.jsx`.  
**Follow-up:** Should every filter combination be indexed? **Trap:** Canonicalizing unrelated job pages to the homepage.

### Q078. What is a soft 404 risk?
**Answer:** A missing route can be rewritten to SPA HTML with HTTP 200 and only later render NotFound; crawlers can interpret that as a soft 404. **Code:** `vercel.json`, wildcard route.  
**Follow-up:** What server/rendering change could help? **Trap:** Assuming a React NotFound component sets HTTP status.

### Q079. Where does live search execute?
**Answer:** Supabase/Postgres applies filters, ordering, full-text search and range; mock mode processes arrays in JavaScript. **Code:** `supabaseJobs.js`, `query.js`.  
**Follow-up:** What index supports text search? **Trap:** Saying all search is client-side.

### Q080. What performance optimization exists?
**Answer:** Vite manually chunks React/router and charts; DB indexes cover common listing/application queries. **Code:** `vite.config.js`, SQL.  
**Follow-up:** What should you measure next? **Trap:** Claiming measured Core Web Vitals without data.

## K. Testing

### Q081. What automated tests exist?
**Answer:** A custom smoke script, ESLint and Vite build. No separate `*.test.*` framework setup was found. **Code:** `scripts/smoke.js`, `package.json`.  
**Follow-up:** What are smoke test limits? **Trap:** Repeating an old docs assertion count as a current run.

### Q082. What does the smoke suite exercise?
**Answer:** Mock data/query behavior, localStorage, auth and service delegation assertions. It is not live Supabase or browser E2E coverage. **Code:** `scripts/smoke.js`.  
**Follow-up:** What isolation does it use? **Trap:** Saying it tests production RLS.

### Q083. How would you test a React component?
**Answer:** Add a component test runner/library or use browser E2E; assert accessible behavior and user outcomes rather than internal implementation. **Code:** current repo has no RTL config.  
**Follow-up:** Which component would you test first? **Trap:** Claiming a library is installed when it is not.

### Q084. How would you test RLS?
**Answer:** Use disposable Supabase staging identities for anonymous, seeker A/B and recruiter A/B, then assert allowed and denied reads/writes. **Code:** migration policies.  
**Follow-up:** Why not test only the happy path? **Trap:** Running destructive permission tests in production.

### Q085. What is a regression test for applications?
**Answer:** Submit same job twice as same seeker and assert the DB unique constraint rejects the second attempt; test friendly error display. **Code:** application migration and `supabaseApplications.js`.  
**Follow-up:** How does a race condition affect frontend-only checks? **Trap:** Relying on a button disabled state.

### Q086. How would you test empty/error states?
**Answer:** Stub zero results and provider rejection; assert empty/reset or error/retry UI rather than blank screen. **Code:** `JobSearch.jsx`.  
**Follow-up:** How does live mode behave? **Trap:** Returning mocks on network error.

### Q087. What should an E2E test cover?
**Answer:** Register/sign in, search, view job, apply, then recruiter ownership/pipeline in staging; include direct URL refresh. **Code:** route/pages/services.  
**Follow-up:** Which data state should be reset? **Trap:** Running test against production accounts.

### Q088. Why separate unit/integration/E2E tests?
**Answer:** Unit tests isolate logic, integration tests verify provider/policy boundaries, E2E tests verify browser navigation and workflows. **Code:** smoke harness currently mostly first category.  
**Follow-up:** Which level is cheapest? **Trap:** Expecting one suite to prove all system behavior.

## L. System design

### Q089. What are the functional requirements?
**Answer:** Public job discovery, seeker profile/application tracking, recruiter job/candidate workflows, company info and career tools. **Code:** `AppRoutes.jsx`.  
**Follow-up:** Which are truly production-backed? **Trap:** Assuming a route means backend delivery is complete.

### Q090. What are key non-functional requirements?
**Answer:** Role/data isolation, resume privacy, dependable search, responsive UX, good crawlability and recoverable failures. **Code:** SQL RLS, UI states, SEO utilities.  
**Follow-up:** How would you measure availability? **Trap:** Quoting an SLO that does not exist.

### Q091. How would you scale search to 100,000 jobs?
**Answer:** Measure query plans, retain indexes, bound page sizes, reduce expensive exact counts if appropriate, and consider keyset/search service only when data supports it. **Code:** Supabase `.range()` queries.  
**Follow-up:** When does offset become a problem? **Trap:** Introducing Elasticsearch without requirements.

### Q092. How would you cache public jobs?
**Answer:** Cache only public, eligible reads with careful invalidation on publish/edit/close/expiry; never cache user-specific application/resume data publicly. **Code:** current app has no cache.  
**Follow-up:** How do you invalidate stale sitemap/cache after job closure? **Trap:** Adding a cache without freshness rules.

### Q093. What breaks first in a 10x traffic spike?
**Answer:** It depends on query, provider quotas, exact counts, storage and external REST capacity; measure before naming a bottleneck. **Code:** no performance telemetry beyond Vercel Analytics.  
**Follow-up:** What load test would you run? **Trap:** Giving made-up capacity numbers.

### Q094. Would you use a queue?
**Answer:** Not for current synchronous UI needs; a queue becomes useful for retries and background email/alerts/analytics as those delivery workflows are implemented. **Code:** no queue source found.  
**Follow-up:** What should remain synchronous? **Trap:** Adding Kafka by default.

### Q095. How should notifications scale?
**Answer:** Persist events, generate user-scoped inbox reads, dispatch email/push asynchronously with retries and idempotency; current Supabase schema lacks a notifications table. **Code:** `notificationService.js`.  
**Follow-up:** What is implemented today? **Trap:** Claiming the stored alert rules already send emails.

### Q096. How would you migrate direct Supabase access to Spring Boot?
**Answer:** Introduce one domain endpoint at a time, authenticate/authorize on server, preserve policy defense-in-depth, test contracts and migrate clients behind services. **Code:** service layer is the seam.  
**Follow-up:** How do you avoid dual-write inconsistency? **Trap:** Switching every service at once.

## M. Debugging and production scenarios

### Q097. A job disappeared. What do you inspect?
**Answer:** Filters/page, status/deadline, RLS, query errors, current mode and refetch dependencies; then compare mock vs live data. **Code:** `JobSearch.jsx`, `supabaseJobs.js`.  
**Follow-up:** How can the sitemap differ? **Trap:** Blaming React before checking query state.

### Q098. Database returns an empty result. What next?
**Answer:** Check Auth identity, RLS predicate, row values, filters, deadline, selected project and migration state; distinguish empty data from an error. **Code:** Supabase service and policies.  
**Follow-up:** How can you safely compare roles? **Trap:** Disabling RLS in production as a debug step.

### Q099. A seeker accesses a recruiter feature. How do you investigate?
**Answer:** Reproduce client route, then independently test direct table writes; inspect role mapping, grants and RLS ownership conditions. **Code:** `RoleRoute.jsx`, SQL policies.  
**Follow-up:** What if only UI navigation is wrong? **Trap:** Treating a hidden menu as the fix.

### Q100. The app works locally but not on Vercel. Why?
**Answer:** Check build-time VITE variables, API mode/base URL, Supabase migrations/auth redirects, browser CORS/network and SPA rewrite exceptions. **Code:** config files.  
**Follow-up:** Why may localhost work but deployed tool API fail? **Trap:** Assuming local `.env` is deployed.

### Q101. `application_url` gives SQL `42703`. What do you do?
**Answer:** The deployed schema likely lacks the additive migration. Confirm the exact Supabase project, apply the reviewed migration, then test the live read. **Code:** migration and job column mapping.  
**Follow-up:** Why not rerun the first-install schema? **Trap:** Changing production without migration review.

### Q102. Search slows at 100,000 jobs. What do you change?
**Answer:** Capture query plans/latency, check index selectivity, pagination/count overhead and search semantics; then tune queries or adopt keyset/dedicated search based on measurements. **Code:** `.range()` and GIN vector.  
**Follow-up:** Which filters are selective? **Trap:** Guessing based on local seed.

### Q103. A recruiter gets another recruiter's resume. What is the first priority?
**Answer:** Treat it as a sensitive incident; inspect Storage policy/ownership relation, signed URL creation, affected access/logs, revoke exposure and patch/test staging. **Code:** resume policy and `attachResumeUrls`.  
**Follow-up:** Which identifiers must match? **Trap:** Fixing only the UI button.

### Q104. A user submits the same application twice after a timeout. What happens?
**Answer:** The unique constraint should reject the duplicate; the UI should reload the existing application or show a clear already-applied response. **Code:** application table unique key.  
**Follow-up:** Would an idempotency key help? **Trap:** Assuming the first timeout means no write occurred.

## Final practice prompt

Pick any answer and explain it using this sequence: **user action → component/hook → service → provider/database policy → result/error → UI**. If you cannot point to a source file or SQL policy, label the statement as a recommendation or production fact that still needs verification.
