import { db } from '@/mock/db'
import { delay } from './latency'
import { paginate } from './query'
import { getCurrentUserId } from './auth'
import { COMPANY_STATUS, JOB_STATUS } from '@/utils/constants'

/** Company mock handlers — every company carries a live open-job count. */

function withJobCounts(companies) {
  const jobs = db.all('jobs')

  return companies.map((company) => {
    const companyJobs = jobs.filter((job) => job.companyId === company.id)
    const active = companyJobs.filter((job) => job.status === JOB_STATUS.ACTIVE)

    return {
      ...company,
      totalJobs: companyJobs.length,
      openJobs: active.length,
      // Primary technology label for the "Top Companies" cards.
      technology: active[0]?.skills?.[0] ?? 'Technology',
    }
  })
}

export async function listCompanies({ page = 1, pageSize = 12, query = '', verification } = {}) {
  await delay()

  let companies = withJobCounts(db.all('companies'))

  if (query) {
    const needle = query.toLowerCase().trim()
    companies = companies.filter(
      (company) =>
        company.name.toLowerCase().includes(needle) ||
        company.industry.toLowerCase().includes(needle) ||
        company.location.toLowerCase().includes(needle),
    )
  }

  if (verification) {
    companies = companies.filter((company) => company.verification === verification)
  }

  companies.sort((a, b) => b.openJobs - a.openJobs || a.name.localeCompare(b.name))

  return paginate(companies, page, pageSize)
}

export async function getCompany(idOrSlug) {
  await delay(180, 380)

  const companies = withJobCounts(db.all('companies'))
  const company =
    companies.find((company) => company.id === idOrSlug) ||
    companies.find((company) => company.slug === idOrSlug)

  if (!company) throw new Error('Company not found')

  return company
}

/** Company cards for the homepage "Top Companies" strip. */
export async function getTopCompanies(limit = 8) {
  await delay()

  return withJobCounts(db.all('companies'))
    .filter((company) => company.verification === COMPANY_STATUS.VERIFIED)
    .sort((a, b) => b.openJobs - a.openJobs)
    .slice(0, limit)
}

/* --------------------------------- writes --------------------------------- */

export async function updateCompany(id, patch) {
  await delay(340, 620)

  const company = db.find('companies', id)
  if (!company) throw new Error('Company not found')

  const updated = db.update('companies', id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  })

  return updated
}

/**
 * PUT /companies/me — resolves the company from the session rather than the
 * request body, so a client cannot edit a company it does not belong to.
 */
export async function updateMyCompany(patch) {
  await delay(340, 620)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const user = db.find('users', userId)
  if (!user?.companyId) throw new Error('No company is linked to your account.')

  const company = db.find('companies', user.companyId)
  if (!company) throw new Error('Company not found')

  return updateCompany(company.id, patch)
}

export async function verifyCompany(id) {
  await delay(280, 520)
  return updateCompany(id, {
    verification: COMPANY_STATUS.VERIFIED,
    verifiedAt: new Date().toISOString(),
  })
}

export async function rejectCompany(id) {
  await delay(280, 520)
  return updateCompany(id, { verification: COMPANY_STATUS.REJECTED })
}

export async function suspendCompany(id) {
  await delay(280, 520)
  return updateCompany(id, { verification: COMPANY_STATUS.SUSPENDED })
}
