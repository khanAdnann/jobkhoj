import { db } from '@/mock/db'
import { delay } from './latency'
import { paginate, sortByKey } from './query'
import { getCurrentUserId } from './auth'
import {
  APPLICATION_STATUS,
  JOB_STATUS,
  PIPELINE_STAGE,
  PIPELINE_STAGES,
} from '@/utils/constants'

/**
 * Application mock handlers.
 *
 * An application keeps two related fields: `status` (what the candidate sees)
 * and `stage` (the recruiter's pipeline column). Moving a candidate in the
 * Kanban board updates `stage`; terminal states also set `status`.
 */

/**
 * Pipeline column -> the status the candidate sees.
 *
 * SELECTED has no dedicated candidate-facing status, so it surfaces as
 * Interview (the round a candidate is normally selected in).
 */
const STATUS_BY_STAGE = {
  APPLIED: APPLICATION_STATUS.APPLIED,
  SCREENING: APPLICATION_STATUS.UNDER_REVIEW,
  SHORTLISTED: APPLICATION_STATUS.SHORTLISTED,
  INTERVIEW: APPLICATION_STATUS.INTERVIEW,
  SELECTED: APPLICATION_STATUS.INTERVIEW,
  HIRED: APPLICATION_STATUS.HIRED,
  REJECTED: APPLICATION_STATUS.REJECTED,
}

const STAGE_LABEL = {
  APPLIED: 'Applied',
  SCREENING: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  SELECTED: 'Selected',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
}

/**
 * Application ids follow the APP-<number> format. The next value is derived
 * from the highest id already stored so numbering stays correct after a reset
 * and after runtime inserts.
 */
function nextApplicationId() {
  const highest = db.all('applications').reduce((max, row) => {
    const value = Number(String(row.id).replace(/^APP-/, ''))
    return Number.isFinite(value) && value > max ? value : max
  }, 102_937)

  return `APP-${highest + 1}`
}

function withJob(application) {
  const job = db.find('jobs', application.jobId)
  if (!job) return application

  return {
    ...application,
    job: {
      id: job.id,
      title: job.title,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      status: job.status,
      companyName: job.companyName,
    },
  }
}

/* ----------------------------- seeker facing ------------------------------ */

export async function listMyApplications({ page = 1, pageSize = 10, status } = {}) {
  await delay()

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  let applications = db.where('applications', (row) => row.seekerId === userId)

  if (status && status !== 'all') {
    applications = applications.filter((row) => row.status === status)
  }

  applications = sortByKey(applications, 'appliedAt', 'desc')

  return paginate(applications.map(withJob), page, pageSize)
}

/** Counts powering the seeker dashboard cards. */
export async function getMyApplicationStats() {
  await delay(160, 320)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const mine = db.where('applications', (row) => row.seekerId === userId)
  const savedCount = db.count('savedJobs', (row) => row.userId === userId)

  const count = (status) => mine.filter((row) => row.status === status).length

  return {
    appliedJobs: mine.length,
    underReview: count(APPLICATION_STATUS.UNDER_REVIEW),
    shortlisted: count(APPLICATION_STATUS.SHORTLISTED),
    interviews: count(APPLICATION_STATUS.INTERVIEW),
    rejected: count(APPLICATION_STATUS.REJECTED),
    hired: count(APPLICATION_STATUS.HIRED),
    savedJobs: savedCount,
  }
}

export async function getApplicationById(id) {
  await delay(160, 320)

  const application = db.find('applications', id)
  if (!application) throw new Error('Application not found')

  return withJob(application)
}

/* --------------------------------- writes --------------------------------- */

