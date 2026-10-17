import { COMPANY_STATUS, JOB_STATUS } from '@/utils/constants'
import { requireSupabase } from './supabaseClient'

const COMPANY_COLUMNS =
  'id,name,slug,industry,website,location,size,founded,about,benefits,social,verification,owner_id,verified_at,created_at,updated_at'

function fail(error, operation) {
  if (!error) return
  console.error(`[supabase companies] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
  throw new Error(`Supabase ${operation} failed: ${error.message}`)
}

async function addJobCounts(companies) {
  if (!companies.length) return []
  const client = requireSupabase()
  const ids = companies.map((company) => company.id)
  const { data, error } = await client
    .from('jobs')
    .select('company_id,company_name,status,skills')
    .in('company_id', ids)
  fail(error, 'load company job counts')

  return companies.map((company) => {
    const jobs = (data ?? []).filter((job) => job.company_id === company.id)
    const active = jobs.filter((job) => job.status === JOB_STATUS.ACTIVE)
    return {
      ...company,
      totalJobs: jobs.length,
      openJobs: active.length,
      technology: active[0]?.skills?.[0] ?? 'Technology',
    }
  })
}

function pageResult(items, page, pageSize, totalItems) {
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

export async function listCompanies({
  page = 1,
  pageSize = 12,
  query = '',
  verification = COMPANY_STATUS.VERIFIED,
} = {}) {
  const client = requireSupabase()
  const safePage = Math.max(1, Number(page) || 1)
  let request = client
    .from('companies')
    .select(COMPANY_COLUMNS, { count: 'exact' })
    .order('name', { ascending: true })
  if (verification && verification !== 'all') request = request.eq('verification', verification)
  const text = query.trim().replace(/[^a-zA-Z0-9\s-]/g, ' ')
  if (text) {
    request = request.or(
      `name.ilike.%${text}%,industry.ilike.%${text}%,location.ilike.%${text}%`,
    )
  }
  const { data, error, count } = await request.range(
    (safePage - 1) * pageSize,
    safePage * pageSize - 1,
  )
  fail(error, 'list companies')
  const companies = await addJobCounts(data ?? [])
  companies.sort((a, b) => b.openJobs - a.openJobs || a.name.localeCompare(b.name))
  return pageResult(companies, safePage, pageSize, count ?? 0)
}

export async function getCompany(idOrSlug) {
  const client = requireSupabase()
  let { data, error } = await client
    .from('companies')
    .select(COMPANY_COLUMNS)
    .eq('id', idOrSlug)
    .maybeSingle()
  if (error) fail(error, 'load company')
  if (!data) {
    const result = await client
      .from('companies')
      .select(COMPANY_COLUMNS)
      .eq('slug', idOrSlug)
      .maybeSingle()
    fail(result.error, 'load company')
    data = result.data
  }
  if (!data) throw new Error('Company not found.')
  const [company] = await addJobCounts([data])
  return company
}

export async function getTopCompanies(limit = 8) {
  const { data, error } = await requireSupabase()
    .from('companies')
    .select(COMPANY_COLUMNS)
    .eq('verification', COMPANY_STATUS.VERIFIED)
  fail(error, 'load top companies')
  const companies = await addJobCounts(data ?? [])
  return companies
    .sort((a, b) => b.openJobs - a.openJobs)
    .slice(0, Math.max(1, Number(limit) || 8))
}

export async function updateMyCompany(patch) {
  const client = requireSupabase()
  const { data: auth, error: authError } = await client.auth.getUser()
  fail(authError, 'get current user')
  if (!auth.user) throw new Error('Sign in to update your company.')
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('company_id')
    .eq('id', auth.user.id)
    .single()
  fail(profileError, 'load company ownership')
  if (!profile.company_id) throw new Error('Your recruiter account is not linked to a company.')

  const fields = ['industry', 'website', 'location', 'size', 'founded', 'about', 'benefits', 'social']
  const values = Object.fromEntries(fields.filter((field) => patch[field] !== undefined).map((field) => [field, patch[field]]))
  const { data, error } = await client
    .from('companies')
    .update(values)
    .eq('id', profile.company_id)
    .select(COMPANY_COLUMNS)
    .single()
  fail(error, 'update company')
  const [company] = await addJobCounts([data])
  return company
}

export async function moderateCompany(id, verification) {
  if (!Object.values(COMPANY_STATUS).includes(verification)) {
    throw new Error('Unsupported company verification status.')
  }
  const { data, error } = await requireSupabase().rpc('admin_set_company_verification', {
    target_id: id,
    next_status: verification,
  })
  fail(error, 'moderate company')
  return data
}
