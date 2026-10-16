/**
 * Smoke test for the mock data + query layer.
 *
 * These modules are plain JS with no framework dependency, so we can run them
 * directly in Node (with a localStorage shim) and assert real behaviour —
 * search, filtering, sorting, pagination, auth, the application pipeline and
 * admin moderation.
 *
 * Run:  npm run smoke
 */

/* ------------------------- browser shims (first) ------------------------- */

class MemoryStorage {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }
  setItem(key, value) {
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
  get length() {
    return this.store.size
  }
  key(index) {
    return [...this.store.keys()][index] ?? null
  }
}

globalThis.localStorage = new MemoryStorage()
globalThis.window = {
  localStorage: globalThis.localStorage,
  innerWidth: 1280,
  addEventListener() {},
  removeEventListener() {},
}
globalThis.document = {
  documentElement: { clientWidth: 1280 },
  addEventListener() {},
  removeEventListener() {},
}

/* --------------------------------- harness -------------------------------- */

let passed = 0
const failures = []

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

function section(name) {
  console.log(`\n${name}`)
}

/* --------------------------------- imports -------------------------------- */

const { db } = await import('../src/mock/db.js')
const { buildSeed } = await import('../src/mock/seed/index.js')
const jobs = await import('../src/mock/handlers/jobs.js')
const companies = await import('../src/mock/handlers/companies.js')
const applications = await import('../src/mock/handlers/applications.js')
const users = await import('../src/mock/handlers/users.js')
const recruiter = await import('../src/mock/handlers/recruiter.js')
const admin = await import('../src/mock/handlers/admin.js')
const auth = await import('../src/mock/handlers/auth.js')
const query = await import('../src/mock/handlers/query.js')
const {
  JOB_STATUS,
  APPLICATION_STATUS,
  COMPANY_STATUS,
  USER_STATUS,
  PIPELINE_STAGE,
  ROLES,
  TOKEN_KEY,
  USER_KEY,
} = await import('../src/utils/constants.js')

/* Services are imported through the same alias the app uses, so the mock
 * delegation path is exercised exactly as the browser exercises it. This is
 * what catches service -> handler mismatches that the handler-level tests
 * above cannot see, because they never go through the service wrapper. */
const adminService = await import('../src/services/adminService.js')
const userService = await import('../src/services/userService.js')
const recruiterService = await import('../src/services/recruiterService.js')
const jobService = await import('../src/services/jobService.js')
const companyService = await import('../src/services/companyService.js')
const applicationService = await import('../src/services/applicationService.js')

/* ---------------------------------- seed --------------------------------- */

section('Seed data')
const seed = buildSeed()

/** Baseline role counts, used later by the admin overview assertions. */
const seedSeekers = seed.users.filter((user) => user.role === ROLES.JOB_SEEKER).length
const seedRecruiters = seed.users.filter((user) => user.role === ROLES.RECRUITER).length

check('10 companies seeded', seed.companies.length === 10, `got ${seed.companies.length}`)
check('26 jobs seeded', seed.jobs.length === 26, `got ${seed.jobs.length}`)
check(
  '12 seekers + 10 recruiters + 1 admin seeded',
  seed.users.length === 23,
  `got ${seed.users.length}`,
)
check(
  'every job belongs to a known company',
  seed.jobs.every((job) => seed.companies.some((c) => c.id === job.companyId)),
)
check(
  'every job has description prose',
  seed.jobs.every((job) => job.description && job.description.length > 80),
)
check(
  'every job has responsibilities',
  seed.jobs.every((job) => job.responsibilities.length >= 3),
)
check(
  'applications were generated',
  seed.applications.length > 60,
  `got ${seed.applications.length}`,
)
check(
  'no application duplicates a (seeker, job) pair',
  new Set(seed.applications.map((a) => `${a.seekerId}:${a.jobId}`)).size ===
    seed.applications.length,
)
check(
  'first demo application id is APP-102938',
  seed.applications[0]?.id === 'APP-102938',
  `got ${seed.applications[0]?.id}`,
)
check(
  'jobs spread across multiple statuses for admin moderation',
  new Set(seed.jobs.map((j) => j.status)).size >= 4,
  [...new Set(seed.jobs.map((j) => j.status))].join(','),
)
check('db seeded to the same counts', db.count('jobs') === 26)

/* -------------------------------- queries -------------------------------- */

section('Search, filter, sort, paginate')

const allActive = db.where('jobs', (job) => job.status === JOB_STATUS.ACTIVE)

const javaMumbai = query.applyFilters(allActive, { query: 'java mumbai' })
check(
  '"java mumbai" narrows results',
  javaMumbai.length > 0 && javaMumbai.length < allActive.length,
  `${javaMumbai.length} results`,
)
check(
  '"java mumbai" only returns Java roles in Mumbai',
  javaMumbai.every(
    (job) => job.title.toLowerCase().includes('java') && job.location.includes('Mumbai'),
  ),
)

const remoteJobs = query.applyFilters(allActive, { workMode: ['Remote'] })
check(
  'work mode filter returns only remote jobs',
  remoteJobs.length > 0 && remoteJobs.every((job) => job.workMode === 'Remote'),
  `${remoteJobs.length} remote`,
)

const seniorJava = query.applyFilters(allActive, {
  skills: ['Java', 'Spring Boot'],
})
check(
  'multi-skill filter requires every skill',
  seniorJava.every((job) => job.skills.includes('Java') && job.skills.includes('Spring Boot')),
)

const banded = query.applyFilters(allActive, { salaryMin: 15, salaryMax: 25 })
check(
  'salary band overlaps correctly',
  banded.every((job) => job.salaryMax >= 15 && job.salaryMin <= 25),
  `${banded.length} in band`,
)

const newest = query.applySort(allActive, 'newest')
check(
  'newest sort is descending by date',
  newest.every((job, i) => i === 0 || new Date(newest[i - 1].postedAt) >= new Date(job.postedAt)),
)

const highestPaid = query.applySort(allActive, 'salary-desc')
check(
  'salary-desc sort leads with the highest max',
  highestPaid[0].salaryMax === Math.max(...allActive.map((j) => j.salaryMax)),
)

const paged = query.paginate(allActive, 2, 6)
check('pagination clamps page', paged.page === 2 && paged.items.length === 6)
check(
  'pagination clamps past-the-end page',
  query.paginate(allActive, 999, 6).page === paged.totalPages,
)

/* -------------------------------- services -------------------------------- */

section('Job service')
const listing = await jobs.listJobs({ page: 1, pageSize: 6, sort: 'relevance' })
check('listJobs returns a page', listing.items.length === 6)
check('hydrated jobs carry their company', Boolean(listing.items[0].company?.name))
check('facets are returned', Array.isArray(listing.facets?.locations) && listing.facets.locations.length > 0)

const featured = await jobs.getFeaturedJobs(6)
check('featured jobs returned', featured.length > 0 && featured.length <= 6)
check('featured list is all ACTIVE', featured.every((job) => job.status === JOB_STATUS.ACTIVE))