export async function submitApplication(payload) {
  await delay(520, 900)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const seeker = db.find('users', userId)
  const job = db.find('jobs', payload.jobId)

  if (!job) throw new Error('This job is no longer available.')
  if (job.status !== JOB_STATUS.ACTIVE) {
    throw new Error('This job is no longer accepting applications.')
  }

  const duplicate = db.first(
    'applications',
    (row) => row.seekerId === userId && row.jobId === payload.jobId,
  )
  if (duplicate) {
    throw new Error('You have already applied to this job.')
  }

  const resumeName =
    payload.resume?.name ?? (seeker?.hasResume ? seeker.resumeName : null) ?? null

  const record = db.insert('applications', {
    id: nextApplicationId(),
    jobId: job.id,
    jobTitle: job.title,
    companyId: job.companyId,
    companyName: job.companyName,
    seekerId: userId,
    candidateName: payload.fullName ?? seeker?.name ?? '',
    candidateEmail: payload.email ?? seeker?.email ?? '',
    candidatePhone: payload.phone ?? seeker?.phone ?? '',
    candidateLocation: payload.currentLocation ?? seeker?.location ?? '',
    headline: seeker?.headline ?? '',
    yearsOfExperience: payload.experience ?? seeker?.yearsOfExperience ?? 0,
    skills: seeker?.skills ?? [],
    resumeName,
    status: APPLICATION_STATUS.APPLIED,
    stage: PIPELINE_STAGE.APPLIED,
    appliedAt: new Date().toISOString(),
    expectedSalary: payload.expectedSalary ?? '',
    noticePeriod: payload.noticePeriod ?? '',
    currentLocation: payload.currentLocation ?? seeker?.location ?? '',
    coverLetter: payload.coverLetter ?? '',
    timeline: [{ label: 'Applied', at: new Date().toISOString(), stage: PIPELINE_STAGE.APPLIED }],
    updatedAt: new Date().toISOString(),
  })

  db.update('jobs', job.id, { applicantCount: (job.applicantCount ?? 0) + 1 })

  return withJob(record)
}

/* --------------------------- recruiter facing ----------------------------- */

export async function listJobApplicants(jobId, { page = 1, pageSize = 12, stage, status } = {}) {
  await delay()

  let applications = db.where('applications', (row) => row.jobId === jobId)

  if (stage && stage !== 'all') {
    applications = applications.filter((row) => row.stage === stage)
  }
  if (status && status !== 'all') {
    applications = applications.filter((row) => row.status === status)
  }

  applications = sortByKey(applications, 'appliedAt', 'desc')

  return paginate(applications, page, pageSize)
}

/** Full pipeline for the Kanban board, grouped by stage. */
export async function getPipeline(jobId) {
  await delay(200, 420)

  const applications = db.where('applications', (row) => row.jobId === jobId)
  const rejected = applications.filter((row) => row.status === APPLICATION_STATUS.REJECTED)

  return {
    // Rejected candidates are excluded from the columns but counted here.
    rejectedCount: rejected.length,
    // Derived from PIPELINE_STAGES so adding a column needs one edit, not two.
    columns: Object.fromEntries(
      PIPELINE_STAGES.map((column) => [
        column.key,
        applications.filter((row) => row.stage === column.key),
      ]),
    ),
  }
}

export async function updateApplicationStage(id, stage) {
  await delay(200, 420)

  const application = db.find('applications', id)
  if (!application) throw new Error('Application not found')

  const now = new Date().toISOString()

  // Moving a card in the Kanban board must update both the pipeline column and
  // the status the candidate sees, otherwise the two views disagree.
  const patch = {
    stage,
    status: STATUS_BY_STAGE[stage] ?? application.status,
    updatedAt: now,
    timeline: [
      ...(application.timeline ?? []),
      { label: STAGE_LABEL[stage] ?? stage, at: now, stage },
    ],
  }

  return db.update('applications', id, patch)
}

export async function shortlistApplication(id) {
  return updateApplicationStage(id, PIPELINE_STAGE.SHORTLISTED)
}

export async function rejectApplication(id) {
  return updateApplicationStage(id, PIPELINE_STAGE.REJECTED)
}

export async function hireApplication(id) {
  return updateApplicationStage(id, PIPELINE_STAGE.HIRED)
}

/** Search across all candidates for the /recruiter/candidates screen. */
export async function searchCandidates({ query = '', skills = [], page = 1, pageSize = 12 } = {}) {
  await delay()

  const candidates = db.all('users').filter((row) => row.role === 'JOB_SEEKER')

  let results = candidates

  if (query) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    results = results.filter((candidate) => {
      const haystack = [
        candidate.name,
        candidate.headline,
        candidate.location,
        ...(candidate.skills ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return terms.every((term) => haystack.includes(term))
    })
  }

  if (skills.length) {
    results = results.filter((candidate) =>
      skills.every((skill) => (candidate.skills ?? []).includes(skill)),
    )
  }

  results = sortByKey(results, 'yearsOfExperience', 'desc')

  return paginate(results, page, pageSize)
}

export async function getCandidateById(id) {
  await delay(160, 340)

  const candidate = db.find('users', id)
  if (!candidate) throw new Error('Candidate not found')

  const applications = db
    .where('applications', (row) => row.seekerId === id)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))

  return { ...candidate, applications }
}
