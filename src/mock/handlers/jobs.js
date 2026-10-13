import { db } from '@/mock/db'
import { delay } from './latency'
import { queryJobs, sortByKey } from './query'
import { getCurrentUserId } from './auth'
import { JOB_STATUS } from '@/utils/constants'

/**
 * Job mock handlers.
 *
 * Returned jobs are hydrated with their company so the UI never has to make a
 * second request to render a job card.
 */

function companyMap() {
  return new Map(db.all('companies').map((company) => [company.id, company]))
}

function hydrate(job, companies) {
  if (!job) return null

  const company = companies.get(job.companyId)

  return {
    ...job,
    company: company
      ? {
          id: company.id,
          name: company.name,
          slug: company.slug,
          industry: company.industry,
          location: company.location,
          size: company.size,
          about: company.about,
          verification: company.verification,
          website: company.website,
        }
      : null,
  }
}

function hydrateAll(jobs, companies) {
  return jobs.map((job) => hydrate(job, companies))
}

/* --------------------------------- reads ---------------------------------- */

export async function listJobs({
  filters = {},
  sort = 'relevance',
  page = 1,
  pageSize = 12,
} = {}) {
  await delay()

  const companies = companyMap()
  const result = queryJobs(
    db.all('jobs'),
    { filters, sort, page, pageSize },
    companies,
  )

  return {
    ...result,
    items: hydrateAll(result.items, companies),
    facets: buildFacets(db.all('jobs')),
  }
}

export async function getJob(id) {
  await delay(180, 360)

  const companies = companyMap()
  const job = db.find('jobs', id)
  if (!job) throw new Error('Job not found')

  const userId = getCurrentUserId()

  return {
    ...hydrate(job, companies),
    isSaved: userId
      ? db.count('savedJobs', (row) => row.userId === userId && row.jobId === id) > 0
      : false,
    hasApplied: userId
      ? db.count('applications', (row) => row.seekerId === userId && row.jobId === id) > 0
      : false,
  }
}

export async function getSimilarJobs(id, limit = 6) {
  await delay(160, 320)

  const companies = companyMap()
  const job = db.find('jobs', id)
  if (!job) return []

  const skillSet = new Set(job.skills)

  return db
    .all('jobs')
    .filter((candidate) => candidate.id !== id && candidate.status === JOB_STATUS.ACTIVE)
    .map((candidate) => {
      const overlap = candidate.skills.filter((skill) => skillSet.has(skill)).length
      const score =
        overlap * 2 +
        (candidate.department === job.department ? 3 : 0) +
        (candidate.location === job.location ? 2 : 0) +
        (candidate.experienceLabel === job.experienceLabel ? 1 : 0)

      return { candidate, score }
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.candidate.postedAt) - new Date(a.candidate.postedAt),
    )
    .slice(0, limit)
    .map(({ candidate }) => hydrate(candidate, companies))
}

/** Drives the homepage / jobs-page "Featured Jobs" rail. */
export async function getFeaturedJobs(limit = 6) {
  await delay()
  const companies = companyMap()

  return db
    .all('jobs')
    .filter((job) => job.status === JOB_STATUS.ACTIVE && job.featured)
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, limit)
    .map((job) => hydrate(job, companies))
}

export async function getJobsByCompany(companyId, { page = 1, pageSize = 10 } = {}) {
  await delay()

  const companies = companyMap()
  const jobs = db.all('jobs').filter((job) => job.companyId === companyId)

  const sorted = sortByKey(jobs, 'postedAt', 'desc')
  const start = (page - 1) * pageSize

  return {
    items: hydrateAll(sorted.slice(start, start + pageSize), companies),
    page,
    pageSize,
    totalItems: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    hasPrev: page > 1,
    hasNext: page * pageSize < sorted.length,
  }
}