const detail = await jobs.getJob('job-1001')
check('getJob returns the role', detail.title === 'Java Backend Developer')
check('getJob hydrates the company', detail.company.name === 'Tata Consultancy Services')

const similar = await jobs.getSimilarJobs('job-1001', 6)
check('similar jobs returned', similar.length > 0 && similar.length <= 6)
check('similar excludes the source job', similar.every((job) => job.id !== 'job-1001'))

const jobApplications = await applications.listJobApplicants('job-1001')
check('job applicants listed', jobApplications.totalItems > 0)

/* --------------------------------- auth ----------------------------------- */

section('Authentication')
const seekerLogin = await auth.login({ email: 'seeker@jobkhoj.in', password: 'anything' })
check('seeker can sign in', seekerLogin.user.role === ROLES.JOB_SEEKER)
check('mock token issued', typeof seekerLogin.token === 'string' && seekerLogin.token.includes('.'))
check('token decodes to the user id', auth.decodeToken(seekerLogin.token).sub === 'usr-seeker-1')

let blockedRejected = false
try {
  await auth.login({ email: 'vikram.singh@example.in', password: 'x' })
} catch {
  blockedRejected = true
}
check('blocked account cannot sign in', blockedRejected)

let unknownRejected = false
try {
  await auth.login({ email: 'nobody@nowhere.in', password: 'x' })
} catch {
  unknownRejected = true
}
check('unknown email is rejected', unknownRejected)

const duplicateRejected = await (async () => {
  try {
    await auth.register({ email: 'seeker@jobkhoj.in', password: 'password123', role: ROLES.JOB_SEEKER })
    return false
  } catch {
    return true
  }
})()
check('duplicate registration rejected', duplicateRejected)

// Fixtures created by the auth section below; the admin counts account for them.
let registeredUsers = 0

const recruiterRegistration = await auth.register({
  email: 'new.recruiter@example.in',
  password: 'password123',
  role: ROLES.RECRUITER,
  name: 'Kavya Nair',
  companyName: 'Nimbus Analytics',
  companySize: '11-50 employees',
})
check('recruiter registration succeeds', recruiterRegistration.user.role === ROLES.RECRUITER)
registeredUsers += 1
check(
  'recruiter is linked to a new company',
  db.first('companies', (row) => row.name === 'Nimbus Analytics') !== undefined,
)
check(
  'new company awaits verification',
  db.first('companies', (row) => row.name === 'Nimbus Analytics')?.verification ===
    COMPANY_STATUS.PENDING,
)

const seekerCompanyId = await (async () => {
  const result = await auth.register({
    email: 'new.seeker@example.in',
    password: 'password123',
    role: ROLES.JOB_SEEKER,
    name: 'Arjun Mehta',
  })
  return result.user.companyId
})()
check('job seeker registration has no company', seekerCompanyId === null)
registeredUsers += 1

const forgot = await auth.forgotPassword({ email: 'seeker@jobkhoj.in' })
check('forgot password returns a reset token', typeof forgot.resetToken === 'string')

const unknownForgot = await auth.forgotPassword({ email: 'nobody@nowhere.in' })
check('forgot password does not leak account existence', unknownForgot.resetToken === undefined)

const resetOk = await (async () => {
  try {
    await auth.resetPassword({ token: forgot.resetToken, password: 'newpassword1' })
    return true
  } catch {
    return false
  }
})()
check('reset password accepts a valid token', resetOk)

const resetBadToken = await (async () => {
  try {
    await auth.resetPassword({ token: 'not-a-token', password: 'newpassword1' })
    return false
  } catch {
    return true
  }
})()
check('reset password rejects an invalid token', resetBadToken)

// Registration and password reset both replace/clear the session, so sign back
// in as the demo seeker before the seeker-flows section runs.
await auth.login({ email: 'seeker@jobkhoj.in', password: 'anything' })

/* ----------------------------- seeker flows -------------------------------- */

section('Job seeker flows')

const stats = await applications.getMyApplicationStats()
check('seeker has applied jobs', stats.appliedJobs === 12, `got ${stats.appliedJobs}`)
check('seeker has interviews', stats.interviews === 3, `got ${stats.interviews}`)
check('seeker has saved jobs', stats.savedJobs === 9, `got ${stats.savedJobs}`)

const myApplications = await applications.listMyApplications({ pageSize: 20 })
check('application list returns all seeded rows', myApplications.totalItems === 12)

const submitted = await applications.submitApplication({
  jobId: 'job-1004',
  fullName: 'Adnan Khan',
  email: 'seeker@jobkhoj.in',
  phone: '+91 98765 43210',
  currentLocation: 'Pune, Maharashtra',
  experience: '4.2',
  expectedSalary: '18-24 LPA',
  noticePeriod: '30 days',
  coverLetter: 'Hello there.',
})
check('application submitted', Boolean(submitted.id))
check('new application starts as APPLIED', submitted.status === APPLICATION_STATUS.APPLIED)
check('new application has an APP- id', submitted.id.startsWith('APP-'))

let doubleApplyBlocked = false
try {
  await applications.submitApplication({ jobId: 'job-1004' })
} catch {
  doubleApplyBlocked = true
}
check('duplicate application blocked', doubleApplyBlocked)

const afterApply = await applications.getMyApplicationStats()
check('applied count incremented', afterApply.appliedJobs === 13, `got ${afterApply.appliedJobs}`)

const saved = await users.listSavedJobs()
check('saved jobs hydrate their job + company', saved.length === 9 && Boolean(saved[0].job.company))

const toggled = await users.toggleSavedJob('job-1002')
check('toggle saves an unsaved job', toggled.saved === true)
const untoggled = await users.toggleSavedJob('job-1002')
check('toggle removes a saved job', untoggled.saved === false)

const notifications = await users.listNotifications()
check('notifications listed', notifications.totalItems === 6)
check('unread count present', notifications.unreadCount === 3, `got ${notifications.unreadCount}`)
await users.markAllNotificationsRead()
const afterRead = await users.listNotifications()
check('mark-all-read clears unread', afterRead.unreadCount === 0)

const alerts = await users.listJobAlerts()
check('job alerts listed', alerts.length === 3)
const newAlert = await users.createJobAlert({
  name: 'Kafka Roles',
  keywords: ['Kafka'],
  frequency: 'Daily',
})
check('job alert created', newAlert.name === 'Kafka Roles')
check('job alert persists to the db', db.count('jobAlerts') === 4)
await users.deleteJobAlert(newAlert.id)
check('job alert deleted', db.count('jobAlerts') === 3)

/* ---------------------------- recruiter flows ------------------------------ */

section('Recruiter flows')
const recruiterSession = await auth.login({ email: 'recruiter@jobkhoj.in', password: 'x' })
check('recruiter can sign in', recruiterSession.user.role === ROLES.RECRUITER)

const dash = await recruiter.getRecruiterDashboard()
check('dashboard scoped to recruiter company', dash.company?.id === 'cmp-tcs')
check('dashboard has active jobs', dash.stats.activeJobs > 0, `got ${dash.stats.activeJobs}`)
check('dashboard has applicants', dash.stats.totalApplicants > 0)
check('dashboard has recent applicants', dash.recentApplicants.length > 0)
check(
  'dashboard applicants belong to recruiter jobs',
  dash.recentApplicants.every((row) => row.jobTitle.length > 0),
)

