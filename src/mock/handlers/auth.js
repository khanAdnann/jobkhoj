import { db } from '@/mock/db'
import { delay } from './latency'
import { storage } from '@/utils/storage'
import { slugify } from '@/utils/format'
import { COMPANY_STATUS, ROLES, USER_STATUS, TOKEN_KEY, USER_KEY } from '@/utils/constants'

/**
 * Mock authentication.
 *
 * MOCK-ONLY BEHAVIOUR: the password submitted here is intentionally ignored.
 * Any password works for any seeded account so the demo is usable, and no
 * credential is ever stored in the bundle. This whole module becomes a
 * passthrough to `POST /api/auth/login` the moment VITE_API_MODE=live is set —
 * see src/services/authService.js.
 */

/* ------------------------------ fake JWT ---------------------------------- */

const base64url = (value) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(value))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** Builds an unsigned JWT-shaped token: header.payload.signature */
export function createMockToken(user) {
  const header = { alg: 'none', typ: 'JWT' }
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 8, // 8 hours
  }

  return `${base64url(header)}.${base64url(payload)}.mock-signature`
}

export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/* ---------------------------- session storage ----------------------------- */

export function getSessionUser() {
  return storage.get(USER_KEY, null)
}

export function getCurrentUserId() {
  return getSessionUser()?.id ?? null
}

function storeSession(user, token) {
  storage.set(USER_KEY, user)
  storage.set(TOKEN_KEY, token)
  return { user, token }
}

/* -------------------------------- handlers -------------------------------- */

export async function login({ email, password }) {
  await delay(320, 640)

  if (!email || !password) {
    throw new Error('Email and password are required.')
  }

  const user = db.first('users', (row) => row.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    throw new Error('No account found with that email address.')
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new Error('This account has been blocked. Please contact support.')
  }

  // Password intentionally not checked in mock mode.
  return storeSession(user, createMockToken(user))
}

export async function register(payload) {
  await delay(420, 780)

  const { email, password, role } = payload

  if (!email || !password) {
    throw new Error('Email and password are required.')
  }

  const existing = db.first('users', (row) => row.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    throw new Error('An account with this email already exists.')
  }

  const isRecruiter = role === ROLES.RECRUITER

  // Recruiters are tied to a company, which starts life unverified and has to
  // clear admin review before it can post.
  let companyId = payload.companyId ?? null

  if (isRecruiter && !companyId) {
    const companyName = payload.companyName?.trim()
    if (!companyName) {
      throw new Error('Company name is required to register as a recruiter.')
    }

    const baseSlug = slugify(companyName) || 'company'
    const slugTaken = db.first('companies', (row) => row.slug === baseSlug)
    const slug = slugTaken ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

    const company = db.insert('companies', {
      name: companyName,
      slug,
      industry: payload.industry ?? 'Information Technology & Services',
      website: '',
      location: payload.location ?? '',
      size: payload.companySize ?? '',
      founded: null,
      about: '',
      benefits: [],
      social: {},
      verification: COMPANY_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    })

    companyId = company.id
  }

  const user = db.insert('users', {
    name: payload.name ?? 'New User',
    email,
    role: role ?? ROLES.JOB_SEEKER,
    status: USER_STATUS.ACTIVE,
    phone: payload.phone ?? '',
    location: payload.location ?? '',
    headline: isRecruiter ? 'Talent Acquisition Specialist' : 'Job Seeker',
    yearsOfExperience: 0,
    about: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    social: {},
    companyId,
    createdAt: new Date().toISOString(),
    hasResume: false,
    resumeName: null,
    resumeSize: null,
    resumeUploadedAt: null,
  })

  return storeSession(user, createMockToken(user))
}

export async function logout() {
  await delay(120, 240)
  storage.remove(USER_KEY)
  storage.remove(TOKEN_KEY)
  return { success: true }
}

export async function me() {
  await delay(120, 260)
  const user = getSessionUser()

  if (!user) throw new Error('Not authenticated')

  // Re-read from the DB so admin edits (e.g. account blocked) take effect.
  const fresh = db.find('users', user.id)
  return fresh ?? user
}

export async function forgotPassword({ email }) {
  await delay(360, 640)

  const user = db.first('users', (row) => row.email.toLowerCase() === String(email).toLowerCase())

  if (!user) {
    // Do not leak account existence in the real backend; keep the same shape here.
    return { success: true }
  }

  return { success: true, resetToken: createMockToken({ ...user, sub: user.id }) }
}

export async function resetPassword({ token, password }) {
  await delay(360, 620)

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }

  const payload = decodeToken(token)
  if (!payload?.sub) {
    throw new Error('This reset link is invalid or has expired.')
  }

  // Nothing is persisted — there is no password store in the mock layer.
  storage.remove(USER_KEY)
  storage.remove(TOKEN_KEY)

  return { success: true }
}

export async function updateProfile(patch) {
  await delay(300, 560)

  const user = getSessionUser()
  if (!user) throw new Error('Not authenticated')

  const updated = db.update('users', user.id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  })

  storage.set(USER_KEY, updated)
  return updated
}

export async function changePassword() {
  await delay(320, 600)
  // No password is stored in the mock layer.
  return { success: true }
}

/* ------------------------------ demo accounts ----------------------------- */

/**
 * Read-only reference of the seeded sign-in accounts, surfaced on the login
 * page so the demo can be explored quickly.
 */
export const DEMO_ACCOUNTS = [
  { role: ROLES.JOB_SEEKER, email: 'seeker@jobkhoj.in', label: 'Job Seeker' },
  { role: ROLES.RECRUITER, email: 'recruiter@jobkhoj.in', label: 'Recruiter' },
  { role: ROLES.ADMIN, email: 'admin@jobkhoj.in', label: 'Admin' },
]
