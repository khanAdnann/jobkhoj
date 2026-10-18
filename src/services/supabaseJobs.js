import { JOB_STATUS, USER_STATUS } from '@/utils/constants'
import { requireSupabase } from './supabaseClient'

const JOB_COLUMNS = [
  'id',
  'company_id',
  'company_name',
  'company_authorized',
  'title',
  'department',
  'location',
  'work_mode',
  'employment_type',
  'experience_min',
  'experience_max',
  'experience_label',
  'salary_min',
  'salary_max',
  'skills',
  'preferred_skills',
  'education',
  'description',
  'responsibilities',
  'requirements',
  'benefits',
  'openings',
  'featured',
  'status',
  'posted_at',
  'deadline',
  'views',
  'applicant_count',
  'created_at',
  'updated_at',
].join(',')

function fromDatabase(row) {
  if (!row) return row

  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    companyAuthorized: row.company_authorized,
    company: row.company_name
      ? { id: row.company_id, name: row.company_name }
      : null,
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

function toDatabase(payload) {
  const fields = {
    companyName: 'company_name',
    companyAuthorized: 'company_authorized',
    title: 'title',
    department: 'department',
    location: 'location',
    workMode: 'work_mode',
    employmentType: 'employment_type',
    experienceMin: 'experience_min',
    experienceMax: 'experience_max',
    experienceLabel: 'experience_label',
    salaryMin: 'salary_min',
    salaryMax: 'salary_max',
    skills: 'skills',
    preferredSkills: 'preferred_skills',
    education: 'education',
    description: 'description',
    responsibilities: 'responsibilities',
    requirements: 'requirements',
    benefits: 'benefits',
    openings: 'openings',
    deadline: 'deadline',
    status: 'status',
  }

  return Object.fromEntries(
    Object.entries(fields)
      .filter(([field]) => payload[field] !== undefined)
      .map(([field, column]) => [column, payload[field]]),
  )
}

function throwIfError(error, operation = 'job request') {
  if (error) {
    const diagnostics = {
      code: error.code ?? null,
      message: error.message ?? 'Unknown Supabase error',
      details: error.details ?? null,
      hint: error.hint ?? null,
    }
    console.error(`[supabase jobs] ${operation} failed`, diagnostics)
    const detail = [
      diagnostics.message,
      diagnostics.details && `Details: ${diagnostics.details}`,
      diagnostics.hint && `Hint: ${diagnostics.hint}`,
    ].filter(Boolean).join(' ')
    throw new Error(
      `Supabase ${operation} failed${diagnostics.code ? ` (${diagnostics.code})` : ''}: ${detail}`,
    )
  }
}

async function currentProfile() {
  const client = requireSupabase()
  const { data: authData, error: authError } = await client.auth.getUser()
  throwIfError(authError)
  if (!authData.user) throw new Error('Sign in before managing jobs.')

  const { data: profile, error } = await client
    .from('profiles')
    .select('id,role,status,company_id,company_name')
    .eq('id', authData.user.id)
    .single()
  throwIfError(error)

  if (profile.role !== 'RECRUITER') {
    throw new Error('This Supabase account is not registered with the RECRUITER role.')
  }
  if (profile.status !== USER_STATUS.ACTIVE) {
    throw new Error('An active recruiter account is required to manage jobs.')
  }
  return { client, user: authData.user, profile }
}

async function readOwnedJob(client, id, userId, operation) {
  const { data, error } = await client
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('id', id)
    .eq('owner_id', userId)
    .single()
  throwIfError(error, operation)
  return fromDatabase(data)
}

export async function getJob(id) {
  const { data, error } = await requireSupabase()
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  throwIfError(error)
  if (!data) throw new Error('Job not found')
  return fromDatabase(data)
}

export async function listJobs({
  filters = {},
  sort = 'relevance',
  page = 1,
  pageSize = 12,
  includeFacets = true,
} = {}) {
  const client = requireSupabase()
  let query = client
    .from('jobs')
    .select(JOB_COLUMNS, { count: 'exact' })
    .eq('status', JOB_STATUS.ACTIVE)
    .or(`deadline.is.null,deadline.gte.${new Date().toISOString().slice(0, 10)}`)

  const values = (value) => (Array.isArray(value) ? value : value ? [value] : [])
  const exactFilters = [
    ['location', filters.location],
    ['experience_label', filters.experience],
    ['department', filters.department],
    ['employment_type', filters.jobType],
    ['work_mode', filters.workMode],
    ['company_name', filters.company],
  ]
  exactFilters.forEach(([column, selected]) => {
    const options = values(selected)
    if (options.length === 1) query = query.eq(column, options[0])
    else if (options.length > 1) query = query.in(column, options)
  })

  if (filters.experienceMax !== undefined) {
    const maximum = Number(filters.experienceMax)
    if (Number.isFinite(maximum)) query = query.lte('experience_min', maximum)
  }

  if (values(filters.skills).length) query = query.contains('skills', values(filters.skills))
  const terms = String(filters.query ?? '')
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length) {
    query = query.textSearch('search_document', terms.join(' '), {
      type: 'websearch',
      config: 'simple',
    })
  }
  if (filters.salaryMin) {
    const minimum = Number(filters.salaryMin)
    if (Number.isFinite(minimum)) query = query.gte('salary_max', minimum)
  }
  if (filters.salaryMax) {
    const maximum = Number(filters.salaryMax)
    if (Number.isFinite(maximum)) {
      query = query.or(`salary_min.lte.${maximum},salary_min.is.null`)
    }
  }
  const dateRanges = { '24h': 1, '3d': 3, '7d': 7, '30d': 30 }
  if (dateRanges[filters.postedDate]) {
    const since = new Date()
    since.setDate(since.getDate() - dateRanges[filters.postedDate])
    query = query.gte('posted_at', since.toISOString())
  }

  const ordering = {
    newest: [['posted_at', { ascending: false }]],
    oldest: [['posted_at', { ascending: true }]],
    'salary-desc': [['salary_max', { ascending: false, nullsFirst: false }]],
    'salary-asc': [['salary_min', { ascending: true, nullsFirst: false }]],
    relevance: [
      ['featured', { ascending: false }],
      ['posted_at', { ascending: false }],
    ],
  }[sort] ?? [['posted_at', { ascending: false }]]

  ordering.forEach(([column, options]) => {
    query = query.order(column, options)
  })

  const safePage = Math.max(1, Number(page) || 1)
  const start = (safePage - 1) * pageSize
  let [{ data, error, count }, facets] = await Promise.all([
    query.range(start, start + pageSize - 1),
    includeFacets ? getFacets() : Promise.resolve(null),
  ])
  throwIfError(error)
  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(safePage, totalPages)
  if (currentPage !== safePage) {
    const result = await query.range(
      (currentPage - 1) * pageSize,
      currentPage * pageSize - 1,
    )
    throwIfError(result.error)
    data = result.data
  }

  return {
    items: (data ?? []).map(fromDatabase),
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
    facets,
  }
}