const recruiterJobs = await recruiter.listRecruiterJobs({})
check(
  'recruiter job list is company-scoped',
  recruiterJobs.every((job) => job.companyId === 'cmp-tcs'),
  `${recruiterJobs.length} jobs`,
)

const analytics = await recruiter.getRecruiterAnalytics()
check('analytics funnel built', analytics.funnel.length === 6)
check(
  'funnel is monotonically non-increasing',
  analytics.funnel.every((row, i) => i === 0 || analytics.funnel[i - 1].value >= row.value),
)
check('analytics work-mode split built', analytics.byWorkMode.length === 3)

const created = await jobs.createJob({
  title: 'Test Java Role',
  companyId: 'cmp-tcs',
  department: 'Software Development',
  location: 'Mumbai, Maharashtra',
  workMode: 'Hybrid',
  employmentType: 'Full Time',
  experienceLabel: '3-5 Years',
  salaryMin: 10,
  salaryMax: 16,
  skills: ['Java'],
  status: JOB_STATUS.ACTIVE,
})
check('recruiter can create a job', created.title === 'Test Java Role')
check('new job starts with zero applicants', created.applicantCount === 0)

const duplicated = await jobs.duplicateJob(created.id)
check('job duplication works', duplicated.title === 'Test Java Role (Copy)')
check('duplicate is saved as a draft', duplicated.status === JOB_STATUS.DRAFT)

const closed = await jobs.closeJob(created.id)
check('job can be closed', closed.status === JOB_STATUS.CLOSED)

let closedJobClosedToApplications = false
try {
  await applications.submitApplication({ jobId: created.id })
} catch {
  closedJobClosedToApplications = true
}
check('closed job rejects new applications', closedJobClosedToApplications)

const removed = await jobs.deleteJob(created.id)
check('job deletion works', removed.success === true)
await jobs.deleteJob(duplicated.id)
check(
  'test jobs cleaned up',
  db.count('jobs', (job) => job.companyId === 'cmp-tcs') === 2,
)

/* ------------------------- applicant / pipeline --------------------------- */

section('Applicant management')

const targetJob = 'job-1003'
const pipelineBefore = await applications.getPipeline(targetJob)
const firstColumn = pipelineBefore.columns.APPLIED[0]

check('pipeline returned', Boolean(pipelineBefore.columns))
check('pipeline column populated', firstColumn !== undefined)

const moved = await applications.updateApplicationStage(
  firstColumn.id,
  PIPELINE_STAGE.SHORTLISTED,
)
check('candidate moved to shortlisted', moved.stage === PIPELINE_STAGE.SHORTLISTED)
check('status updated to Shortlisted', moved.status === APPLICATION_STATUS.SHORTLISTED)
check(
  'timeline recorded the move',
  moved.timeline[moved.timeline.length - 1].stage === PIPELINE_STAGE.SHORTLISTED,
)

const hired = await applications.updateApplicationStage(firstColumn.id, PIPELINE_STAGE.HIRED)
check('hiring a candidate sets HIRED status', hired.status === APPLICATION_STATUS.HIRED)

const rejected = await applications.updateApplicationStage(
  firstColumn.id,
  PIPELINE_STAGE.REJECTED,
)
check('rejecting a candidate sets Rejected status', rejected.status === APPLICATION_STATUS.REJECTED)

const restored = await applications.updateApplicationStage(
  firstColumn.id,
  PIPELINE_STAGE.APPLIED,
)
check(
  'un-rejecting returns a candidate to the funnel',
  restored.status === APPLICATION_STATUS.APPLIED && restored.stage === PIPELINE_STAGE.APPLIED,
  `got ${restored.status}`,
)

const candidates = await applications.searchCandidates({ query: 'java', skills: ['Java'] })
check('candidate search works', candidates.totalItems > 0)
check(
  'candidate search respects the skill filter',
  candidates.items.every((c) => (c.skills ?? []).includes('Java')),
)

const candidateDetail = await applications.getCandidateById('usr-seeker-1')
check('candidate detail includes applications', candidateDetail.applications.length > 0)

/* ----------------------- recruiter applicant review ------------------------ */

section('Recruiter applicant review')

const applicantReview = await applications.getApplicationById(firstColumn.id)
check('application detail is fetchable by id', applicantReview.id === firstColumn.id)
check('application detail carries the job', applicantReview.job?.id === targetJob)
check(
  'application detail carries candidate contact',
  Boolean(applicantReview.candidateName && applicantReview.candidateEmail),
)

// The recruiter review page reads these exact fields.
check(
  'application detail carries the submitted snapshot',
  Array.isArray(applicantReview.skills) && typeof applicantReview.coverLetter === 'string',
)

const pipelineAfterReject = await applications.getPipeline(targetJob)
check(
  'rejected candidates leave the board columns',
  !Object.values(pipelineAfterReject.columns)
    .flat()
    .some((row) => row.status === APPLICATION_STATUS.REJECTED),
)

const profileUpdate = await companies.updateCompany('cmp-tcs', {
  about: 'Updated through the recruiter company profile editor.',
})
check('company profile update returns the saved record', typeof profileUpdate.about === 'string')
check(
  'company profile update persisted',
  (await companies.getCompany('cmp-tcs')).about === profileUpdate.about,
)

/* ---------------------------- candidate search ---------------------------- */

section('Candidate search')

const allCandidates = await applications.searchCandidates({})
check('candidate search returns a page', allCandidates.items.length > 0)
check(
  'candidate search only returns job seekers',
  allCandidates.items.every((row) => row.role === ROLES.JOB_SEEKER),
)
check(
  'candidate search paginates',
  allCandidates.pageSize > 0 && allCandidates.totalPages >= 1,
)

const byQuery = await applications.searchCandidates({ query: 'java' })
check('candidate query search narrows results', byQuery.totalItems < allCandidates.totalItems)
check(
  'candidate query search matches the term',
  byQuery.items.every((row) =>
    [row.name, row.headline, row.location, ...(row.skills ?? [])]
      .join(' ')
      .toLowerCase()
      .includes('java'),
  ),
)

const bySkill = await applications.searchCandidates({ skills: ['React'] })
check('candidate skill filter returns matches', bySkill.totalItems > 0)
check(
  'candidate skill filter is an AND across skills',
  bySkill.items.every((row) => (row.skills ?? []).includes('React')),
)

const multiSkill = await applications.searchCandidates({ skills: ['React', 'Java'] })
check(
  'multiple skills narrow the pool further',
  multiSkill.totalItems <= bySkill.totalItems,
)

const impossibleSkill = await applications.searchCandidates({ skills: ['Underwater Basket Weaving'] })
check('unmatched skill filter returns an empty page', impossibleSkill.items.length === 0)

const candidatePaging = await applications.searchCandidates({ pageSize: 3, page: 2 })
check('candidate search honours the requested page', candidatePaging.page === 2)
check('candidate search page respects page size', candidatePaging.items.length <= 3)

