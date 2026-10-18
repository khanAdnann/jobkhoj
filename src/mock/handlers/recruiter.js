import { db } from '@/mock/db'
import { delay } from './latency'
import { sortByKey } from './query'
import { getCurrentUserId } from './auth'
import {
  APPLICATION_STATUS,
  JOB_STATUS,
  PIPELINE_STAGES,
  ROLES,
} from '@/utils/constants'

/** Recruiter-scoped handlers. Everything is scoped to the signed-in recruiter. */

// Admins are allowed through the recruiter area by RoleRoute (roles=[RECRUITER,
// ADMIN]), so they must be accepted here too — otherwise an admin hitting the
// recruiter pages gets "You do not have recruiter access."
function currentRecruiter() {
  const user = db.find('users', getCurrentUserId() ?? '')
  if (!user || (user.role !== ROLES.RECRUITER && user.role !== ROLES.ADMIN)) {
    throw new Error('You do not have recruiter access.')
  }
  return user
}

export async function getRecruiterProfile() {
  await delay(160, 320)

  const recruiter = currentRecruiter()
  const company = db.find('companies', recruiter.companyId)

  return {
    ...recruiter,
    company: company ?? null,
  }
}

/* ------------------------------- dashboard -------------------------------- */

export async function getRecruiterDashboard() {
  await delay(260, 480)

  const recruiter = currentRecruiter()
  const company = db.find('companies', recruiter.companyId)

  const jobs = db.where(
    'jobs',
    (row) => row.createdBy === recruiter.id || row.companyId === recruiter.companyId,
  )
  const jobIds = new Set(jobs.map((job) => job.id))
  const applications = db.where('applications', (row) => jobIds.has(row.jobId))

  const count = (status) => applications.filter((row) => row.status === status).length

  const activeJobs = jobs.filter((job) => job.status === JOB_STATUS.ACTIVE)

  return {
    company,
    stats: {
      activeJobs: activeJobs.length,
      totalApplicants: applications.length,
      shortlisted: count(APPLICATION_STATUS.SHORTLISTED),
      interviews: count(APPLICATION_STATUS.INTERVIEW),
      hired: count(APPLICATION_STATUS.HIRED),
      drafts: jobs.filter((job) => job.status === JOB_STATUS.DRAFT).length,
      pendingApproval: jobs.filter((job) => job.status === JOB_STATUS.PENDING).length,
      totalViews: jobs.reduce((sum, job) => sum + (job.views ?? 0), 0),
    },
    // Recent applicants across all this recruiter's jobs.
    recentApplicants: sortByKey(applications, 'appliedAt', 'desc')
      .slice(0, 6)
      .map((application) => ({
        id: application.id,
        candidateName: application.candidateName,
        headline: application.headline,
        jobTitle: application.jobTitle,
        jobId: application.jobId,
        status: application.status,
        stage: application.stage,
        appliedAt: application.appliedAt,
        yearsOfExperience: application.yearsOfExperience,
        skills: application.skills,
      })),
    // Jobs needing the recruiter's attention.
    topJobs: sortByKey(activeJobs, 'applicantCount', 'desc').slice(0, 5).map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      applicants: job.applicantCount ?? 0,
      views: job.views ?? 0,
      status: job.status,
      postedAt: job.postedAt,
    })),
  }
}

/* -------------------------------- analytics ------------------------------- */

export async function getRecruiterAnalytics() {
  await delay(280, 520)

  const recruiter = currentRecruiter()
  const platform = db.singleton('analytics')
  const companyId = recruiter.companyId

  const jobs = db.where(
    'jobs',
    (row) => row.createdBy === recruiter.id || row.companyId === companyId,
  )
  const jobIds = new Set(jobs.map((job) => job.id))
  const applications = db.where('applications', (row) => jobIds.has(row.jobId))

  const byStage = PIPELINE_STAGES.map((column) => column.key)

  // Funnel: how many applicants survived each stage.
  const funnel = byStage.map((stage, index) => ({
    stage,
    // A candidate in stage N necessarily passed every earlier stage.
    value: applications.filter(
      (row) => byStage.indexOf(row.stage) >= index && row.status !== APPLICATION_STATUS.REJECTED,
    ).length,
  }))

  const byWorkMode = ['Hybrid', 'On-site', 'Remote'].map((mode) => ({
    mode,
    value: applications.filter((row) => {
      const job = jobs.find((candidate) => candidate.id === row.jobId)
      return job?.workMode === mode
    }).length,
  }))

  const hired = applications.filter((row) => row.status === APPLICATION_STATUS.HIRED).length
  const rejected = applications.filter((row) => row.status === APPLICATION_STATUS.REJECTED).length
  const decided = hired + rejected

  return {
    companyId,
    funnel,
    byWorkMode,
    totals: {
      jobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status === JOB_STATUS.ACTIVE).length,
      applicants: applications.length,
      hired,
      rejected,
      views: jobs.reduce((sum, job) => sum + (job.views ?? 0), 0),
      avgApplicantsPerJob: jobs.length
        ? Math.round(applications.length / jobs.length)
        : 0,
      // Offer-acceptance proxy, shown as a percentage.
      hireRate: decided ? Math.round((hired / decided) * 100) : 0,
    },
// Reuse the platform series so the recruiter charts share one shape.
  trend: platform.jobsPostedPerMonth.map((row) => ({
    month: row.month,
    applications: Math.round(row.applications * 0.08),
    jobs: Math.max(1, Math.round(row.jobs * 0.02)),
  })),
    topJobs: sortByKey(jobs, 'applicantCount', 'desc')
      .slice(0, 6)
      .map((job) => ({
        id: job.id,
        title: job.title,
        applicants: job.applicantCount ?? 0,
        views: job.views ?? 0,
        status: job.status,
      })),
  }
}

/* ------------------------------ job management ---------------------------- */

export async function listRecruiterJobs({ status } = {}) {
  await delay()

  const recruiter = currentRecruiter()

  let jobs = db.where(
    'jobs',
    (row) => row.createdBy === recruiter.id || row.companyId === recruiter.companyId,
  )

  if (status && status !== 'all') {
    jobs = jobs.filter((row) => row.status === status)
  }

  return sortByKey(jobs, 'postedAt', 'desc')
}
