import { requireSupabase } from './supabaseClient'

const RESUME_BUCKET = 'jobkhoj-resumes'
const MAX_RESUME_BYTES = 5 * 1024 * 1024
const RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export async function getUserById(id) {
  const client = requireSupabase()
  const { data: auth, error: authError } = await client.auth.getUser()
  fail(authError, 'get current user')
  if (auth.user?.id === id) {
    const { data, error } = await client
      .from('profiles')
      .select('id,name,email,phone,role,company_name,company_size,company_id,recruiter_approved,status,avatar_url,location,headline,bio,skills,years_of_experience,experience,education,projects,certifications,social,public_profile,resume_name,resume_size,resume_uploaded_at')
      .eq('id', id)
      .single()
    fail(error, 'load user profile')
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      companyName: data.company_name,
      companySize: data.company_size,
      companyId: data.company_id,
      recruiterApproved: data.recruiter_approved,
      status: data.status,
      avatar: data.avatar_url,
      location: data.location,
      headline: data.headline,
      bio: data.bio,
      skills: data.skills ?? [],
      yearsOfExperience: data.years_of_experience,
      experience: data.experience ?? [],
      education: data.education ?? [],
      projects: data.projects ?? [],
      certifications: data.certifications ?? [],
      social: data.social ?? {},
      publicProfile: data.public_profile,
      hasResume: Boolean(data.resume_name),
      resumeName: data.resume_name,
      resumeSize: data.resume_size,
      resumeUploadedAt: data.resume_uploaded_at,
    }
  }
  const { data, error } = await client
    .from('public_candidate_profiles')
    .select('*')
    .eq('id', id)
    .single()
  fail(error, 'load public candidate profile')
  return {
    ...data,
    avatar: data.avatar_url,
    yearsOfExperience: data.years_of_experience,
    skills: data.skills ?? [],
    education: data.education ?? [],
    projects: data.projects ?? [],
    certifications: data.certifications ?? [],
    social: data.social ?? {},
  }
}

function fail(error, operation) {
  if (!error) return
  console.error(`[supabase user data] ${operation} failed`, {
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
  if (!data.user) throw new Error('Sign in to access your account data.')
  return { client, user: data.user }
}

function mapJob(row) {
  const job = row.job
  if (!job) return null
  return {
    id: job.id,
    title: job.title,
    company: job.company_name ? { id: job.company_id, name: job.company_name } : null,
    companyName: job.company_name,
    department: job.department,
    location: job.location,
    workMode: job.work_mode,
    employmentType: job.employment_type,
    experienceLabel: job.experience_label,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    skills: job.skills ?? [],
    featured: job.featured,
    openings: job.openings,
    postedAt: job.posted_at,
    status: job.status,
  }
}

export async function listSavedJobs() {
  const { client, user } = await signedInUser()
  const { data, error } = await client
    .from('saved_jobs')
    .select('id,user_id,job_id,saved_at,job:jobs(id,company_id,company_name,title,department,location,work_mode,employment_type,experience_label,salary_min,salary_max,skills,featured,openings,posted_at,status)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
  fail(error, 'list saved jobs')
  return (data ?? [])
    .filter((row) => row.job)
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      jobId: row.job_id,
      savedAt: row.saved_at,
      job: mapJob(row),
    }))
}