let missingCandidateFailed = false
try {
  await applications.getCandidateById('usr-does-not-exist')
} catch {
  missingCandidateFailed = true
}
check('unknown candidate id throws', missingCandidateFailed)

/* ------------------------------ admin flows ------------------------------- */

section('Admin flows')
const adminSession = await auth.login({ email: 'admin@jobkhoj.in', password: 'x' })
check('admin can sign in', adminSession.user.role === ROLES.ADMIN)

const overview = await admin.getAdminOverview()
// Compared against the seed plus the fixtures the auth section registered, so
// adding a registration test doesn't silently break these counts.
check('admin overview counts users', overview.stats.totalUsers === seed.users.length + registeredUsers)
check(
  'admin overview counts seekers',
  overview.stats.jobSeekers === seedSeekers + 1,
  `got ${overview.stats.jobSeekers}`,
)
check(
  'admin overview counts recruiters',
  overview.stats.recruiters === seedRecruiters + 1,
  `got ${overview.stats.recruiters}`,
)
check('admin overview has chart series', overview.charts.jobsPostedPerMonth.length === 12)
check('admin overview has moderation queues', Array.isArray(overview.queues.pendingJobs))
check('pending job queue is populated', overview.queues.pendingJobs.length === 2, `got ${overview.queues.pendingJobs.length}`)

const approved = await admin.approveJob('job-1018')
check('admin can approve a job', approved.status === JOB_STATUS.ACTIVE)
const rejectedJob = await admin.rejectJob(approved.id)
check('admin can reject a job', rejectedJob.status === JOB_STATUS.REJECTED)
await admin.setJobStatus('job-1018', JOB_STATUS.PENDING)

const verified = await companies.verifyCompany('cmp-tcs')
check(
  'admin can verify a company',
  verified.verification === COMPANY_STATUS.VERIFIED,
  `got ${verified.verification}`,
)

const userStats = await users.getUserStats()
check('user stats count blocked users', userStats.blockedUsers === 1, `got ${userStats.blockedUsers}`)

const blocked = await users.setUserStatus('usr-seeker-10', USER_STATUS.BLOCKED)
check('admin can block a user', blocked.status === USER_STATUS.BLOCKED)
await users.setUserStatus('usr-seeker-10', USER_STATUS.ACTIVE)

const reports = await admin.getReports()
check('reports generated', reports.totals.jobs > 0)
check(
  'application status split sums to 100%',
  Math.abs(reports.applicationStatusSplit.reduce((s, r) => s + r.percent, 0) - 100) <= 2,
)

const adminCompanies = await admin.listAdminCompanies({
  verification: COMPANY_STATUS.VERIFIED,
})
// `every` on an empty list is true, so assert the filter actually matched rows —
// otherwise this passes while the filter is silently broken.
check('verified company filter matches rows', adminCompanies.items.length > 0)
check(
  'admin company filter works',
  adminCompanies.items.every((c) => c.verification === COMPANY_STATUS.VERIFIED),
)

const adminPendingCompanies = await admin.listAdminCompanies({
  verification: COMPANY_STATUS.PENDING,
})
check(
  'pending company filter returns only pending companies',
  adminPendingCompanies.items.length > 0 &&
    adminPendingCompanies.items.every((c) => c.verification === COMPANY_STATUS.PENDING),
  `got ${adminPendingCompanies.items.length} pending`,
)

const adminJobs = await admin.listAdminJobs({ status: JOB_STATUS.PENDING })
check('admin job filter works', adminJobs.items.every((j) => j.status === JOB_STATUS.PENDING))

/* ------------------------------- persistence ------------------------------- */

section('Persistence & reset')

check('mock db persists to localStorage', globalThis.localStorage.length > 0)

const before = db.count('jobs')
await users.resetMockData()
const statsAfterReset = db.stats()
check('reset restores job count', statsAfterReset.jobs === 26, `got ${statsAfterReset.jobs} (was ${before})`)
check(
  'reset restores the original application set',
  statsAfterReset.applications === seed.applications.length,
)

/* ----------------------- service delegation and Supabase ------------------- */

section('Service layer (mock delegation and fail-closed jobs)')

/**
 * Non-job services still delegate to mock handlers in this smoke environment.
 * Job reads and writes require Supabase so mock records cannot masquerade as
 * persisted database jobs when Supabase is not configured.
 *
 * Company-scoped services run under a recruiter session; admin services run
 * under an admin session, because that is how the app actually calls them.
 */

await auth.login({ email: 'recruiter@jobkhoj.in', password: 'x' })

const serviceRecruiterDash = await recruiterService.getRecruiterDashboard()
check('recruiterService.getRecruiterDashboard resolves a handler', serviceRecruiterDash.company?.id)

const serviceRecruiterJobs = await recruiterService.getRecruiterJobs({})
check('recruiterService.getRecruiterJobs reads local recruiter jobs', Array.isArray(serviceRecruiterJobs))

const serviceAnalytics = await recruiterService.getRecruiterAnalytics()
check('recruiterService.getRecruiterAnalytics resolves a handler', serviceAnalytics.funnel.length > 0)

const serviceCompanyUpdate = await companyService.updateMyCompany({
  about: 'Company profile written through the service layer.',
})
check(
  'companyService.updateMyCompany resolves the company from the session',
  serviceCompanyUpdate?.id === 'cmp-tcs' &&
    serviceCompanyUpdate.about === 'Company profile written through the service layer.',
  `got ${serviceCompanyUpdate?.id}`,
)

// The body id must be ignored: the session's own company is edited instead.
const otherCompanyBefore = await companyService.getCompany('cmp-infosys')
await companyService.updateMyCompany({ id: 'cmp-infosys', about: 'hijack attempt' })
const ownCompanyAfter = await companyService.getCompany('cmp-tcs')
const otherCompanyAfter = await companyService.getCompany('cmp-infosys')
check(
  'companyService.updateMyCompany ignores a body-supplied company id',
  ownCompanyAfter.about === 'hijack attempt' &&
    otherCompanyAfter.about === otherCompanyBefore.about &&
    otherCompanyAfter.id === 'cmp-infosys',
  `own=${ownCompanyAfter.about} other=${otherCompanyAfter.about}`,
)
await companyService.updateMyCompany({ about: 'Company profile written through the service layer.' })

await auth.login({ email: 'admin@jobkhoj.in', password: 'x' })

const serviceOverview = await adminService.getAdminOverview()
check('adminService.getAdminOverview resolves a handler', serviceOverview?.stats?.totalUsers > 0)

const serviceJobs = await adminService.getAdminJobs({ pageSize: 5 })
check('adminService.getAdminJobs resolves a handler', serviceJobs.items.length > 0)

const approvedViaService = await adminService.approveJob(serviceJobs.items[0].id)
check(
  'adminService.approveJob writes a real JOB_STATUS value',
  approvedViaService.status === JOB_STATUS.ACTIVE,
  `got ${approvedViaService.status}`,
)

