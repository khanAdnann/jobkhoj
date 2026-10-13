import { db } from '@/mock/db'
import { delay } from './latency'
import { paginate, sortByKey } from './query'
import { buildFacets } from './jobs'
import {
  APPLICATION_STATUS,
  COMPANY_STATUS,
  JOB_STATUS,
  ROLES,
  USER_STATUS,
} from '@/utils/constants'

/** Admin-only handlers: moderation, verification and platform reporting. */

/* -------------------------------- overview -------------------------------- */

export async function getAdminOverview() {
  await delay(300, 560)

  const jobs = db.all('jobs')
  const users = db.all('users')
  const applications = db.all('applications')
  const platform = db.singleton('analytics')

  const countJobs = (status) => jobs.filter((job) => job.status === status).length

  return {
    stats: {
      totalUsers: users.length,
      jobSeekers: users.filter((row) => row.role === ROLES.JOB_SEEKER).length,
      recruiters: users.filter((row) => row.role === ROLES.RECRUITER).length,
      admins: users.filter((row) => row.role === ROLES.ADMIN).length,
      companies: db.count('companies'),
      activeJobs: countJobs(JOB_STATUS.ACTIVE),
      totalJobs: jobs.length,
      pendingJobs: countJobs(JOB_STATUS.PENDING),
      draftJobs: countJobs(JOB_STATUS.DRAFT),
      closedJobs: countJobs(JOB_STATUS.CLOSED),
      applications: applications.length,
      hiredCandidates: applications.filter(
        (row) => row.status === APPLICATION_STATUS.HIRED,
      ).length,
    },
    // Queues surfaced as action cards on the admin dashboard.
    queues: {
      pendingJobs: db
        .where('jobs', (row) => row.status === JOB_STATUS.PENDING)
        .map((job) => ({ id: job.id, title: job.title, companyName: job.companyName, postedAt: job.postedAt })),
      pendingCompanies: db
        .where('companies', (row) => row.verification === COMPANY_STATUS.PENDING)
        .map((company) => ({ id: company.id, name: company.name, location: company.location })),
      blockedUsers: db
        .where('users', (row) => row.status === USER_STATUS.BLOCKED)
        .map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })),
    },
    charts: {
      jobsPostedPerMonth: platform.jobsPostedPerMonth,
      applicationsPerMonth: platform.applicationsPerMonth,
      newUsersPerMonth: platform.newUsersPerMonth,
      hiringTrends: platform.hiringTrends,
      applicationsByWorkMode: platform.applicationsByWorkMode,
      topSkills: platform.topSkills,
    },
  }
}

/* -------------------------- jobs moderation ------------------------------- */

export async function listAdminJobs({ status, query = '', page = 1, pageSize = 12 } = {}) {
  await delay()

  let jobs = db.all('jobs')

  if (status && status !== 'all') {
    jobs = jobs.filter((job) => job.status === status)
  }
  if (query) {
    const needle = query.toLowerCase().trim()
    jobs = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(needle) ||
        job.companyName.toLowerCase().includes(needle) ||
        job.location.toLowerCase().includes(needle),
    )
  }

  const withCounts = jobs.map((job) => ({
    ...job,
    applicationCount: db.count('applications', (application) => application.jobId === job.id),
  }))

  return paginate(sortByKey(withCounts, 'postedAt', 'desc'), page, pageSize)
}

export async function setJobStatus(id, status) {
  await delay(240, 480)

  const job = db.find('jobs', id)
  if (!job) throw new Error('Job not found')

  return db.update('jobs', id, {
    status,
    moderatedAt: new Date().toISOString(),
  })
}

export async function approveJob(id) {
  return setJobStatus(id, JOB_STATUS.ACTIVE)
}

export async function rejectJob(id) {
  return setJobStatus(id, JOB_STATUS.REJECTED)
}

/* ------------------------ companies moderation ---------------------------- */

export async function listAdminCompanies({ verification, query = '', page = 1, pageSize = 12 } = {}) {
  await delay()

  let companies = db.all('companies')

  if (verification && verification !== 'all') {
    companies = companies.filter((company) => company.verification === verification)
  }
  if (query) {
    const needle = query.toLowerCase().trim()
    companies = companies.filter(
      (company) =>
        company.name.toLowerCase().includes(needle) ||
        industryMatch(company, needle),
    )
  }

  const withCounts = companies.map((company) => ({
    ...company,
    openJobs: db.count(
      'jobs',
      (job) => job.companyId === company.id && job.status === JOB_STATUS.ACTIVE,
    ),
  }))

  return paginate(sortByKey(withCounts, 'name', 'asc'), page, pageSize)
}

function industryMatch(company, needle) {
  return String(company.industry ?? '').toLowerCase().includes(needle)
}

/* ----------------------------- applications ------------------------------- */

export async function listAdminApplications({ status, page = 1, pageSize = 12 } = {}) {
  await delay()

  let applications = db.all('applications')

  if (status && status !== 'all') {
    applications = applications.filter((row) => row.status === status)
  }

  return paginate(sortByKey(applications, 'appliedAt', 'desc'), page, pageSize)
}

/* --------------------------------- reports -------------------------------- */

export async function getReports() {
  await delay(300, 560)

  const jobs = db.all('jobs')
  const applications = db.all('applications')
  const users = db.all('users')
  const companies = db.all('companies')
  const platform = db.singleton('analytics')

  // Status distribution as a percentage of all applications.
  const total = applications.length || 1
  const byStatus = Object.values(APPLICATION_STATUS).map((status) => {
    const value = applications.filter((row) => row.status === status).length
    return { status, value, percent: Math.round((value / total) * 100) }
  })

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      seekers: users.filter((row) => row.role === ROLES.JOB_SEEKER).length,
      recruiters: users.filter((row) => row.role === ROLES.RECRUITER).length,
      companies: companies.length,
      verifiedCompanies: companies.filter(
        (row) => row.verification === COMPANY_STATUS.VERIFIED,
      ).length,
      jobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status === JOB_STATUS.ACTIVE).length,
      applications: applications.length,
    },
    applicationStatusSplit: byStatus,
    facets: buildFacets(jobs),
    charts: {
      jobsPostedPerMonth: platform.jobsPostedPerMonth,
      applicationsPerMonth: platform.applicationsPerMonth,
      newUsersPerMonth: platform.newUsersPerMonth,
      hiringTrends: platform.hiringTrends,
      applicationsByWorkMode: platform.applicationsByWorkMode,
      topSkills: platform.topSkills,
    },
  }
}
