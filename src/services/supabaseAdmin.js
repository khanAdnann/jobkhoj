import {
  APPLICATION_STATUS,
  COMPANY_STATUS,
  JOB_STATUS,
  ROLES,
  USER_STATUS,
} from '@/utils/constants'
import { requireSupabase } from './supabaseClient'

const JOB_COLUMNS =
  'id,company_id,company_name,title,department,location,work_mode,employment_type,experience_min,experience_max,experience_label,salary_min,salary_max,skills,preferred_skills,education,description,responsibilities,requirements,benefits,openings,featured,status,posted_at,deadline,views,applicant_count,created_at,updated_at'
const COMPANY_COLUMNS =
  'id,name,slug,industry,website,location,size,founded,about,benefits,social,verification,owner_id,verified_at,created_at,updated_at'
const PROFILE_COLUMNS =
  'id,name,email,phone,role,company_name,company_size,company_id,recruiter_approved,status,created_at,updated_at'

function fail(error, operation) {
  if (!error) return
  console.error(`[supabase admin] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
  throw new Error(`Supabase ${operation} failed: ${error.message}`)
}

async function adminClient() {
  const client = requireSupabase()
  const { data: auth, error: authError } = await client.auth.getUser()
  fail(authError, 'get current user')
  if (!auth.user) throw new Error('Sign in with an administrator account.')
  const { data: profile, error } = await client
    .from('profiles')
    .select('role,status')
    .eq('id', auth.user.id)
    .single()
  fail(error, 'verify administrator access')
  if (profile.role !== ROLES.ADMIN || profile.status !== USER_STATUS.ACTIVE) {
    throw new Error('Administrator access is required.')
  }
  return client
}

function pageResult(items, count, page, pageSize) {
  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  return {
    items,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

function mapJob(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    company: row.company_name ? { id: row.company_id, name: row.company_name } : null,
    title: row.title,
    department: row.department,
    location: row.location,
    workMode: row.work_mode,
    employmentType: row.employment_type,
    experienceMin: row.experience_min,
    experienceMax: row.experience_max,
    experienceLabel: row.experience_label,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    skills: row.skills ?? [],
    preferredSkills: row.preferred_skills ?? [],
    education: row.education ?? '',
    description: row.description ?? '',
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    openings: row.openings,
    featured: row.featured,
    status: row.status,
    postedAt: row.posted_at,
    deadline: row.deadline,
    views: row.views ?? 0,
    applicantCount: row.applicant_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCompany(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    industry: row.industry,
    website: row.website,
    location: row.location,
    size: row.size,
    founded: row.founded,
    about: row.about,
    benefits: row.benefits ?? [],
    social: row.social ?? {},
    verification: row.verification,
    ownerId: row.owner_id,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapProfile(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    companyName: row.company_name,
    companySize: row.company_size,
    companyId: row.company_id,
    recruiterApproved: row.recruiter_approved,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function filterQuery(query, fields) {
  const text = String(query ?? '').trim().replace(/[^a-zA-Z0-9\s-]/g, ' ')
  return text ? fields.map((field) => `${field}.ilike.%${text}%`).join(',') : ''
}

function buildMonthlySeries(jobs, applications, profiles) {
  const months = new Map()
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() - offset)
    const key = date.toISOString().slice(0, 7)
    months.set(key, {
      month: date.toLocaleString('en', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      jobs: 0,
      applications: 0,
      seekers: 0,
      recruiters: 0,
      hired: 0,
      rejected: 0,
    })
  }
  jobs.forEach((row) => {
    const month = months.get(String(row.created_at ?? '').slice(0, 7))
    if (month) month.jobs += 1
  })
  applications.forEach((row) => {
    const month = months.get(String(row.applied_at ?? '').slice(0, 7))
    if (!month) return
    month.applications += 1
    if (row.status === APPLICATION_STATUS.HIRED) month.hired += 1
    if (row.status === APPLICATION_STATUS.REJECTED) month.rejected += 1
  })
  profiles.forEach((row) => {
    const month = months.get(String(row.created_at ?? '').slice(0, 7))
    if (!month) return
    if (row.role === ROLES.JOB_SEEKER) month.seekers += 1
    if (row.role === ROLES.RECRUITER) month.recruiters += 1
  })
  return [...months.values()]
}

export async function getAdminJobs({ status, query = '', page = 1, pageSize = 12 } = {}) {
  const client = await adminClient()
  let request = client
    .from('jobs')
    .select(JOB_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
  if (status && status !== 'all') request = request.eq('status', status)
  const filter = filterQuery(query, ['title', 'company_name', 'location'])
  if (filter) request = request.or(filter)
  const safePage = Math.max(1, Number(page) || 1)
  const { data, error, count } = await request.range((safePage - 1) * pageSize, safePage * pageSize - 1)
  fail(error, 'list jobs')
  const rows = data ?? []
  const ids = rows.map((row) => row.id)
  let applicationCounts = new Map()
  if (ids.length) {
    const { data: applications, error: countError } = await client
      .from('job_applications')
      .select('job_id')
      .in('job_id', ids)
    fail(countError, 'load job application counts')
    applicationCounts = (applications ?? []).reduce((counts, row) => {
      counts.set(row.job_id, (counts.get(row.job_id) ?? 0) + 1)
      return counts
    }, new Map())
  }
  return pageResult(
    rows.map((row) => ({ ...mapJob(row), applicationCount: applicationCounts.get(row.id) ?? 0 })),
    count,
    safePage,
    pageSize,
  )
}

export async function setAdminJobStatus(id, status) {
  if (!Object.values(JOB_STATUS).includes(status)) throw new Error('Unsupported job status.')
  const { data, error } = await (await adminClient())
    .from('jobs')
    .update({ status })
    .eq('id', id)
    .select(JOB_COLUMNS)
    .single()
  fail(error, 'moderate job')
  return mapJob(data)
}

export async function getAdminCompanies({
  verification,
  query = '',
  page = 1,
  pageSize = 12,
} = {}) {
  const client = await adminClient()
  let request = client
    .from('companies')
    .select(COMPANY_COLUMNS, { count: 'exact' })
    .order('name', { ascending: true })
  if (verification && verification !== 'all') request = request.eq('verification', verification)
  const filter = filterQuery(query, ['name', 'industry'])
  if (filter) request = request.or(filter)
  const safePage = Math.max(1, Number(page) || 1)
  const { data, error, count } = await request.range((safePage - 1) * pageSize, safePage * pageSize - 1)
  fail(error, 'list companies')
  const rows = data ?? []
  let jobCounts = new Map()
  if (rows.length) {
    const { data: jobs, error: jobsError } = await client
      .from('jobs')
      .select('company_id,status')
      .in('company_id', rows.map((row) => row.id))
    fail(jobsError, 'load company job counts')
    jobCounts = (jobs ?? []).reduce((counts, job) => {
      if (job.status === JOB_STATUS.ACTIVE) counts.set(job.company_id, (counts.get(job.company_id) ?? 0) + 1)
      return counts
    }, new Map())
  }
  return pageResult(
    rows.map((row) => ({ ...mapCompany(row), openJobs: jobCounts.get(row.id) ?? 0 })),
    count,
    safePage,
    pageSize,
  )
}

export async function setAdminCompanyStatus(id, verification) {
  if (!Object.values(COMPANY_STATUS).includes(verification)) {
    throw new Error('Unsupported company verification status.')
  }
  const { data, error } = await (await adminClient()).rpc('admin_set_company_verification', {
    target_id: id,
    next_status: verification,
  })
  fail(error, 'moderate company')
  return mapCompany(data)
}

export async function getAdminApplications({ status, page = 1, pageSize = 12 } = {}) {
  const client = await adminClient()
  let request = client
    .from('job_applications')
    .select('id,job_id,applicant_id,candidate_name,candidate_email,candidate_phone,candidate_location,headline,years_of_experience,skills,resume_name,cover_letter,expected_salary,notice_period,status,stage,timeline,applied_at,updated_at,job:jobs(title,company_name)', { count: 'exact' })
    .order('applied_at', { ascending: false })
  if (status && status !== 'all') request = request.eq('status', status)
  const safePage = Math.max(1, Number(page) || 1)
  const { data, error, count } = await request
    .range((safePage - 1) * pageSize, safePage * pageSize - 1)
  fail(error, 'list applications')
  const items = (data ?? []).map((row) => ({
    id: row.id,
    jobId: row.job_id,
    seekerId: row.applicant_id,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    candidatePhone: row.candidate_phone,
    candidateLocation: row.candidate_location,
    headline: row.headline,
    yearsOfExperience: row.years_of_experience,
    skills: row.skills ?? [],
    resumeName: row.resume_name,
    coverLetter: row.cover_letter,
    expectedSalary: row.expected_salary,
    noticePeriod: row.notice_period,
    status: row.status,
    stage: row.stage,
    timeline: row.timeline ?? [],
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
    jobTitle: row.job?.title,
    companyName: row.job?.company_name,
  }))
  return pageResult(items, count, safePage, pageSize)
}

export async function getAdminUsers({ role, status, query = '', page = 1, pageSize = 12 } = {}) {
  const client = await adminClient()
  let request = client
    .from('profiles')
    .select(PROFILE_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
  if (role && role !== 'all') request = request.eq('role', role)
  if (status && status !== 'all') request = request.eq('status', status)
  const filter = filterQuery(query, ['name', 'email', 'company_name'])
  if (filter) request = request.or(filter)
  const safePage = Math.max(1, Number(page) || 1)
  const { data, error, count } = await request.range((safePage - 1) * pageSize, safePage * pageSize - 1)
  fail(error, 'list users')
  return pageResult((data ?? []).map(mapProfile), count, safePage, pageSize)
}

export async function setAdminUserStatus(id, status) {
  if (!Object.values(USER_STATUS).includes(status)) throw new Error('Unsupported account status.')
  const { data, error } = await (await adminClient()).rpc('admin_set_profile_status', {
    target_id: id,
    next_status: status,
  })
  fail(error, 'update account status')
  return { id, status: data }
}

export async function getAdminUserStats() {
  const client = await adminClient()
  const { data, error } = await client.from('profiles').select('role,status')
  fail(error, 'load user statistics')
  const rows = data ?? []
  return {
    totalUsers: rows.length,
    activeUsers: rows.filter((row) => row.status === USER_STATUS.ACTIVE).length,
    blockedUsers: rows.filter((row) => row.status === USER_STATUS.BLOCKED).length,
    jobSeekers: rows.filter((row) => row.role === ROLES.JOB_SEEKER).length,
    recruiters: rows.filter((row) => row.role === ROLES.RECRUITER).length,
    admins: rows.filter((row) => row.role === ROLES.ADMIN).length,
  }
}

export async function getAdminOverview() {
  const client = await adminClient()
  const [profiles, jobs, companies, applications] = await Promise.all([
    client.from('profiles').select('role,status,created_at'),
    client.from('jobs').select('id,status,created_at,company_name,title,skills'),
    client.from('companies').select('id,verification,name,location'),
    client.from('job_applications').select('id,status,applied_at,job:jobs(work_mode)'),
  ])
  fail(profiles.error, 'load admin profile overview')
  fail(jobs.error, 'load admin job overview')
  fail(companies.error, 'load admin company overview')
  fail(applications.error, 'load admin application overview')
  const userRows = profiles.data ?? []
  const jobRows = jobs.data ?? []
  const companyRows = companies.data ?? []
  const applicationRows = applications.data ?? []
  const monthly = buildMonthlySeries(jobRows, applicationRows, userRows)
  const popularSkills = new Map()
  jobRows.filter((row) => row.status === JOB_STATUS.ACTIVE).forEach((row) => {
    (row.skills ?? []).forEach((skill) => {
      popularSkills.set(skill, (popularSkills.get(skill) ?? 0) + 1)
    })
  })
  const countJobs = (status) => jobRows.filter((row) => row.status === status).length
  const countUsers = (role) => userRows.filter((row) => row.role === role).length
  return {
    stats: {
      totalUsers: userRows.length,
      jobSeekers: countUsers(ROLES.JOB_SEEKER),
      recruiters: countUsers(ROLES.RECRUITER),
      admins: countUsers(ROLES.ADMIN),
      companies: companyRows.length,
      activeJobs: countJobs(JOB_STATUS.ACTIVE),
      totalJobs: jobRows.length,
      pendingJobs: countJobs(JOB_STATUS.PENDING),
      draftJobs: countJobs(JOB_STATUS.DRAFT),
      closedJobs: countJobs(JOB_STATUS.CLOSED),
      applications: applicationRows.length,
      hiredCandidates: applicationRows.filter((row) => row.status === APPLICATION_STATUS.HIRED).length,
    },
    queues: {
      pendingJobs: jobRows.filter((row) => row.status === JOB_STATUS.PENDING)
        .map(({ id, title, company_name, created_at }) => ({
          id, title, companyName: company_name, postedAt: created_at,
        })),
      pendingCompanies: companyRows.filter((row) => row.verification === COMPANY_STATUS.PENDING)
        .map(({ id, name, location }) => ({ id, name, location })),
      blockedUsers: (await getAdminUsers({ status: USER_STATUS.BLOCKED, pageSize: 100 })).items
        .map(({ id, name, email, role }) => ({ id, name, email, role })),
    },
    charts: {
      jobsPostedPerMonth: monthly.map(({ month, jobs, applications }) => ({ month, jobs, applications })),
      applicationsPerMonth: monthly.map(({ month, applications }) => ({ month, applications })),
      newUsersPerMonth: monthly.map(({ month, seekers, recruiters }) => ({ month, seekers, recruiters })),
      hiringTrends: monthly.map(({ month, hired, rejected }) => ({ month, hired, rejected })),
      applicationsByWorkMode: ['Hybrid', 'On-site', 'Remote'].map((mode) => ({
        mode,
        value: applicationRows.filter((row) => row.job?.work_mode === mode).length,
      })),
      topSkills: [...popularSkills]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([skill, count]) => ({ skill, count })),
    },
  }
}

export async function getAdminReports() {
  const client = await adminClient()
  const [profiles, jobs, companies, applications] = await Promise.all([
    client.from('profiles').select('role,created_at'),
    client.from('jobs').select('id,status,skills,department,work_mode,created_at,location,employment_type,experience_label,company_name,salary_min,salary_max'),
    client.from('companies').select('id,verification'),
    client.from('job_applications').select('id,status,applied_at,job:jobs(work_mode)'),
  ])
  fail(profiles.error, 'load report profiles')
  fail(jobs.error, 'load report jobs')
  fail(companies.error, 'load report companies')
  fail(applications.error, 'load report applications')
  const users = profiles.data ?? []
  const jobRows = jobs.data ?? []
  const companyRows = companies.data ?? []
  const appRows = applications.data ?? []
  const monthly = buildMonthlySeries(jobRows, appRows, users)
  const statusSplit = Object.values(APPLICATION_STATUS).map((status) => {
    const value = appRows.filter((row) => row.status === status).length
    return { status, value, percent: appRows.length ? Math.round((value / appRows.length) * 100) : 0 }
  })
  const activeJobs = jobRows.filter((row) => row.status === JOB_STATUS.ACTIVE)
  const skillCounts = new Map()
  activeJobs.forEach((job) => (job.skills ?? []).forEach((skill) => {
    skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1)
  }))
  const tally = (read) => {
    const counts = new Map()
    activeJobs.forEach((job) => {
      const value = read(job)
      const values = Array.isArray(value) ? value : [value]
      values.filter(Boolean).forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1))
    })
    return [...counts].map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)))
  }
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      seekers: users.filter((row) => row.role === ROLES.JOB_SEEKER).length,
      recruiters: users.filter((row) => row.role === ROLES.RECRUITER).length,
      companies: companyRows.length,
      verifiedCompanies: companyRows.filter((row) => row.verification === COMPANY_STATUS.VERIFIED).length,
      jobs: jobRows.length,
      activeJobs: jobRows.filter((row) => row.status === JOB_STATUS.ACTIVE).length,
      applications: appRows.length,
    },
    applicationStatusSplit: statusSplit,
    facets: {
      locations: tally((job) => job.location),
      departments: tally((job) => job.department),
      skills: tally((job) => job.skills),
      jobTypes: tally((job) => job.employment_type),
      workModes: tally((job) => job.work_mode),
      experience: tally((job) => job.experience_label),
      companies: tally((job) => job.company_name),
      salary: {
        min: Math.min(...activeJobs.map((job) => job.salary_min ?? 0).filter(Boolean), 0),
        max: Math.max(...activeJobs.map((job) => job.salary_max ?? 0), 0),
      },
    },
    charts: {
      jobsPostedPerMonth: monthly.map(({ month, jobs, applications }) => ({ month, jobs, applications })),
      applicationsPerMonth: monthly.map(({ month, applications }) => ({ month, applications })),
      newUsersPerMonth: monthly.map(({ month, seekers, recruiters }) => ({ month, seekers, recruiters })),
      hiringTrends: monthly.map(({ month, hired, rejected }) => ({ month, hired, rejected })),
      applicationsByWorkMode: ['Hybrid', 'On-site', 'Remote'].map((mode) => ({
        mode,
        value: appRows.filter((row) => row.job?.work_mode === mode).length,
      })),
      topSkills: [...skillCounts].sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([skill, count]) => ({ skill, count })),
    },
  }
}

export function deleteAdminUser() {
  throw new Error(
    'Deleting an account requires a trusted Supabase Edge Function to remove its Auth user. Configure that server-side function before enabling account deletion.',
  )
}

export function resetAdminMockData() {
  throw new Error('Mock data reset is not available in Supabase live mode.')
}