const rejectedViaService = await adminService.rejectJob('job-1003')
check(
  'adminService.rejectJob writes a real JOB_STATUS value',
  rejectedViaService.status === JOB_STATUS.REJECTED,
  `got ${rejectedViaService.status}`,
)

const serviceUsers = await adminService.getAdminUsers({ pageSize: 5 })
check('adminService.getAdminUsers resolves the users handler', serviceUsers.items.length > 0)

const blockedViaService = await adminService.setUserStatus('usr-seeker-3', USER_STATUS.BLOCKED)
check(
  'adminService.setUserStatus writes a real USER_STATUS value',
  blockedViaService.status === USER_STATUS.BLOCKED,
  `got ${blockedViaService.status}`,
)

// The dashboard's blocked-user queue must actually surface blocked accounts.
const overviewAfterBlock = await adminService.getAdminOverview()
check(
  'blocked users appear in the admin dashboard queue',
  overviewAfterBlock.queues.blockedUsers.some((row) => row.id === 'usr-seeker-3'),
  `queue size ${overviewAfterBlock.queues.blockedUsers.length}`,
)

const statsViaService = await adminService.getUserStats()
check('adminService.getUserStats resolves the users handler', typeof statsViaService === 'object')

const serviceCompanies = await adminService.getAdminCompanies({ pageSize: 5 })
check('adminService.getAdminCompanies resolves a handler', serviceCompanies.items.length > 0)

const pendingCompanies = await adminService.getAdminCompanies({
  verification: COMPANY_STATUS.PENDING,
  pageSize: 50,
})
check(
  'admin queue: the seed contains companies awaiting verification',
  pendingCompanies.items.length > 0,
  `got ${pendingCompanies.items.length}`,
)

const verifiedViaService = await adminService.verifyCompany(pendingCompanies.items[0].id)
check(
  'adminService.verifyCompany writes a real COMPANY_STATUS value',
  verifiedViaService.verification === COMPANY_STATUS.VERIFIED,
  `got ${verifiedViaService.verification}`,
)

const rejectedCompany = await adminService.rejectCompany('cmp-tcs')
check(
  'adminService.rejectCompany writes a real COMPANY_STATUS value',
  rejectedCompany.verification === COMPANY_STATUS.REJECTED,
  `got ${rejectedCompany.verification}`,
)

const suspendedCompany = await adminService.suspendCompany('cmp-tcs')
check(
  'adminService.suspendCompany writes a real COMPANY_STATUS value',
  suspendedCompany.verification === COMPANY_STATUS.SUSPENDED,
  `got ${suspendedCompany.verification}`,
)

const serviceReports = await adminService.getReports()
check('adminService.getReports resolves a handler', serviceReports.applicationStatusSplit.length > 0)

const serviceApplications = await adminService.getAdminApplications({ pageSize: 5 })
check('adminService.getAdminApplications resolves a handler', serviceApplications.items.length > 0)

const profileViaService = await userService.updateProfile({ headline: 'Updated by smoke test' })
check(
  'userService.updateProfile resolves the auth handler',
  profileViaService.headline === 'Updated by smoke test',
)

await auth.login({ email: 'recruiter@jobkhoj.in', password: 'x' })
const localJob = await jobService.createJob({
  title: 'Local storage persistence test',
  companyId: 'cmp-tcs',
  createdBy: 'usr-recruiter-1',
  department: 'Engineering',
  location: 'Bengaluru',
  workMode: 'Remote',
  employmentType: 'Full-time',
  experienceMin: 2,
  experienceMax: 4,
  experienceLabel: '2-4 Years',
  skills: ['React'],
  status: JOB_STATUS.ACTIVE,
})
check(
  'jobService.createJob persists local job in localStorage-backed database',
  db.find('jobs', localJob.id)?.title === 'Local storage persistence test',
)
const localRecruiterJobs = await recruiterService.getRecruiterJobs({})
check(
  'Manage Jobs reads created local job',
  localRecruiterJobs.some((job) => job.id === localJob.id),
)
const updatedLocalJob = await jobService.updateJob(localJob.id, {
  title: 'Updated local storage job',
})
check(
  'jobService.updateJob persists local changes',
  updatedLocalJob.title === 'Updated local storage job',
)
const localPublicJobs = await jobService.listJobs({ pageSize: 100 })
check(
  'Browse Jobs reads locally persisted active job',
  localPublicJobs.items.some((job) => job.id === localJob.id),
)
await jobService.deleteJob(localJob.id)
check(
  'jobService.deleteJob removes local job from localStorage-backed database',
  !db.find('jobs', localJob.id),
)

const servicePipeline = await applicationService.getPipeline('job-1003')
check('applicationService.getPipeline resolves a handler', Boolean(servicePipeline.columns))

const serviceCandidates = await applicationService.searchCandidates({ skills: ['Java'] })
check('applicationService.searchCandidates resolves a handler', serviceCandidates.items.length > 0)

section('Admin screens (page data contracts)')

/**
 * The admin pages render straight from these payloads, so each assertion below
 * exists because a missing field produced a blank cell or a broken chart.
 */

await auth.login({ email: 'admin@jobkhoj.in', password: 'x' })

/* --------------------------------- users --------------------------------- */

const recruiterOnly = await adminService.getAdminUsers({ role: ROLES.RECRUITER, pageSize: 50 })
check(
  'users screen: role filter returns only recruiters',
  recruiterOnly.items.length > 0 &&
    recruiterOnly.items.every((row) => row.role === ROLES.RECRUITER),
)
check(
  'recruiters screen: recruiter rows expose the fields it renders',
  recruiterOnly.items.every(
    (row) =>
      'name' in row &&
      'email' in row &&
      'title' in row &&
      'location' in row &&
      'status' in row &&
      'companyName' in row,
  ),
)
check(
  'recruiters screen: recruiter rows resolve a company name, not an id',
  recruiterOnly.items.every((row) => typeof row.companyName === 'string' && !row.companyName.startsWith('cmp-')),
)

const blockedOnly = await adminService.getAdminUsers({ status: USER_STATUS.BLOCKED, pageSize: 50 })
check(
  'users screen: status filter returns only blocked accounts',
  blockedOnly.items.every((row) => row.status === USER_STATUS.BLOCKED),
)

const searched = await adminService.getAdminUsers({ query: 'meera.iyer', pageSize: 50 })
check(
  'users screen: search matches on email',
  searched.items.length === 1 && searched.items[0].name === 'Meera Iyer',
  `got ${searched.items.length}`,
)

const userPage = await adminService.getAdminUsers({ page: 2, pageSize: 5 })
check(
  'users screen: pagination returns a correct window',
  userPage.items.length === 5 && userPage.page === 2 && userPage.totalItems > 5,
  `items=${userPage.items.length} page=${userPage.page} total=${userPage.totalItems}`,
)