export async function getFeaturedJobs(limit = 6) {
  const { data, error } = await requireSupabase()
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('status', JOB_STATUS.ACTIVE)
    .eq('featured', true)
    .or(`deadline.is.null,deadline.gte.${new Date().toISOString().slice(0, 10)}`)
    .order('posted_at', { ascending: false })
    .limit(limit)
  throwIfError(error)
  return (data ?? []).map(fromDatabase)
}

export async function getSimilarJobs(id, limit = 6) {
  const job = await getJob(id)
  const { data, error } = await requireSupabase()
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('status', JOB_STATUS.ACTIVE)
    .neq('id', id)
    .or(`deadline.is.null,deadline.gte.${new Date().toISOString().slice(0, 10)}`)
    .limit(100)
  throwIfError(error)

  const skills = new Set(job.skills)
  return (data ?? [])
    .map(fromDatabase)
    .map((candidate) => ({
      candidate,
      score:
        candidate.skills.filter((skill) => skills.has(skill)).length * 2 +
        (candidate.department === job.department ? 3 : 0) +
        (candidate.location === job.location ? 2 : 0) +
        (candidate.experienceLabel === job.experienceLabel ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

export async function getJobsByCompany(companyId, { page = 1, pageSize = 10 } = {}) {
  const client = requireSupabase()
  const safePage = Math.max(1, Number(page) || 1)
  const start = (safePage - 1) * pageSize
  let query = client
    .from('jobs')
    .select(JOB_COLUMNS, { count: 'exact' })
    .eq('status', JOB_STATUS.ACTIVE)
    .eq('company_id', companyId)
    .or(`deadline.is.null,deadline.gte.${new Date().toISOString().slice(0, 10)}`)
    .order('posted_at', { ascending: false })

  let { data, error, count } = await query.range(start, start + pageSize - 1)
  throwIfError(error)
  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(safePage, totalPages)
  if (currentPage !== safePage) {
    const result = await query.range(
      (currentPage - 1) * pageSize,
      currentPage * pageSize - 1,
    )
    throwIfError(result.error)
    data = result.data
  }
  return {
    items: (data ?? []).map(fromDatabase),
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

export async function getRecruiterJobs({ status } = {}) {
  const { client, user } = await currentProfile()
  let query = client
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('owner_id', user.id)
    .order('posted_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  throwIfError(error)
  return (data ?? []).map(fromDatabase)
}

export async function createJob(payload) {
  const { client, user } = await currentProfile()
  const row = {
    owner_id: user.id,
    ...toDatabase(payload),
    status: payload.status ?? JOB_STATUS.ACTIVE,
  }
  const { data, error } = await client.from('jobs').insert(row).select('id').single()
  throwIfError(error, 'insert job')
  return readOwnedJob(client, data.id, user.id, 'read back inserted job')
}

export async function updateJob(id, payload) {
  const { client, user } = await currentProfile()
  const { data, error } = await client
    .from('jobs')
    .update(toDatabase(payload))
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()
  throwIfError(error, 'update job')
  if (!data) throw new Error('Job not found or you do not have permission to edit it.')
  return readOwnedJob(client, data.id, user.id, 'read back updated job')
}

export async function deleteJob(id) {
  const { client, user } = await currentProfile()
  const { data, error } = await client
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id')
  throwIfError(error)
  if (!data?.length) throw new Error('Job not found or you do not have permission to delete it.')
  return { success: true }
}

export async function duplicateJob(id) {
  const job = await getJob(id)
  const { id: _id, ownerId: _ownerId, company: _company, ...payload } = job
  return createJob({ ...payload, title: `${job.title} (Copy)`, status: JOB_STATUS.DRAFT })
}

export async function closeJob(id) {
  return updateJob(id, { status: JOB_STATUS.CLOSED })
}

export async function getFacets() {
  const { data, error } = await requireSupabase()
    .from('jobs')
    .select('location,department,skills,employment_type,work_mode,experience_label,company_name,salary_min,salary_max')
    .eq('status', JOB_STATUS.ACTIVE)
    .or(`deadline.is.null,deadline.gte.${new Date().toISOString().slice(0, 10)}`)
  throwIfError(error)

  const jobs = data ?? []
  const tally = (read) => {
    const counts = new Map()
    jobs.forEach((job) => {
      const values = Array.isArray(read(job)) ? read(job) : [read(job)]
      values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
    })
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)))
  }

  return {
    locations: tally((job) => job.location),
    departments: tally((job) => job.department),
    skills: tally((job) => job.skills),
    jobTypes: tally((job) => job.employment_type),
    workModes: tally((job) => job.work_mode),
    experience: tally((job) => job.experience_label),
    companies: tally((job) => job.company_name),
    salary: {
      min: Math.min(...jobs.map((job) => job.salary_min ?? 0)),
      max: Math.max(...jobs.map((job) => job.salary_max ?? 0)),
    },
  }
}
