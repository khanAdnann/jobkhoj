# JobKhoj Learning Roadmap

This sequence teaches the implementation from the browser inward. Each module includes a simple Hinglish explanation, English definition, source anchors, flow, analogy, practice, interview prompt, common mistake and a self-check.

## 1. React components, JSX and props

- **Hinglish:** Component ek reusable UI function hai. Props usko parent se milne wala input data hai.
- **English:** A React component maps props and state to a UI description; JSX is syntax compiled into React element calls.
- **Source:** `src/components/jobs/JobCard.jsx`, `src/pages/Home.jsx`.
- **Flow:** Home fetches job objects → passes one to `JobCard` → card renders title/company/details and links to canonical detail.
- **Analogy:** Job card ek printed listing template hai; props us listing ka filled-in data.
- **Practice:** Trace one field, `job.postedAt`, from data mapper to `timeAgo` in the rendered card.
- **Interview:** Why should a list child have a stable `key`?
- **Common mistake:** Claim that JSX is HTML; it is JavaScript syntax transformed by the build.
- **Check yourself:** Which values belong in props and which belong in the card's local state?

## 2. State, effects and Context

- **Hinglish:** `useState` component ka changing data sambhalta hai; `useEffect` render ke baad outside work (fetch/session) chalata hai; Context shared auth state deta hai.
- **English:** Hooks provide local state, effect synchronization and context consumption in function components.
- **Source:** `src/hooks/useFetch.js`, `src/context/AuthProvider.jsx`, `src/hooks/useAuth.js`.
- **Flow:** Auth provider restores user → Context publishes `user` and actions → route/page calls `useAuth`.
- **Analogy:** Local state is a page's notebook; Context is a shared noticeboard for the app.
- **Practice:** Follow how `initialising` prevents protected routing before session restore completes.
- **Interview:** What causes an effect to rerun? How do stale async responses get handled?
- **Common mistake:** Put all state in Context or omit dependencies; both can cause unnecessary renders or stale values.
- **Check yourself:** Why does `useFetch` use a request ID even though it tracks mounted state?

## 3. Routes and access guards

- **Hinglish:** Router URL ko component se map karta hai. Guard user ko sahi screen tak le jaata hai, par database security nahi hoti.
- **English:** React Router performs client-side route matching and navigation.
- **Source:** `src/routes/AppRoutes.jsx`, `RoleRoute.jsx`, `ProtectedRoute.jsx`, `vercel.json`.
- **Flow:** URL → Vercel serves SPA shell → React Router matches route → guard checks Context → page loads.
- **Analogy:** Route guard building ka front desk hai; database RLS locked file room hai.
- **Practice:** Explain a direct refresh on `/recruiter/jobs` and name which part serves `index.html`.
- **Interview:** Why is an SPA rewrite needed? Why is it not authorization?
- **Common mistake:** Assume a route hidden from navigation cannot be called directly.
- **Check yourself:** What separate protection blocks a seeker from writing a job row?

## 4. Forms and validation

- **Hinglish:** Form library input values/errors ko manage karti hai; validation browser par UX ke liye, database par data integrity ke liye hoti hai.
- **English:** React Hook Form tracks form state and validation; SQL constraints enforce invariants at persistence boundaries.
- **Source:** `src/pages/auth/Register.jsx`, `src/pages/recruiter/JobForm.jsx`, `supabase/schema.sql`.
- **Flow:** Input → React Hook Form rules → service request → RLS/DB checks → success/error UI.
- **Analogy:** Client validation is a checklist at reception; database constraint is the final gate.
- **Practice:** Compare password confirmation validation with the job title SQL length constraint.
- **Interview:** Why validate at both client and server/database?
- **Common mistake:** Treat client validation as a security boundary; requests can bypass the UI.
- **Check yourself:** Which layer actually ensures application job/applicant uniqueness?

## 5. Data fetching and service boundaries

- **Hinglish:** Component service ko call karta hai; service decide karta hai mock ya live provider. Page ko SQL details se alag rakhte hain.
- **English:** A service layer centralizes domain operations, provider selection and row mapping.
- **Source:** `src/services/jobService.js`, `supabaseJobs.js`, `src/mock/handlers/jobs.js`.
- **Flow:** Search page → `listJobs` → `callJobStorage` → Supabase or mock → mapped list → `useFetch`.
- **Analogy:** Service is a switchboard connecting the same request to one configured data source.
- **Practice:** Follow `posted_at` to UI `postedAt` and list how the two naming conventions are mapped.
- **Interview:** What benefit does mock/live parity provide? What is its risk?
- **Common mistake:** Say live network errors fall back to mock; `request()` deliberately rethrows live failures.
- **Check yourself:** Why can showing mock jobs after a live failure be dangerous in a production portal?

## 6. Search, sorting and pagination