/** Distinct filter values (with counts) for the filter panel. */
export function buildFacets(jobs) {
  const active = jobs.filter((job) => job.status === JOB_STATUS.ACTIVE)

  const tally = (read) => {
    const counts = new Map()
    active.forEach((job) => {
      const values = Array.isArray(read(job)) ? read(job) : [read(job)]
      values.filter(Boolean).forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1)
      })
    })
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)))
  }

  return {
    locations: tally((job) => job.location),
    departments: tally((job) => job.department),
    skills: tally((job) => job.skills),
    jobTypes: tally((job) => job.employmentType),
    workModes: tally((job) => job.workMode),
    experience: tally((job) => job.experienceLabel),
    companies: tally((job) => job.companyName),
    salary: {
      min: Math.min(...active.map((job) => job.salaryMin ?? 0).filter(Boolean), 0),
      max: Math.max(...active.map((job) => job.salaryMax ?? 0), 0),
    },
  }
}

export async function getFacets() {
  await delay(120, 260)
  return buildFacets(db.all('jobs'))
}

/* --------------------------------- writes --------------------------------- */

export async function createJob(payload) {
  await delay(420, 760)

  const companyId = payload.companyId
  const company = db.find('companies', companyId)

  const record = {
    id: db.insert('jobs', {
      id: `job-${Date.now().toString().slice(-5)}`,
      title: payload.title,
      companyId,
      companyName: company?.name ?? 'Unknown',
      department: payload.department,
      location: payload.location,
      workMode: payload.workMode,
      employmentType: payload.employmentType,
      experienceMin: payload.experienceMin ?? 0,
      experienceMax: payload.experienceMax ?? 0,
      experienceLabel: payload.experienceLabel ?? 'Not specified',
      salaryMin: payload.salaryMin ?? null,
      salaryMax: payload.salaryMax ?? null,
      skills: payload.skills ?? [],
      education: payload.education ?? '',
      openings: payload.openings ?? 1,
      featured: false,
      status: payload.status ?? JOB_STATUS.ACTIVE,
      description: payload.description ?? '',
      responsibilities: payload.responsibilities ?? [],
      requirements: payload.requirements ?? [],
      preferredSkills: payload.preferredSkills ?? [],
      benefits: payload.benefits ?? [],
      postedAt: new Date().toISOString(),
      deadline: payload.deadline ?? null,
      views: 0,
      applicantCount: 0,
      createdBy: payload.createdBy ?? null,
    }).id,
  }

  return getJob(record.id)
}

export async function updateJob(id, patch) {
  await delay(360, 640)

  const existing = db.find('jobs', id)
  if (!existing) throw new Error('Job not found')

  const next = { ...patch }

  if (patch.salaryMin !== undefined || patch.salaryMax !== undefined) {
    next.salaryMin = patch.salaryMin ?? existing.salaryMin
    next.salaryMax = patch.salaryMax ?? existing.salaryMax
  }

  db.update('jobs', id, { ...next, updatedAt: new Date().toISOString() })

  return getJob(id)
}

export async function deleteJob(id) {
  await delay(280, 520)
  db.removeWhere('applications', (application) => application.jobId === id)
  return { success: db.remove('jobs', id) }
}

export async function duplicateJob(id) {
  await delay(340, 620)
  const job = db.find('jobs', id)
  if (!job) throw new Error('Job not found')

  const { id: _ignoredId, ...rest } = job

  return createJob({
    ...rest,
    title: `${job.title} (Copy)`,
    status: JOB_STATUS.DRAFT,
    views: 0,
  })
}

export async function closeJob(id) {
  await delay(260, 480)
  db.update('jobs', id, { status: JOB_STATUS.CLOSED, closedAt: new Date().toISOString() })
  return getJob(id)
}

export async function incrementViews(id) {
  // Deliberately not awaited by callers — view counting must never block paint.
  const job = db.find('jobs', id)
  if (job) db.update('jobs', id, { views: (job.views ?? 0) + 1 })
}
