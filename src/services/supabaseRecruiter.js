import {
  APPLICATION_STATUS,
  JOB_STATUS,
  PIPELINE_STAGES,
  ROLES,
  USER_STATUS,
} from '@/utils/constants'
import { requireSupabase } from './supabaseClient'
import { getRecruiterJobs } from './supabaseJobs'

function fail(error, operation) {
  if (!error) return
  console.error(`[supabase recruiter] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
  throw new Error(`Supabase ${operation} failed: ${error.message}`)
}

async function getRecruiterContext() {
  const client = requireSupabase()
  const { data: auth, error: authError } = await client.auth.getUser()
  fail(authError, 'get current user')
  if (!auth.user) throw new Error('Sign in to access the recruiter dashboard.')

  const { data: profile, error } = await client
    .from('profiles')
    .select('id,name,email,phone,role,company_id,company_name,company_size,status')
    .eq('id', auth.user.id)
    .single()
  fail(error, 'load recruiter profile')
  if (
    profile.role !== ROLES.RECRUITER ||
    profile.status !== USER_STATUS.ACTIVE
  ) {
    throw new Error('An active recruiter account is required.')
  }
  let company = null
  if (profile.company_id) {
    const { data, error: companyError } = await client
      .from('companies')
      .select('id,name,slug,industry,website,location,size,founded,about,benefits,social,verification,owner_id,verified_at')
      .eq('id', profile.company_id)
      .maybeSingle()
    fail(companyError, 'load recruiter company')
    company = data
  }
  return { client, profile, company }
}

async function getRecruiterData() {
  const { client, profile, company } = await getRecruiterContext()
  const jobs = await getRecruiterJobs({ status: 'all' })
  const jobIds = jobs.map((job) => job.id)
  let applications = []
  if (jobIds.length) {
    const { data, error } = await client
      .from('job_applications')
      .select('id,job_id,candidate_name,headline,years_of_experience,skills,status,stage,applied_at,job:jobs(title,work_mode)')
      .in('job_id', jobIds)
      .order('applied_at', { ascending: false })
    fail(error, 'load recruiter applications')
    applications = data ?? []
  }
  return { profile, company, jobs, applications }
}

export async function getRecruiterProfile() {
  const { profile, company } = await getRecruiterContext()
  return { ...profile, companyId: profile.company_id, companyName: profile.company_name, company }
}

export async function getRecruiterDashboard() {
  const { company, jobs, applications } = await getRecruiterData()
  const countStatus = (status) => applications.filter((row) => row.status === status).length
  const activeJobs = jobs.filter((job) => job.status === JOB_STATUS.ACTIVE)
  const topJobs = [...jobs]
    .sort((a, b) => (b.applicantCount ?? 0) - (a.applicantCount ?? 0))
    .slice(0, 5)
    .map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      applicants: job.applicantCount ?? 0,
      views: job.views ?? 0,
      status: job.status,
      postedAt: job.postedAt,
    }))

  return {
    company,
    stats: {
      activeJobs: activeJobs.length,
      totalApplicants: applications.length,
      shortlisted: countStatus(APPLICATION_STATUS.SHORTLISTED),
      interviews: countStatus(APPLICATION_STATUS.INTERVIEW),
      hired: countStatus(APPLICATION_STATUS.HIRED),
      drafts: jobs.filter((job) => job.status === JOB_STATUS.DRAFT).length,
      pendingApproval: jobs.filter((job) => job.status === JOB_STATUS.PENDING).length,
      totalViews: jobs.reduce((sum, job) => sum + (job.views ?? 0), 0),
    },
    recentApplicants: applications.slice(0, 6).map((row) => ({
      id: row.id,
      candidateName: row.candidate_name,
      headline: row.headline,
      jobTitle: row.job?.title,
      jobId: row.job_id,
      status: row.status,
      stage: row.stage,
      appliedAt: row.applied_at,
      yearsOfExperience: row.years_of_experience,
      skills: row.skills ?? [],
    })),
    topJobs,
  }
}

export async function getRecruiterAnalytics() {
  const { profile, jobs, applications } = await getRecruiterData()
  const funnelStages = PIPELINE_STAGES.map((stage) => stage.key)
  const funnel = funnelStages.map((stage, index) => ({
    stage,
    value: applications.filter(
      (row) =>
        funnelStages.indexOf(row.stage) >= index &&
        row.status !== APPLICATION_STATUS.REJECTED,
    ).length,
  }))
  const byWorkMode = ['Hybrid', 'On-site', 'Remote'].map((mode) => ({
    mode,
    value: applications.filter((row) => row.job?.work_mode === mode).length,
  }))
  const hired = applications.filter((row) => row.status === APPLICATION_STATUS.HIRED).length
  const rejected = applications.filter((row) => row.status === APPLICATION_STATUS.REJECTED).length
  const decided = hired + rejected
  const byMonth = new Map()
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setMonth(date.getMonth() - offset, 1)
    byMonth.set(date.toISOString().slice(0, 7), { month: date.toLocaleString('en', { month: 'short' }), jobs: 0, applications: 0 })
  }
  jobs.forEach((job) => {
    const key = String(job.createdAt ?? '').slice(0, 7)
    if (byMonth.has(key)) byMonth.get(key).jobs += 1
  })
  applications.forEach((row) => {
    const key = String(row.applied_at ?? '').slice(0, 7)
    if (byMonth.has(key)) byMonth.get(key).applications += 1
  })

  return {
    companyId: profile.company_id,
    funnel,
    byWorkMode,
    totals: {
      jobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status === JOB_STATUS.ACTIVE).length,
      applicants: applications.length,
      hired,
      rejected,
      views: jobs.reduce((sum, job) => sum + (job.views ?? 0), 0),
      avgApplicantsPerJob: jobs.length ? Math.round(applications.length / jobs.length) : 0,
      hireRate: decided ? Math.round((hired / decided) * 100) : 0,
    },
    trend: [...byMonth.values()],
    topJobs: [...jobs]
      .sort((a, b) => (b.applicantCount ?? 0) - (a.applicantCount ?? 0))
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
