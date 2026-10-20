import { JOB_STATUS } from './constants'

export const SITE_ORIGIN = 'https://jobkhoj-theta.vercel.app'

export function normalizeExternalApplicationUrl(value) {
  const input = String(value ?? '').trim()
  if (!input) return null

  try {
    const url = new URL(input)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null
    return url.toString()
  } catch {
    return null
  }
}

export function slugifyJobText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getJobDetailsPath(job) {
  const descriptivePart = slugifyJobText(
    [job.title, job.company?.name ?? job.companyName, job.location]
      .filter(Boolean)
      .join(' '),
  )
  return `/jobs/${descriptivePart}--${encodeURIComponent(job.id)}`
}

export function getJobIdFromRouteParam(param) {
  const separatorIndex = String(param ?? '').lastIndexOf('--')
  if (separatorIndex < 0) return param

  try {
    return decodeURIComponent(param.slice(separatorIndex + 2))
  } catch (error) {
    throw new Error('The job URL contains an invalid job identifier.', { cause: error })
  }
}

export function isPublicJob(job, now = new Date()) {
  if (job?.status !== JOB_STATUS.ACTIVE) return false
  if (!job.deadline) return true

  const deadline = String(job.deadline).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return false
  return deadline >= now.toISOString().slice(0, 10)
}

export function getJobSummary(job, limit = 180) {
  const firstParagraph = String(job.description ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean)
  const summary =
    firstParagraph ||
    [
      job.title,
      job.company?.name ?? job.companyName,
      job.location,
      job.experienceLabel,
    ]
      .filter(Boolean)
      .join(' · ')

  if (summary.length <= limit) return summary
  const truncated = summary.slice(0, limit - 1)
  const wordBoundary = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, wordBoundary > 0 ? wordBoundary : truncated.length)}…`
}

function toIsoDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toAnnualRupees(lpa) {
  const amount = Number(lpa)
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100_000) : null
}

function plainJobDescription(job) {
  return [
    job.description,
    job.responsibilities?.length
      ? `Responsibilities:\n${job.responsibilities.join('\n')}`
      : '',
    job.requirements?.length ? `Requirements:\n${job.requirements.join('\n')}` : '',
    job.skills?.length ? `Required skills:\n${job.skills.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

export function createJobPosting(job, now = new Date()) {
  if (!isPublicJob(job, now)) return null

  const hiringOrganization = job.company?.name ?? job.companyName
  const datePosted = toIsoDate(job.postedAt ?? job.createdAt)
  const description = plainJobDescription(job)
  if (!job.title || !hiringOrganization || !job.location || !datePosted || !description) {
    return null
  }

  const posting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description,
    datePosted,
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganization,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    identifier: {
      '@type': 'PropertyValue',
      name: 'JobKhoj',
      value: String(job.id),
    },
    directApply: !normalizeExternalApplicationUrl(job.applicationUrl),
  }

  if (job.deadline) posting.validThrough = `${String(job.deadline).slice(0, 10)}T23:59:59`

  const employmentTypes = {
    'full time': 'FULL_TIME',
    'full-time': 'FULL_TIME',
    fulltime: 'FULL_TIME',
    'part time': 'PART_TIME',
    'part-time': 'PART_TIME',
    parttime: 'PART_TIME',
    contract: 'CONTRACTOR',
    temporary: 'TEMPORARY',
    internship: 'INTERN',
    intern: 'INTERN',
  }
  const employmentType = employmentTypes[String(job.employmentType ?? '').trim().toLowerCase()]
  if (employmentType) posting.employmentType = employmentType

  if (String(job.workMode ?? '').toLowerCase() === 'remote') {
    posting.jobLocationType = 'TELECOMMUTE'
  }

  const minimum = toAnnualRupees(job.salaryMin)
  const maximum = toAnnualRupees(job.salaryMax)
  if (minimum !== null || maximum !== null) {
    posting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        ...(minimum !== null ? { minValue: minimum } : {}),
        ...(maximum !== null ? { maxValue: maximum } : {}),
        unitText: 'YEAR',
      },
    }
  }

  return posting
}

export function serializeJobPosting(posting) {
  if (!posting) return ''
  return JSON.stringify(posting)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
