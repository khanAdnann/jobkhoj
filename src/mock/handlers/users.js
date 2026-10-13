import { db } from '@/mock/db'
import { delay } from './latency'
import { paginate, sortByKey } from './query'
import { getCurrentUserId } from './auth'
import { ROLES, USER_STATUS } from '@/utils/constants'

/** User, resume, saved-job and job-alert mock handlers. */

/* ---------------------------------- users --------------------------------- */

export async function getUser(id) {
  await delay(140, 300)
  const user = db.find('users', id)
  if (!user) throw new Error('User not found')
  return user
}

export async function listUsers({ role, status, query = '', page = 1, pageSize = 12 } = {}) {
  await delay()

  let users = db.all('users')

  if (role && role !== 'all') {
    users = users.filter((row) => row.role === role)
  }
  if (status && status !== 'all') {
    users = users.filter((row) => row.status === status)
  }
  if (query) {
    const needle = query.toLowerCase().trim()
    users = users.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle) ||
        (row.location ?? '').toLowerCase().includes(needle),
    )
  }

  // Recruiters are listed by company in the admin area, so resolve the name
  // rather than making that screen show a raw company id.
  const companies = db.all('companies')
  const withCompany = users.map((row) =>
    row.companyId
      ? { ...row, companyName: companies.find((company) => company.id === row.companyId)?.name ?? null }
      : row,
  )

  return paginate(sortByKey(withCompany, 'createdAt', 'desc'), page, pageSize)
}

export async function setUserStatus(id, status) {
  await delay(240, 460)
  const user = db.find('users', id)
  if (!user) throw new Error('User not found')
  return db.update('users', id, { status, updatedAt: new Date().toISOString() })
}

export async function deleteUser(id) {
  await delay(280, 520)

  if (id === getCurrentUserId()) {
    throw new Error('You cannot delete your own account.')
  }

  db.removeWhere('savedJobs', (row) => row.userId === id)
  db.removeWhere('notifications', (row) => row.userId === id)
  db.removeWhere('jobAlerts', (row) => row.userId === id)

  return { success: db.remove('users', id) }
}

/** Aggregate user counts for the admin dashboard. */
export async function getUserStats() {
  await delay(160, 320)

  return {
    totalUsers: db.count('users'),
    jobSeekers: db.count('users', (row) => row.role === ROLES.JOB_SEEKER),
    recruiters: db.count('users', (row) => row.role === ROLES.RECRUITER),
    admins: db.count('users', (row) => row.role === ROLES.ADMIN),
    activeUsers: db.count('users', (row) => row.status === USER_STATUS.ACTIVE),
    blockedUsers: db.count('users', (row) => row.status === USER_STATUS.BLOCKED),
  }
}

/* --------------------------------- resume --------------------------------- */

export async function getResume() {
  await delay(160, 320)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const user = db.find('users', userId)
  if (!user?.hasResume) return null

  return {
    name: user.resumeName,
    size: user.resumeSize,
    uploadedAt: user.resumeUploadedAt,
  }
}

/**
 * The mock layer stores only file metadata — a real backend would accept
 * multipart/form-data and return a stored object URL.
 */
export async function uploadResume(file) {
  await delay(700, 1200)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  if (!file) throw new Error('Please choose a file to upload.')

  return db.update('users', userId, {
    hasResume: true,
    resumeName: file.name,
    resumeSize: file.size,
    resumeUploadedAt: new Date().toISOString(),
  })
}

export async function deleteResume() {
  await delay(320, 560)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  return db.update('users', userId, {
    hasResume: false,
    resumeName: null,
    resumeSize: null,
    resumeUploadedAt: null,
  })
}

/* -------------------------------- saved jobs ------------------------------ */

export async function listSavedJobs() {
  await delay()

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const jobs = db.all('jobs')
  const companies = db.all('companies')

  return db
    .where('savedJobs', (row) => row.userId === userId)
    .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    .map((saved) => {
      const job = jobs.find((candidate) => candidate.id === saved.jobId)
      if (!job) return null

      const company = companies.find((row) => row.id === job.companyId)

      return {
        ...saved,
        job: {
          ...job,
          company: company
            ? { id: company.id, name: company.name, slug: company.slug, verification: company.verification }
            : null,
        },
      }
    })
    .filter(Boolean)
}

export async function saveJob(jobId) {
  await delay(180, 340)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Sign in to save jobs.')

  const existing = db.first(
    'savedJobs',
    (row) => row.userId === userId && row.jobId === jobId,
  )
  if (existing) return existing

  return db.insert('savedJobs', {
    userId,
    jobId,
    savedAt: new Date().toISOString(),
  })
}

export async function removeSavedJob(jobId) {
  await delay(180, 340)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  return {
    success: db.removeWhere(
      'savedJobs',
      (row) => row.userId === userId && row.jobId === jobId,
    ),
  }
}

export async function toggleSavedJob(jobId) {
  const userId = getCurrentUserId()
  if (!userId) throw new Error('Sign in to save jobs.')

  const existing = db.first('savedJobs', (row) => row.userId === userId && row.jobId === jobId)

  if (existing) {
    await removeSavedJob(jobId)
    return { saved: false }
  }

  await saveJob(jobId)
  return { saved: true }
}

/* -------------------------------- job alerts ------------------------------ */

export async function listJobAlerts() {
  await delay(180, 340)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  return sortByKey(db.where('jobAlerts', (row) => row.userId === userId), 'createdAt', 'desc')
}

export async function createJobAlert(payload) {
  await delay(360, 640)

  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  return db.insert('jobAlerts', {
    userId,
    name: payload.name,
    keywords: payload.keywords ?? [],
    location: payload.location ?? '',
    experience: payload.experience ?? 'Any',
    department: payload.department ?? 'Software Development',
    frequency: payload.frequency ?? 'Daily',
    active: true,
    matches: 0,
    createdAt: new Date().toISOString(),
  })
}

export async function updateJobAlert(id, patch) {
  await delay(240, 460)

  const alert = db.find('jobAlerts', id)
  if (!alert) throw new Error('Alert not found')

  return db.update('jobAlerts', id, patch)
}

export async function deleteJobAlert(id) {
  await delay(240, 460)
  return { success: db.remove('jobAlerts', id) }
}

/* ------------------------------ notifications ----------------------------- */

export async function listNotifications({ page = 1, pageSize = 8 } = {}) {
  await delay(160, 320)

  const userId = getCurrentUserId()
  const all = userId
    ? db.where('notifications', (row) => row.userId === userId)
    : []

  const sorted = sortByKey(all, 'createdAt', 'desc')

  return {
    ...paginate(sorted, page, pageSize),
    unreadCount: sorted.filter((row) => !row.read).length,
  }
}

export async function markNotificationRead(id) {
  await delay(120, 240)
  const notification = db.find('notifications', id)
  if (!notification) throw new Error('Notification not found')
  return db.update('notifications', id, { read: true })
}

export async function markAllNotificationsRead() {
  await delay(200, 380)

  const userId = getCurrentUserId()
  if (!userId) return { success: false }

  return {
    success: db.updateWhere(
      'notifications',
      (row) => row.userId === userId,
      { read: true },
    ) > 0,
  }
}

export async function deleteNotification(id) {
  await delay(140, 280)
  return { success: db.remove('notifications', id) }
}

/* -------------------------------- platform -------------------------------- */

export async function getPlatformAnalytics() {
  await delay(240, 460)
  return db.singleton('analytics')
}

/** Restores the seeded dataset. Exposed on the admin reports screen. */
export async function resetMockData() {
  await delay(500, 900)
  return db.reset()
}
