# JobKhoj Testing and Troubleshooting Plan

## 1. What exists today

Verified from `package.json`, `scripts/smoke.js` and the repository file inventory:

| Check | Present | What it can establish |
|---|---|---|
| Custom smoke assertions | Yes: `npm run smoke` | Primarily seeded mock database, query handlers, localStorage, mock auth, service delegation and business rules. |
| ESLint | Yes: `npm run lint` | Static code/style rules; it does not prove runtime or data authorization. |
| Production build | Yes: `npm run build` | Vite bundling and sitemap prebuild generation. |
| Unit test runner | Not configured | No Vitest/Jest test files/config found. |
| Component test library | Not configured | No React Testing Library setup found. |
| Browser E2E | Not configured | No Playwright/Cypress setup found. |
| Live Supabase integration suite | Not found | Local smoke tests do not verify production RLS, Storage policies, or migration state. |
| External REST contract tests | Not found | REST backend source is outside this repository. |

The existing smoke file contains a small custom assertion harness:

```js
function check(label, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}
```

The script sets up browser shims, imports handlers/services and checks actual mock behavior. It should not be described as an automated live-system or browser test. Existing HTML documentation has older test-count and admin-workflow claims; treat its historical totals as unverified until a current run is recorded.

## 2. Suggested validation sequence

Run from the repository root. These commands are not represented as having been executed for this documentation task.

```powershell
npm run lint
npm run smoke
npm run build
npm run preview
```

For a local preview, request `/`, `/jobs`, `/robots.txt`, `/sitemap.xml`, and `/google2f322d709b9d1144.html`; validate XML parsing and status codes. For Vercel, repeat from a deployment URL, but do not infer production settings from the local preview.

## 3. Test matrix

| Area | Scenario | Expected behavior | Layer |
|---|---|---|---|
| Public job list | Load with no filters | Active, non-expired listings show newest-first with page metadata | Unit/service + browser |
| Search | Search title, company, skill and location words | Matching behavior agrees in mock and live modes | Unit + live integration |
| Search | Search query contains punctuation/unusual text | Query is sanitized/treated as text, no query syntax injection | Unit + DB |
| Filters | Combine location, experience, skill and salary range | Every returned job satisfies every active filter | Unit + live DB |
| Pagination | First, middle, last and out-of-range page | Correct range, page counts, `hasNext`/`hasPrev`; no duplicate/missing rows | Unit + DB |
| Empty results | Search/filter returns zero rows | Helpful empty state and reset action; category becomes noindex | Browser |
| Detail | Direct-load a descriptive job URL | SPA route resolves ID, data loads, URL remains canonical | Browser + Vercel |
| Detail | Closed, expired, removed or malformed ID | No apply action; safe unavailable state; noindex or real 404/410 as designed | Browser + host |
| SEO | Public eligible job | Unique title/description/canonical, valid JobPosting JSON-LD and absolute URL | Browser/render + Rich Results tool |
| SEO | Missing job route | HTTP status is not incorrectly reported as a normal successful page; inspect for soft 404 | Vercel HTTP |
| Auth | Register seeker and recruiter | Correct role/profile creation; email confirmation path works when enabled | Supabase staging |
| Auth | Wrong password, expired session, reset flow | Clear actionable error; 401/session state handled | Integration + browser |
| Authorization | Anonymous user opens dashboard route | Redirects to login, but also verify no direct data access is granted | Browser + RLS |
| Authorization | Seeker tries recruiter writes; recruiter queries another recruiter's applicant | SQL rejects/filters; UI guard is not the only control | RLS integration |
| Job posting | Recruiter posts required fields | Owner is bound to auth user; constraints reject invalid values; listing appears publicly | Supabase staging |
| Job posting | Recruiter edits listing | Owner check; date behavior matches product rule; stale sitemap caveat understood | DB + browser |
| Apply | Submit twice for same seeker/job | Second insert rejected by unique constraint and UI presents useful feedback | Supabase integration |
| Apply | Seeker applies to closed/expired job | RLS rejects insert | RLS integration |
| Resume | Upload accepted PDF/DOC/DOCX within 5 MB | Object private; metadata saved; own download available | Storage staging |
| Resume | Wrong MIME/oversize/foreign object path | Reject; anon cannot read; unrelated recruiter cannot sign/read | Storage integration |
| Database failure | Supabase unavailable or missing column | Error state visible; live mode does not silently load mock data | Browser + config |
| REST | No REST base URL or service unreachable | Explicit error; confirm request does not point to end-user localhost in production | Browser/network |
| Mobile | 320–390 px viewport | Navigation, search drawer, job card, modal and application form remain usable | Browser manual/E2E |
| Regression | Featured selection repeated; newest-first | Eligible featured selection rotates; default listing order remains newest-first | Smoke |
| Sitemap | Build then parse XML | Every `<loc>` absolute HTTPS and unique; only current public canonical routes | Node script |
| Robots/verification | Preview static asset paths | `robots.txt` and exact Google verification file return their own content, not SPA HTML | HTTP |