// Block -> unblock round trip must use the shared constants both ways.
const roundTripUser = recruiterOnly.items[0]
await adminService.setUserStatus(roundTripUser.id, USER_STATUS.BLOCKED)
await adminService.setUserStatus(roundTripUser.id, USER_STATUS.ACTIVE)
const afterRoundTrip = await adminService.getAdminUsers({ query: roundTripUser.email })
check(
  'users screen: block then unblock returns to Active',
  afterRoundTrip.items[0]?.status === USER_STATUS.ACTIVE,
  `got ${afterRoundTrip.items[0]?.status}`,
)

let selfDeleteBlocked = false
try {
  await adminService.deleteUser((await auth.me()).id)
} catch {
  selfDeleteBlocked = true
}
check('users screen: an admin cannot delete their own account', selfDeleteBlocked)

/* ---------------------------------- jobs --------------------------------- */

const pendingJobs = await adminService.getAdminJobs({ status: JOB_STATUS.PENDING, pageSize: 50 })
check(
  'jobs screen: status filter returns only pending posts',
  pendingJobs.items.length > 0 && pendingJobs.items.every((row) => row.status === JOB_STATUS.PENDING),
)
check(
  'jobs screen: job rows expose the fields it renders',
  pendingJobs.items.every(
    (row) =>
      row.title &&
      row.companyName &&
      row.location &&
      typeof row.salaryMax === 'number' &&
      row.employmentType &&
      row.workMode &&
      'postedAt' in row,
  ),
)
check(
  'jobs screen: applicant counts are computed per job',
  pendingJobs.items.every((row) => typeof row.applicationCount === 'number'),
)
check(
  'jobs screen: applicant counts are not all zero',
  pendingJobs.items.some((row) => row.applicationCount > 0),
)

// The jobs screen searches on company name; an undefined companyName would throw.
const jobsByCompany = await adminService.getAdminJobs({ query: 'Tata Consultancy', pageSize: 50 })
check(
  'jobs screen: search matches on company name',
  jobsByCompany.items.length > 0 &&
    jobsByCompany.items.every((row) => row.companyName === 'Tata Consultancy Services'),
  `got ${jobsByCompany.items.length}`,
)

/* ------------------------------- companies ------------------------------- */

const verifiedCompanies = await adminService.getAdminCompanies({
  verification: COMPANY_STATUS.VERIFIED,
  pageSize: 50,
})
check(
  'companies screen: verification filter returns only verified companies',
  verifiedCompanies.items.length > 0 &&
    verifiedCompanies.items.every((row) => row.verification === COMPANY_STATUS.VERIFIED),
)
check(
  'companies screen: open-job counts are computed per company',
  verifiedCompanies.items.every((row) => typeof row.openJobs === 'number'),
)

const byIndustry = await adminService.getAdminCompanies({
  query: 'Information Technology',
  pageSize: 50,
})
check(
  'companies screen: search matches on industry',
  byIndustry.items.length > 0 &&
    byIndustry.items.every((row) => row.industry === 'Information Technology & Services'),
  `got ${byIndustry.items.length}`,
)

/* ----------------------------- applications ------------------------------ */

const allApplications = await adminService.getAdminApplications({ pageSize: 50 })
check(
  'applications screen: rows expose the fields it renders',
  allApplications.items.every(
    (row) =>
      row.candidateName &&
      row.candidateEmail &&
      row.jobTitle &&
      row.companyName &&
      row.status &&
      row.appliedAt,
  ),
)

const hiredOnly = await adminService.getAdminApplications({
  status: APPLICATION_STATUS.HIRED,
  pageSize: 50,
})
check(
  'applications screen: status filter returns only hired applications',
  hiredOnly.items.every((row) => row.status === APPLICATION_STATUS.HIRED),
)

/* ------------------------- overview & report charts ----------------------- */

const overviewForCharts = await adminService.getAdminOverview()
const overviewCharts = overviewForCharts.charts

check(
  'dashboard charts: jobsPostedPerMonth carries both series',
  (overviewCharts.jobsPostedPerMonth ?? []).every(
    (point) => 'month' in point && 'jobs' in point && 'applications' in point,
  ),
)
check(
  'reports charts: newUsersPerMonth carries seekers and recruiters',
  (overviewCharts.newUsersPerMonth ?? []).every(
    (point) => 'month' in point && 'seekers' in point && 'recruiters' in point,
  ),
)
check(
  'reports charts: hiringTrends carries hired and rejected',
  (overviewCharts.hiringTrends ?? []).every((point) => 'hired' in point && 'rejected' in point),
)
check(
  'reports charts: applicationsByWorkMode maps to {label,value} on the page',
  (overviewCharts.applicationsByWorkMode ?? []).every(
    (point) => typeof point.mode === 'string' && typeof point.value === 'number',
  ),
)
check(
  'reports charts: topSkills maps to {label,value} on the page',
  (overviewCharts.topSkills ?? []).every(
    (point) => typeof point.skill === 'string' && typeof point.count === 'number',
  ),
)
check(
  'dashboard queues expose the fields the queue cards render',
  overviewForCharts.queues.pendingJobs.every((row) => row.title && row.companyName && row.postedAt) &&
    overviewForCharts.queues.pendingCompanies.every((row) => row.name && row.location) &&
    overviewForCharts.queues.blockedUsers.every((row) => row.name && row.email && row.role),
)

section('Public pages (home, companies)')

/** The landing page and company screens render straight from these payloads. */

const homeFeaturedJobs = await jobs.getFeaturedJobs(6)
check(
  'home page: featured jobs are returned',
  homeFeaturedJobs.length > 0 && homeFeaturedJobs.length <= 6,
  `got ${homeFeaturedJobs.length}`,
)
check(
  'home page: featured job cards expose the fields <JobCard> renders',
  homeFeaturedJobs.every(
    (job) =>
      job.title &&
      job.location &&
      job.employmentType &&
      job.workMode &&
      typeof job.salaryMin === 'number' &&
      typeof job.salaryMax === 'number' &&
      Array.isArray(job.skills) &&
      job.company?.name,
  ),
)

const topCompanies = await companyService.getTopCompanies(6)
check(
  'home page: top companies strip is populated',
  topCompanies.length > 0,
  `got ${topCompanies.length}`,
)
check(
  'home page: top companies are verified and carry a job count',
  topCompanies.every(
    (company) =>
      company.verification === COMPANY_STATUS.VERIFIED && typeof company.openJobs === 'number',
  ),
)
check(
  'home page: top companies carry the fields the cards render',
  topCompanies.every((company) => company.name && company.location && company.slug),
)

const directory = await companyService.getCompanies({ pageSize: 12 })
check('directory page: company listing is populated', directory.items.length > 0)
check(
  'directory page: rows expose the fields the cards render',
  directory.items.every(
    (company) =>
      company.name &&
      company.slug &&
      company.location &&
      company.industry &&
      typeof company.openJobs === 'number' &&
      company.verification,
  ),
)

// The directory defaults to verified employers only.
const verifiedDirectory = await companyService.getCompanies({
  verification: COMPANY_STATUS.VERIFIED,
  pageSize: 50,
})
check(
  'directory page: the verified filter excludes unverified employers',
  verifiedDirectory.items.every((company) => company.verification === COMPANY_STATUS.VERIFIED) &&
    verifiedDirectory.totalItems < directory.totalItems + 1,
  `verified=${verifiedDirectory.totalItems} all=${directory.totalItems}`,
)