- **Hinglish:** Mock mein arrays filter/sort hoti hain; live mein Postgres query filters, order aur range karta hai.
- **English:** Filtering reduces result sets; ordering defines deterministic presentation; pagination bounds response size.
- **Source:** `src/mock/handlers/query.js`, `src/services/supabaseJobs.js`, `src/hooks/useJobFilters.js`.
- **Flow:** URL controls → filter object → query → result count/page → cards.
- **Analogy:** Filters are a librarian's criteria; pagination is retrieving a shelf section rather than every book.
- **Practice:** Trace how query terms become Postgres `textSearch` and identify the `search_document` index.
- **Interview:** What is the trade-off of offset pagination at deep page numbers?
- **Common mistake:** Claim the current implementation has infinite scroll or debouncing without checking its hook.
- **Check yourself:** Why is exact count useful, and why can it add cost?

## 7. PostgreSQL schema and constraints

- **Hinglish:** Tables entities ko rakhte hain; foreign key relation, unique/check constraints invalid data ko rokta hai.
- **English:** Relational schemas model entities and relationships; constraints guarantee integrity across all clients.
- **Source:** `supabase/schema.sql`, `supabase/migrations/20261017000000_portal_data.sql`.
- **Flow:** Insert/update request → RLS authorizes row → constraints validate fields → triggers maintain derived data.
- **Analogy:** Foreign keys are links between registers; unique constraints prevent the same ticket being issued twice.
- **Practice:** Draw `profiles → jobs → job_applications` and add the application applicant relationship.
- **Interview:** Why is `(job_id, applicant_id)` unique?
- **Common mistake:** Assume `company_id` is a foreign key because its name looks relational; it is text without an FK declaration.
- **Check yourself:** What is removed by `ON DELETE CASCADE` when a job is deleted?

## 8. Supabase Auth, RLS and Storage

- **Hinglish:** Auth batata hai kaun hai; RLS batata hai woh kaunsi row dekh/modify kar sakta hai. Publishable key secret nahi, policy important hai.
- **English:** Supabase Auth issues managed user sessions; PostgreSQL RLS evaluates row visibility/mutations under request identity.
- **Source:** `src/services/supabaseClient.js`, `authService.js`, migration policies and Storage rules.
- **Flow:** Auth session → PostgREST request identity → grants + RLS → returned/modified permitted rows.
- **Analogy:** Auth is employee badge identity; RLS is room-specific access control.
- **Practice:** Explain applicant read-own and recruiter read-owned-job application predicates.
- **Interview:** Why must server-role keys stay off the browser?
- **Common mistake:** Trust React route role checks or a publishable key as authorization.
- **Check yourself:** How is a recruiter allowed a resume file only for their owned application?

## 9. Authentication versus authorization

- **Hinglish:** Login identity prove karta hai; permission policy resource/action decide karti hai.
- **English:** Authentication verifies identity; authorization evaluates permissions based on identity, role, ownership and resource state.
- **Source:** `src/context/AuthProvider.jsx`, route guards, SQL RLS policies.
- **Flow:** Sign-in → auth user/profile map → Context → client route guard → database independently enforces row access.
- **Analogy:** Badge says who you are; authorization list says which rooms you can enter.
- **Practice:** Try to describe the complete seeker application-read check without mentioning UI.
- **Interview:** What should happen if a user changes localStorage role manually?
- **Common mistake:** Say a React `ProtectedRoute` secures the underlying Supabase table.
- **Check yourself:** Which layer protects a direct REST request that bypasses React?

## 10. SEO, static deployment and debugging

- **Hinglish:** Vite SPA ka initial HTML generic hai; React baad mein route title set karta hai. Sitemap seed se banti hai, live DB se nahi.
- **English:** Client-rendered SPAs depend on browser execution for route-specific content; static generation produces precomputed assets.
- **Source:** `PageMetadata.jsx`, `jobSeo.js`, `scripts/generate-sitemap.js`, `index.html`, `vercel.json`.
- **Flow:** Build → static `dist` → Vercel CDN → rewrite route to shell → React data/metadata render.
- **Analogy:** Static shell is an empty shopfront; JavaScript opens the correct department after loading.
- **Practice:** Identify why an unknown path can show NotFound UI but still get HTTP 200 from a rewrite.
- **Interview:** How would you make job pages easier for crawlers and keep sitemap current?
- **Common mistake:** Claim the sitemap contains live Supabase jobs or that a sitemap guarantees indexing.
- **Check yourself:** Which three production facts must be verified outside this repository?

## 11. Suggested progression

1. Read `package.json`, `src/main.jsx`, and `App.jsx`.
2. Trace one route through `AppRoutes.jsx` and its layout.
3. Trace Home → `useFetch` → `jobService` → Supabase/mock mapper → `JobCard`.
4. Trace seeker registration → Supabase Auth → signup trigger → profile mapping.
5. Draw the schema and explain one RLS policy per table.
6. Trace job application insert and resume access.
7. Compare mock and live search implementation.
8. Study Vite build, sitemap, canonical metadata and Vercel rewrite.
9. Run lint/smoke/build locally, then design isolated staging RLS tests.
10. Practice the interview scripts and answer the question bank aloud using source files as evidence.

## 12. Hinglish wrap-up

Pehle UI flow samjho, phir service layer, uske baad database aur RLS. Sabse important difference yaad rakho: **React ka role guard screen ko hide karta hai; SQL RLS data ko protect karta hai.** Interview se pehle har claim ko ek actual file ya policy se jod kar explain karo.
