import { APPLICATION_STATUS, PIPELINE_STAGE, PIPELINE_STAGES } from '@/utils/constants'
import { requireSupabase } from './supabaseClient'

const APPLICATION_COLUMNS = `
  id,job_id,applicant_id,candidate_name,candidate_email,candidate_phone,
  candidate_location,headline,years_of_experience,skills,resume_path,resume_name,
  cover_letter,expected_salary,notice_period,status,stage,timeline,applied_at,updated_at,
  job:jobs(id,title,location,work_mode,employment_type,salary_min,salary_max,status,company_name)
`

function fail(error, operation) {
  if (!error) return
  console.error(`[supabase applications] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
  throw new Error(`Supabase ${operation} failed: ${error.message}`)
}

async function signedInUser() {
  const client = requireSupabase()
  const { data, error } = await client.auth.getUser()
  fail(error, 'get current user')
  if (!data.user) throw new Error('Sign in to access applications.')
  return { client, user: data.user }
}

function mapJob(job) {
  if (!job) return null
  return {
    id: job.id,
    title: job.title,
    location: job.location,
    workMode: job.work_mode,
    employmentType: job.employment_type,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    status: job.status,
    companyName: job.company_name,
  }
}

function fromRow(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    seekerId: row.applicant_id,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    candidatePhone: row.candidate_phone,
    candidateLocation: row.candidate_location,
    currentLocation: row.candidate_location,
    headline: row.headline,
    yearsOfExperience: row.years_of_experience,
    skills: row.skills ?? [],
    resumeName: row.resume_name,
    resumePath: row.resume_path,
    resumeUrl: row.resume_url,
    coverLetter: row.cover_letter,
    expectedSalary: row.expected_salary,
    noticePeriod: row.notice_period,
    status: row.status,
    stage: row.stage,
    timeline: row.timeline ?? [],
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
    ...(row.job ? { job: mapJob(row.job), jobTitle: row.job.title, companyName: row.job.company_name } : {}),
  }
}

function pageResult(rows, count, page, pageSize) {
  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  return {
    items: (rows ?? []).map(fromRow),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

async function attachResumeUrls(client, rows) {
  const resumeRows = (rows ?? []).filter((row) => row.resume_path)
  if (!resumeRows.length) return rows
  const { data, error } = await client.storage
    .from('jobkhoj-resumes')
    .createSignedUrls(resumeRows.map((row) => row.resume_path), 60 * 5)
  fail(error, 'create application resume links')
  const urls = new Map(
    (data ?? []).map((item) => [item.path, item.signedUrl]),
  )
  return (rows ?? []).map((row) => ({
    ...row,
    resume_url: row.resume_path ? urls.get(row.resume_path) ?? null : null,
  }))
}

export async function listMyApplications({ page = 1, pageSize = 10, status } = {}) {
  const { client, user } = await signedInUser()
  const safePage = Math.max(1, Number(page) || 1)
  let query = client
    .from('job_applications')
    .select(APPLICATION_COLUMNS, { count: 'exact' })
    .eq('applicant_id', user.id)
    .order('applied_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error, count } = await query.range(
    (safePage - 1) * pageSize,
    safePage * pageSize - 1,
  )
  fail(error, 'list my applications')
  return pageResult(await attachResumeUrls(client, data), count, safePage, pageSize)
}

export async function getMyApplicationStats() {
  const { client, user } = await signedInUser()
  const { data, error } = await client
    .from('job_applications')
    .select('status')
    .eq('applicant_id', user.id)
  fail(error, 'load application stats')

  const rows = data ?? []
  const count = (status) => rows.filter((row) => row.status === status).length
  const { count: savedJobs, error: savedError } = await client
    .from('saved_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  fail(savedError, 'load saved-job count')

  return {
    appliedJobs: rows.length,
    underReview: count(APPLICATION_STATUS.UNDER_REVIEW),
    shortlisted: count(APPLICATION_STATUS.SHORTLISTED),
    interviews: count(APPLICATION_STATUS.INTERVIEW),
    rejected: count(APPLICATION_STATUS.REJECTED),
    hired: count(APPLICATION_STATUS.HIRED),
    savedJobs: savedJobs ?? 0,
  }
}

export async function getApplicationById(id) {
  const { client } = await signedInUser()
  const { data, error } = await client
    .from('job_applications')
    .select(APPLICATION_COLUMNS)
    .eq('id', id)
    .single()
  fail(error, 'load application')
  const [row] = await attachResumeUrls(client, [data])
  return fromRow(row)
}

export async function submitApplication(payload) {
  const { client, user } = await signedInUser()
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id,name,email,phone,location,years_of_experience,resume_path,resume_name')
    .eq('id', user.id)
    .single()
  fail(profileError, 'load applicant profile')

  const { data, error } = await client
    .from('job_applications')
    .insert({
      job_id: payload.jobId,
      applicant_id: user.id,
      candidate_name: payload.fullName ?? profile.name,
      candidate_email: payload.email ?? profile.email ?? user.email,
      candidate_phone: payload.phone ?? profile.phone,
      candidate_location: payload.currentLocation ?? profile.location,
      years_of_experience: payload.experience ?? profile.years_of_experience,
      resume_path: profile.resume_path,
      resume_name: profile.resume_name,
      cover_letter: payload.coverLetter ?? '',
      expected_salary: payload.expectedSalary ?? '',
      notice_period: payload.noticePeriod ?? '',
    })
    .select(APPLICATION_COLUMNS)
    .single()
  fail(error, 'submit application')
  const [row] = await attachResumeUrls(client, [data])
  return fromRow(row)
}

export async function listJobApplicants(jobId, { page = 1, pageSize = 12, stage, status } = {}) {
  const { client } = await signedInUser()
  const safePage = Math.max(1, Number(page) || 1)
  let query = client
    .from('job_applications')
    .select(APPLICATION_COLUMNS, { count: 'exact' })
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
  if (stage && stage !== 'all') query = query.eq('stage', stage)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error, count } = await query.range(
    (safePage - 1) * pageSize,
    safePage * pageSize - 1,
  )
  fail(error, 'list job applicants')
  return pageResult(await attachResumeUrls(client, data), count, safePage, pageSize)
}

export async function getPipeline(jobId) {
  const { client } = await signedInUser()
  const { data, error } = await client
    .from('job_applications')
    .select(APPLICATION_COLUMNS)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
  fail(error, 'load candidate pipeline')

  const rows = (await attachResumeUrls(client, data)).map(fromRow)
  return {
    rejectedCount: rows.filter((row) => row.stage === PIPELINE_STAGE.REJECTED).length,
    columns: Object.fromEntries(
      PIPELINE_STAGES.map((column) => [
        column.key,
        rows.filter((row) => row.stage === column.key),
      ]),
    ),
  }
}

export async function updateApplicationStage(id, stage) {
  if (![...PIPELINE_STAGES.map((row) => row.key), PIPELINE_STAGE.REJECTED].includes(stage)) {
    throw new Error('Unsupported application stage.')
  }
  const { data, error } = await requireSupabase()
    .from('job_applications')
    .update({ stage })
    .eq('id', id)
    .select(APPLICATION_COLUMNS)
    .single()
  fail(error, 'update application stage')
  return fromRow(data)
}

export const shortlistApplication = (id) =>
  updateApplicationStage(id, PIPELINE_STAGE.SHORTLISTED)
export const rejectApplication = (id) =>
  updateApplicationStage(id, PIPELINE_STAGE.REJECTED)
export const hireApplication = (id) =>
  updateApplicationStage(id, PIPELINE_STAGE.HIRED)

export async function searchCandidates({
  query = '',
  skills = [],
  page = 1,
  pageSize = 12,
} = {}) {
  const client = requireSupabase()
  const safePage = Math.max(1, Number(page) || 1)
  let request = client
    .from('public_candidate_profiles')
    .select('id,name,avatar_url,location,headline,skills,years_of_experience', { count: 'exact' })
    .order('years_of_experience', { ascending: false, nullsFirst: false })
  const terms = query
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
  if (terms.length) {
    request = request.or(
      terms.map((term) => `name.ilike.%${term}%,headline.ilike.%${term}%,location.ilike.%${term}%`).join(','),
    )
  }
  if (skills.length) request = request.contains('skills', skills)

  const { data, error, count } = await request.range(
    (safePage - 1) * pageSize,
    safePage * pageSize - 1,
  )
  fail(error, 'search public candidate profiles')
  return {
    ...pageResult(data, count, safePage, pageSize),
    items: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      location: row.location,
      headline: row.headline,
      yearsOfExperience: row.years_of_experience,
      skills: row.skills ?? [],
    })),
  }
}

export async function getCandidateById(id) {
  const client = requireSupabase()
  const { data: candidate, error } = await client
    .from('public_candidate_profiles')
    .select('*')
    .eq('id', id)
    .single()
  fail(error, 'load candidate profile')

  const { data: applications, error: applicationsError } = await client
    .from('job_applications')
    .select(APPLICATION_COLUMNS)
    .eq('applicant_id', id)
    .order('applied_at', { ascending: false })
  fail(applicationsError, 'load candidate applications')
  const mappedApplications = (await attachResumeUrls(client, applications)).map(fromRow)
  const latestApplication = mappedApplications[0]
  return {
    ...candidate,
    avatarUrl: candidate.avatar_url,
    yearsOfExperience: candidate.years_of_experience,
    email: latestApplication?.candidateEmail ?? '',
    phone: latestApplication?.candidatePhone ?? '',
    createdAt: candidate.created_at,
    applications: mappedApplications,
  }
}