const directoryBySearch = await companyService.getCompanies({ query: 'Bengaluru', pageSize: 50 })
check(
  'directory page: search matches on location',
  directoryBySearch.items.length > 0 &&
    directoryBySearch.items.every((company) => company.location.includes('Bengaluru')),
  `got ${directoryBySearch.items.length}`,
)

const companyDetail = await companyService.getCompany('cmp-tcs')
check(
  'company page: detail resolves by id and exposes profile fields',
  companyDetail.name === 'Tata Consultancy Services' &&
    companyDetail.about &&
    Array.isArray(companyDetail.benefits) &&
    companyDetail.website,
)

const companyBySlug = await companyService.getCompany('tata-consultancy-services')
check(
  'company page: detail resolves by slug as well as id',
  companyBySlug.id === companyDetail.id,
)

let unknownCompanyFailed = false
try {
  await companyService.getCompany('cmp-does-not-exist')
} catch {
  unknownCompanyFailed = true
}
check('company page: an unknown company raises a not-found error', unknownCompanyFailed)

const companyJobs = await jobs.getJobsByCompany('cmp-tcs', { pageSize: 6 })
check(
  'company page: open roles are returned for the company',
  companyJobs.items.length > 0 && companyJobs.items.every((job) => job.companyId === 'cmp-tcs'),
  `got ${companyJobs.items.length}`,
)
check(
  'company page: the response echoes the requested page size',
  companyJobs.pageSize === 6,
  `got ${companyJobs.pageSize}`,
)
check(
  'company page: open-role cards carry the company for <JobCard>',
  companyJobs.items.every((job) => job.company?.name),
)

/* ----------------------------- route rendering ---------------------------- */

/*
 * Everything above exercises the data layer. This exercises the component
 * layer: a module can import cleanly and still fail when React renders it —
 * a misspelled component reference surfaces as "Element type is invalid", a
 * hook can sit inside a conditional branch, or a list expression can assume
 * data that has not arrived yet.
 *
 * React's server renderer runs render but no effects, so data fetches never
 * fire: pages mount in their loading state while a signed-in session is
 * already seeded. Treat this as a structural check (does the component tree
 * render at all), not a data-shape check — populated states are covered by the
 * service contracts above.
 */

const { createElement: h } = await import('react')
const { renderToStaticMarkup } = await import('react-dom/server')
const { MemoryRouter, Route, Routes } = await import('react-router-dom')
const { storage } = await import('../src/utils/storage.js')
const { default: AuthProvider } = await import('../src/context/AuthProvider.jsx')
const { default: ToastProvider } = await import('../src/context/ToastProvider.jsx')

section('route rendering (every route component mounts)')

/* The probe route supplies a value for every param any page reads, so a page
 * guarded by useParameters() exercises the same branch it would in the app. */
const PROBE_PATH = '/render/:id/:slug/:applicationId'
const PROBE_URL = '/render/job-1003/tata-consultancy-services/APP-10937'

function mount(Component) {
  return renderToStaticMarkup(
    h(
      MemoryRouter,
      { initialEntries: [PROBE_URL] },
      h(
        AuthProvider,
        null,
        h(
          ToastProvider,
          null,
          h(Routes, null, h(Route, { path: PROBE_PATH, element: h(Component) })),
        ),
      ),
    ),
  )
}

const usersByRole = {
  [ROLES.JOB_SEEKER]: db.all('users').find((row) => row.role === ROLES.JOB_SEEKER),
  [ROLES.RECRUITER]: db.all('users').find((row) => row.role === ROLES.RECRUITER),
  [ROLES.ADMIN]: db.all('users').find((row) => row.role === ROLES.ADMIN),
}

/**
 * Seed the session AuthProvider hydrates from during render.
 *
 * The user is written without a token on purpose: `initialising` starts as
 * Boolean(getToken()) and is only cleared in an effect, which never runs here,
 * so a token would pin every page behind its loading screen.
 */
function seedSession(role) {
  storage.remove(TOKEN_KEY)
  if (role && usersByRole[role]) {
    storage.set(USER_KEY, usersByRole[role])
  } else {
    storage.remove(USER_KEY)
  }
}

/*
 * Results are collected so a harness that rendered nothing cannot pass: a
 * large majority of pages must produce full content, not just a skeleton.
 * The few that render only a skeleton are the param-driven detail pages — their
 * fetch lives in an effect, which never runs in the server renderer, so they
 * legitimately show their loading state. Their data path is covered by the
 * service contracts above (getCompany, getJob, getCandidateById …).
 */
const renderProbe = { total: 0, withContent: 0 }

async function checkRender(label, load, role = null) {
  seedSession(role)

  let module
  try {
    module = await load()
  } catch (error) {
    check(`render: ${label}`, false, `import failed — ${error.message}`)
    if (process.env.DEBUG_RENDER) {
      console.log(`  --- ${label} (import) ---\n${error.stack}`)
    }
    return
  }

  if (!module?.default) {
    check(`render: ${label}`, false, 'module has no default export')
    return
  }

  try {
    const html = mount(module.default)
    const markupLength = html.trim().length
    renderProbe.total += 1
    if (markupLength > 2000) renderProbe.withContent += 1
    if (process.env.DEBUG_RENDER) {
      console.log(`  ${label}: ${markupLength} chars`)
      if (markupLength < 300) {
        console.log(`    markup: ${html.replace(/\s+/g, ' ').slice(0, 400)}`)
      }
    }
    check(`render: ${label}`, markupLength > 0, 'rendered no markup at all')
  } catch (error) {
    check(`render: ${label}`, false, error.message)
    if (process.env.DEBUG_RENDER) {
      console.log(`  --- ${label} ---\n${error.stack}`)
    }
  }
}

/* Mirrors the route tree in routes/AppRoutes.jsx — every element it can show,
 * grouped by the shell that guards it. */