## 4. RLS test matrix

Use a disposable Supabase staging project with separate seeker and recruiter users. Do not use production for destructive tests.

| Identity | Operation | Must pass? |
|---|---|---|
| Anonymous | Select active/non-expired jobs and verified companies | Yes |
| Anonymous | Select profiles, applications, saved jobs, alerts, or private resume objects | No |
| Seeker A | Read/update own allowed profile fields, save jobs, manage own alerts, read own applications | Yes |
| Seeker A | Read Seeker B's private profile row or alter role/status | No |
| Seeker A | Insert an application for an active job as self | Yes |
| Seeker A | Insert for another applicant, closed job, or duplicate pair | No |
| Recruiter A | Manage own job and view applications to own job | Yes |
| Recruiter A | Update Recruiter B's job or read B's applicant/resume | No |
| Recruiter A | View opted-public candidate profile data | Yes, per current view policy |
| Recruiter A | View candidate profile data after `public_profile = false` | No |
| Any active authenticated user | Read resume from someone else's folder without owned-application relationship | No |
| Admin-role account | Use old admin path/RPCs | No under the current disabling migration; verify deployed version |

## 5. Illustrative mock unit test shape

The repo currently uses its own smoke harness rather than a test framework. A new isolated test could assert the same real helper contract; if adding a runner, import/alias handling must match the Vite `@` alias.

```js
const activeJobs = jobs.filter((job) => job.status === JOB_STATUS.ACTIVE)
const filtered = applyFilters(activeJobs, { workMode: ['Remote'] })

assert.ok(filtered.every((job) => job.workMode === 'Remote'))
assert.deepEqual(
  applySort(filtered, 'newest').map((job) => job.id),
  [...filtered]
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .map((job) => job.id),
)
```

Use this only after wrapping imports with the project’s test bundler or selecting a runner that understands the alias. Do not hand-wave this as a test already present.

## 6. Troubleshooting playbook

### Job absent from results

1. Check selected filters, search words, URL params and page number.
2. Check database row `status`, `deadline`, `posted_at`, and job ID.
3. In live mode, confirm `VITE_API_MODE`, Supabase URL/key configuration and RLS query result.
4. Inspect Supabase response/error in browser network tools, not just component state.
5. Check whether the view changed but the page did not refetch; inspect `useFetch` dependencies.
6. Confirm the sitemap source list is separate: current generator is seeded/static and can diverge from DB jobs.

### Works locally but not in Vercel

1. Confirm Vercel build environment variables are set for Preview/Production as applicable. Values are compiled into the Vite build.
2. Inspect the built asset/network request and ensure live mode is not using the default local REST base URL.
3. Confirm the production Supabase project has every migration, especially the external URL column.
4. Check Auth redirect allowlists, RLS policies, Supabase Storage bucket privacy, and browser console/network errors.
5. Verify SPA rewrite exceptions still serve `sitemap.xml`, `robots.txt`, and the verification HTML directly.

## 7. Hinglish takeaway

`npm run smoke` mock data ko test karta hai, production Supabase ko nahi. Build pass hone se RLS ya Vercel environment variables prove nahi hote. Isliye staging database par seeker/recruiter ke alag accounts se permission matrix zaroor verify karein, aur sitemap/verification URL ko actual HTTP request se check karein.