export async function saveJob(jobId) {
  const { client, user } = await signedInUser()
  const { data, error } = await client
    .from('saved_jobs')
    .upsert({ user_id: user.id, job_id: jobId }, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
    .select('id,user_id,job_id,saved_at')
    .maybeSingle()
  fail(error, 'save job')
  if (data) return { id: data.id, userId: data.user_id, jobId: data.job_id, savedAt: data.saved_at }

  const { data: existing, error: readError } = await client
    .from('saved_jobs')
    .select('id,user_id,job_id,saved_at')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .single()
  fail(readError, 'confirm saved job')
  return { id: existing.id, userId: existing.user_id, jobId: existing.job_id, savedAt: existing.saved_at }
}

export async function removeSavedJob(jobId) {
  const { data, error } = await requireSupabase()
    .from('saved_jobs')
    .delete()
    .eq('job_id', jobId)
    .select('id')
  fail(error, 'remove saved job')
  return { success: Boolean(data?.length) }
}

export async function toggleSavedJob(jobId) {
  const { client, user } = await signedInUser()
  const { data: existing, error: readError } = await client
    .from('saved_jobs')
    .select('id')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .maybeSingle()
  fail(readError, 'check saved job')

  if (existing) {
    const { error } = await client.from('saved_jobs').delete().eq('id', existing.id)
    fail(error, 'unsave job')
    return { saved: false }
  }
  await saveJob(jobId)
  return { saved: true }
}

export async function getResume() {
  const { client, user } = await signedInUser()
  const { data, error } = await client
    .from('profiles')
    .select('resume_path,resume_name,resume_size,resume_uploaded_at')
    .eq('id', user.id)
    .single()
  fail(error, 'load resume metadata')
  if (!data.resume_path) return null

  const { data: signed, error: signedError } = await client.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(data.resume_path, 60 * 5)
  fail(signedError, 'create resume download link')
  return {
    path: data.resume_path,
    name: data.resume_name,
    size: data.resume_size,
    uploadedAt: data.resume_uploaded_at,
    url: signed.signedUrl,
  }
}

function validateResume(file) {
  if (!file) throw new Error('Please choose a resume file.')
  if (!RESUME_TYPES.has(file.type)) {
    throw new Error('Upload a PDF, DOC, or DOCX resume.')
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new Error('Resume files must be 5 MB or smaller.')
  }
}

export async function uploadResume(file) {
  validateResume(file)
  const { client, user } = await signedInUser()
  const extension = file.name.split('.').pop()?.toLowerCase()
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await client.storage
    .from(RESUME_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  fail(uploadError, 'upload resume')

  const { error: profileError } = await client
    .from('profiles')
    .update({
      resume_path: path,
      resume_name: file.name,
      resume_size: file.size,
      resume_uploaded_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (profileError) {
    const { error: cleanupError } = await client.storage.from(RESUME_BUCKET).remove([path])
    if (cleanupError) {
      console.error('[supabase user data] Resume cleanup after profile update failure failed.', cleanupError)
    }
    fail(profileError, 'save resume metadata')
  }
  return getResume()
}

export async function deleteResume() {
  const { client, user } = await signedInUser()
  const { data: profile, error: readError } = await client
    .from('profiles')
    .select('resume_path')
    .eq('id', user.id)
    .single()
  fail(readError, 'load resume metadata')
  if (!profile.resume_path) return { success: true }

  const { error: removeError } = await client.storage
    .from(RESUME_BUCKET)
    .remove([profile.resume_path])
  fail(removeError, 'delete resume file')
  const { error: updateError } = await client
    .from('profiles')
    .update({
      resume_path: null,
      resume_name: null,
      resume_size: null,
      resume_uploaded_at: null,
    })
    .eq('id', user.id)
  fail(updateError, 'remove resume metadata')
  return { success: true }
}

function mapAlert(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keywords: row.keywords ?? [],
    location: row.location,
    experience: row.experience,
    department: row.department,
    frequency: row.frequency,
    active: row.active,
    matches: row.matches,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listJobAlerts() {
  const { client, user } = await signedInUser()
  const { data, error } = await client
    .from('job_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  fail(error, 'list job alerts')
  return (data ?? []).map(mapAlert)
}

export async function createJobAlert(payload) {
  const { client, user } = await signedInUser()
  const { data, error } = await client
    .from('job_alerts')
    .insert({
      user_id: user.id,
      name: payload.name,
      keywords: payload.keywords ?? [],
      location: payload.location ?? '',
      experience: payload.experience ?? 'Any',
      department: payload.department ?? 'Software Development',
      frequency: payload.frequency ?? 'Daily',
    })
    .select('*')
    .single()
  fail(error, 'create job alert')
  return mapAlert(data)
}

export async function updateJobAlert(id, patch) {
  const fields = {
    name: 'name',
    keywords: 'keywords',
    location: 'location',
    experience: 'experience',
    department: 'department',
    frequency: 'frequency',
    active: 'active',
  }
  const values = Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => patch[key] !== undefined)
      .map(([key, column]) => [column, patch[key]]),
  )
  const { data, error } = await requireSupabase()
    .from('job_alerts')
    .update(values)
    .eq('id', id)
    .select('*')
    .single()
  fail(error, 'update job alert')
  return mapAlert(data)
}

export async function deleteJobAlert(id) {
  const { data, error } = await requireSupabase()
    .from('job_alerts')
    .delete()
    .eq('id', id)
    .select('id')
  fail(error, 'delete job alert')
  return { success: Boolean(data?.length) }
}