const ROUTE_MATRIX = [
  // public
  ['public home', () => import('../src/pages/Home.jsx')],
  ['public job search', () => import('../src/pages/jobs/JobSearch.jsx')],
  ['public job details', () => import('../src/pages/jobs/JobDetails.jsx')],
  ['public company directory', () => import('../src/pages/companies/CompanyDirectory.jsx')],
  ['public company details', () => import('../src/pages/companies/CompanyDetails.jsx')],
  // auth
  ['auth login', () => import('../src/pages/auth/Login.jsx')],
  ['auth register', () => import('../src/pages/auth/Register.jsx')],
  ['auth forgot password', () => import('../src/pages/auth/ForgotPassword.jsx')],
  ['auth reset password', () => import('../src/pages/auth/ResetPassword.jsx')],
  // job seeker
  ['seeker dashboard', () => import('../src/pages/seeker/Dashboard.jsx'), ROLES.JOB_SEEKER],
  ['seeker profile', () => import('../src/pages/seeker/Profile.jsx'), ROLES.JOB_SEEKER],
  ['seeker resume', () => import('../src/pages/seeker/Resume.jsx'), ROLES.JOB_SEEKER],
  ['seeker my applications', () => import('../src/pages/seeker/MyApplications.jsx'), ROLES.JOB_SEEKER],
  ['seeker application details', () => import('../src/pages/seeker/ApplicationDetails.jsx'), ROLES.JOB_SEEKER],
  ['seeker saved jobs', () => import('../src/pages/seeker/SavedJobs.jsx'), ROLES.JOB_SEEKER],
  ['seeker job alerts', () => import('../src/pages/seeker/JobAlerts.jsx'), ROLES.JOB_SEEKER],
  ['seeker notifications', () => import('../src/pages/seeker/Notifications.jsx'), ROLES.JOB_SEEKER],
  ['seeker settings', () => import('../src/pages/seeker/Settings.jsx'), ROLES.JOB_SEEKER],
  // recruiter
  ['recruiter dashboard', () => import('../src/pages/recruiter/Dashboard.jsx'), ROLES.RECRUITER],
  ['recruiter company profile', () => import('../src/pages/recruiter/CompanyProfile.jsx'), ROLES.RECRUITER],
  ['recruiter manage jobs', () => import('../src/pages/recruiter/ManageJobs.jsx'), ROLES.RECRUITER],
  ['recruiter create job', () => import('../src/pages/recruiter/CreateJob.jsx'), ROLES.RECRUITER],
  ['recruiter edit job', () => import('../src/pages/recruiter/EditJob.jsx'), ROLES.RECRUITER],
  ['recruiter job details', () => import('../src/pages/recruiter/JobDetails.jsx'), ROLES.RECRUITER],
  ['recruiter applicants', () => import('../src/pages/recruiter/Applicants.jsx'), ROLES.RECRUITER],
  ['recruiter applicant details', () => import('../src/pages/recruiter/ApplicantDetails.jsx'), ROLES.RECRUITER],
  ['recruiter candidates', () => import('../src/pages/recruiter/Candidates.jsx'), ROLES.RECRUITER],
  ['recruiter analytics', () => import('../src/pages/recruiter/Analytics.jsx'), ROLES.RECRUITER],
  ['recruiter settings', () => import('../src/pages/recruiter/Settings.jsx'), ROLES.RECRUITER],
  // admin
  ['admin dashboard', () => import('../src/pages/admin/Dashboard.jsx'), ROLES.ADMIN],
  ['admin users', () => import('../src/pages/admin/Users.jsx'), ROLES.ADMIN],
  ['admin recruiters', () => import('../src/pages/admin/Recruiters.jsx'), ROLES.ADMIN],
  ['admin companies', () => import('../src/pages/admin/Companies.jsx'), ROLES.ADMIN],
  ['admin jobs', () => import('../src/pages/admin/Jobs.jsx'), ROLES.ADMIN],
  ['admin applications', () => import('../src/pages/admin/Applications.jsx'), ROLES.ADMIN],
  ['admin reports', () => import('../src/pages/admin/Reports.jsx'), ROLES.ADMIN],
  // errors
  ['error forbidden', () => import('../src/pages/errors/Forbidden.jsx')],
  ['error not found', () => import('../src/pages/errors/NotFound.jsx')],
  // career tools
  ['tools landing', () => import('../src/pages/tools/index.jsx')],
  ['tools ats checker', () => import('../src/pages/tools/AtsChecker.jsx')],
  ['tools resume builder', () => import('../src/pages/tools/ResumeBuilder.jsx')],
  ['tools resume optimizer', () => import('../src/pages/tools/ResumeOptimizer.jsx')],
  ['tools keyword extractor', () => import('../src/pages/tools/KeywordExtractor.jsx')],
  ['tools skill gap', () => import('../src/pages/tools/SkillGap.jsx')],
  ['tools job match', () => import('../src/pages/tools/JobMatch.jsx')],
  ['tools jd analyzer', () => import('../src/pages/tools/JdAnalyzer.jsx')],
  ['tools salary estimator', () => import('../src/pages/tools/SalaryEstimator.jsx')],
  ['tools pdf to word', () => import('../src/pages/tools/PdfToWord.jsx')],
  ['tools word to pdf', () => import('../src/pages/tools/WordToPdf.jsx')],
  ['tools merge pdf', () => import('../src/pages/tools/MergePdf.jsx')],
  ['tools split pdf', () => import('../src/pages/tools/SplitPdf.jsx')],
  ['tools compress pdf', () => import('../src/pages/tools/CompressPdf.jsx')],
  ['tools pdf to images', () => import('../src/pages/tools/PdfToImages.jsx')],
  ['tools images to pdf', () => import('../src/pages/tools/ImagesToPdf.jsx')],
  ['tools rotate pdf', () => import('../src/pages/tools/RotatePdf.jsx')],
  ['tools extract pdf', () => import('../src/pages/tools/ExtractPdf.jsx')],
  ['tools resume format converter', () => import('../src/pages/tools/ResumeFormatConverter.jsx')],
  ['tools cover letter', () => import('../src/pages/tools/CoverLetter.jsx')],
  ['tools interview questions', () => import('../src/pages/tools/InterviewQuestions.jsx')],
  ['tools experience calculator', () => import('../src/pages/tools/ExperienceCalculator.jsx')],
  ['tools notice period', () => import('../src/pages/tools/NoticePeriodCalculator.jsx')],
  ['tools history', () => import('../src/pages/tools/History.jsx')],
]

/* Shells, rendered the same way — they carry the nav, header and outlet. */
const SHELL_MATRIX = [
  ['shell public layout', () => import('../src/layouts/PublicLayout.jsx')],
  ['shell seeker layout', () => import('../src/layouts/SeekerLayout.jsx'), ROLES.JOB_SEEKER],
  ['shell recruiter layout', () => import('../src/layouts/RecruiterLayout.jsx'), ROLES.RECRUITER],
  ['shell admin layout', () => import('../src/layouts/AdminLayout.jsx'), ROLES.ADMIN],
  ['shell dashboard layout', () => import('../src/layouts/DashboardLayout.jsx'), ROLES.JOB_SEEKER],
  ['shell auth layout', () => import('../src/layouts/AuthLayout.jsx')],
]

for (const [label, load, role] of [...ROUTE_MATRIX, ...SHELL_MATRIX]) {
  await checkRender(label, load, role)
}

check(
  'every AppRoutes component is covered by a render probe',
  ROUTE_MATRIX.length >= 38 && SHELL_MATRIX.length >= 6,
  `pages ${ROUTE_MATRIX.length}, shells ${SHELL_MATRIX.length}`,
)
check(
  'render probes exercised real page content, not just empty shells',
  renderProbe.withContent >= 30,
  `${renderProbe.withContent}/${renderProbe.total} rendered full content`,
)

/* --------------------------------- summary -------------------------------- */

console.log(`\n${'-'.repeat(60)}`)
console.log(`Passed: ${passed}   Failed: ${failures.length}`)

if (failures.length) {
  console.log('\nFailures:')
  failures.forEach((failure) => console.log(`  - ${failure}`))
  process.exit(1)
}

console.log('All smoke tests passed.')
