import { JOB_STATUS } from '@/utils/constants'

/**
 * Shared query helpers for the mock handlers.
 *
 * These implement PRD sections 31-33 (search across title/company/skills/
 * location, filtering, sorting, pagination) once so every list endpoint
 * behaves identically.
 */

/* ------------------------------- pagination ------------------------------- */

export function paginate(items, page = 1, pageSize = 12) {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

/* --------------------------------- search --------------------------------- */

const normalise = (value) => String(value ?? '').toLowerCase().trim()

/**
 * Free-text search across job title, company name, skills and location.
 * Multiple words are ANDed so "java mumbai" only matches jobs that satisfy
 * both terms (possibly across different fields).
 */
export function matchesQuery(job, query, companyById = new Map()) {
  const terms = normalise(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true

  const companyName =
    job.companyName ?? companyById.get(job.companyId)?.name ?? ''

  const haystack = [
    job.title,
    companyName,
    job.location,
    job.department,
    job.experienceLabel,
    ...(job.skills ?? []),
  ]
    .join(' ')
    .toLowerCase()

  return terms.every((term) => haystack.includes(term))
}

/* -------------------------------- filtering ------------------------------- */

const asArray = (value) => {
  if (value === undefined || value === null || value === '') return []
  return Array.isArray(value) ? value : [value]
}

const DATE_WINDOW_DAYS = { '24h': 1, '3d': 3, '7d': 7, '30d': 30 }

export function matchesDateFilter(job, postedDate) {
  if (!postedDate || postedDate === 'any') return true

  const windowDays = DATE_WINDOW_DAYS[postedDate]
  if (!windowDays) return true

  const ageDays = (Date.now() - new Date(job.postedAt).getTime()) / 86_400_000
  return ageDays <= windowDays
}

/**
 * @param {Array}  jobs
 * @param {Object} filters  { query, location[], experience[], department[], skills[],
 *                            jobType[], workMode[], company[], postedDate,
 *                            salaryMin, salaryMax }
 */
export function applyFilters(jobs, filters = {}, companyById = new Map()) {
  const locations = asArray(filters.location)
  const experiences = asArray(filters.experience)
  const departments = asArray(filters.department)
  const skills = asArray(filters.skills)
  const jobTypes = asArray(filters.jobType)
  const workModes = asArray(filters.workMode)
  const companies = asArray(filters.company)

  const salaryMin = Number(filters.salaryMin) || 0
  const salaryMax = Number(filters.salaryMax) || Number.POSITIVE_INFINITY

  return jobs.filter((job) => {
    if (job.status !== JOB_STATUS.ACTIVE) return false
    if (job.deadline && String(job.deadline).slice(0, 10) < new Date().toISOString().slice(0, 10)) {
      return false
    }
    if (!matchesQuery(job, filters.query, companyById)) return false
    if (!matchesDateFilter(job, filters.postedDate)) return false

    if (locations.length && !locations.includes(job.location)) return false
    if (departments.length && !departments.includes(job.department)) return false
    if (jobTypes.length && !jobTypes.includes(job.employmentType)) return false
    if (workModes.length && !workModes.includes(job.workMode)) return false

    if (experiences.length && !experiences.includes(job.experienceLabel)) return false
    if (
      filters.experienceMax !== undefined &&
      Number.isFinite(Number(job.experienceMin)) &&
      Number(job.experienceMin) > Number(filters.experienceMax)
    ) {
      return false
    }

    if (companies.length) {
      const companyName = job.companyName ?? companyById.get(job.companyId)?.name ?? ''
      if (!companies.includes(companyName)) return false
    }

    if (skills.length && !skills.every((skill) => (job.skills ?? []).includes(skill))) {
      return false
    }

    // A job matches when its range overlaps the requested band.
    if (salaryMin > 0 && (job.salaryMax ?? 0) < salaryMin) return false
    if (salaryMax < Number.POSITIVE_INFINITY && (job.salaryMin ?? 0) > salaryMax) return false

    return true
  })
}

/* --------------------------------- sorting -------------------------------- */

/**
 * @param {'relevance'|'newest'|'oldest'|'salary-desc'|'salary-asc'} sort
 */
export function applySort(jobs, sort = 'newest') {
  const sorted = [...jobs]

  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt))
    case 'salary-desc':
      return sorted.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0))
    case 'salary-asc':
      return sorted.sort((a, b) => (a.salaryMin ?? 0) - (b.salaryMin ?? 0))
    case 'relevance':
    default:
      // Featured first, then newest. Simple, predictable and matches what a
      // user expects from a "relevance" tab on a job board.
      return sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return new Date(b.postedAt) - new Date(a.postedAt)
      })
  }
}

/** Combines the full pipeline: filter -> sort -> paginate. */
export function queryJobs(jobs, { filters = {}, sort = 'newest', page = 1, pageSize = 12 } = {}, companyById) {
  const filtered = applyFilters(jobs, filters, companyById)
  const sorted = applySort(filtered, sort)
  return paginate(sorted, page, pageSize)
}

/** Generic sorter for DataTable column sorting. */
export function sortByKey(items, key, direction = 'asc', accessor) {
  const factor = direction === 'desc' ? -1 : 1
  const read = accessor ?? ((row) => row[key])

  return [...items].sort((a, b) => {
    const left = read(a)
    const right = read(b)

    if (left === right) return 0
    if (left === null || left === undefined) return 1
    if (right === null || right === undefined) return -1

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor
    }

    return String(left).localeCompare(String(right)) * factor
  })
}
