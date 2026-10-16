import { api, request, setToken, clearToken, TOKEN_KEY, USER_KEY } from './api'
import * as mock from '@/mock/handlers/auth'
import { storage } from '@/utils/storage'
import { JOB_STATUS } from '@/utils/constants'
import { requireSupabase, supabaseEnabled } from './supabaseClient'

function throwSupabaseError(error) {
  if (error) {
    throw new Error(error.message || 'Supabase authentication failed.')
  }
}

export async function getSupabaseAppUser(authUser) {
  if (!authUser) return null

  const client = requireSupabase()
  const { data: profile, error } = await client
    .from('profiles')
    .select('id,name,phone,role,company_name,company_size,company_id,recruiter_approved')
    .eq('id', authUser.id)
    .maybeSingle()
  throwSupabaseError(error)

  if (!profile) {
    throw new Error(
      'Your account profile was not found. Run supabase/schema.sql in the Supabase SQL Editor, then sign up again or have an administrator provision your profile.',
    )
  }

  return {
    ...(authUser.user_metadata ?? {}),
    id: profile.id,
    name: profile.name || authUser.user_metadata?.name || authUser.email || 'JobKhoj user',
    email: authUser.email,
    phone: profile.phone,
    role: profile.role,
    companyId: profile.company_id,
    companyName: profile.company_name,
    companySize: profile.company_size,
    recruiterApproved: profile.recruiter_approved,
    status: JOB_STATUS.ACTIVE,
  }
}

/**
 * Authentication service.
 *
 * When Supabase env vars are configured, auth is provided by Supabase Auth.
 * Otherwise the existing Spring Boot/mock behavior remains:
 *   POST   /auth/register
 *   POST   /auth/login
 *   POST   /auth/logout
 *   GET    /auth/me
 *   POST   /auth/forgot-password
 *   POST   /auth/reset-password
 *   PUT    /users/me
 *   POST   /users/me/password
 *
 * TODO(backend): confirm the response envelope. The mock returns
 * { user, token }; if the backend wraps it differently only this file changes.
 */

export const login = async (credentials) => {
  if (supabaseEnabled) {
    const client = requireSupabase()
    const { data, error } = await client.auth.signInWithPassword(credentials)
    throwSupabaseError(error)
    return { user: await getSupabaseAppUser(data.user), token: data.session?.access_token }
  }

  return request(
    () => api.post('/auth/login', credentials),
    () => mock.login(credentials),
  ).then((result) => {
    if (result?.token) setToken(result.token)
    if (result?.user) storage.set(USER_KEY, result.user)
    return result
  })
}

export const register = async (payload) => {
  if (supabaseEnabled) {
    const client = requireSupabase()
    const { data, error } = await client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
          phone: payload.phone ?? '',
          role: payload.role,
          company_name: payload.companyName ?? '',
          company_size: payload.companySize ?? '',
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    throwSupabaseError(error)
    if (!data.session) return { user: null, needsEmailConfirmation: true }
    return { user: await getSupabaseAppUser(data.user) }
  }

  return request(
    () => api.post('/auth/register', payload),
    () => mock.register(payload),
  ).then((result) => {
    if (result?.token) setToken(result.token)
    if (result?.user) storage.set(USER_KEY, result.user)
    return result
  })
}

export const logout = async () => {
  if (supabaseEnabled) {
    const { error } = await requireSupabase().auth.signOut()
    throwSupabaseError(error)
    return { success: true }
  }

  return request(
    () => api.post('/auth/logout'),
    () => mock.logout(),
  ).finally(() => {
    clearToken()
    storage.remove(USER_KEY)
  })
}

/** Restores the session on a hard refresh. */
export const me = async () => {
  if (supabaseEnabled) {
    const { data, error } = await requireSupabase().auth.getUser()
    if (error?.message?.includes('Auth session missing')) return null
    throwSupabaseError(error)
    return getSupabaseAppUser(data.user)
  }

  return request(() => api.get('/auth/me'), () => mock.me())
}

export const forgotPassword = async (payload) => {
  if (supabaseEnabled) {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(payload.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    throwSupabaseError(error)
    return { success: true }
  }

  return request(
    () => api.post('/auth/forgot-password', payload),
    () => mock.forgotPassword(payload),
  )
}

export const resetPassword = async (payload) => {
  if (supabaseEnabled) {
    const client = requireSupabase()
    const { error } = await client.auth.updateUser({ password: payload.password })
    throwSupabaseError(error)
    const { error: signOutError } = await client.auth.signOut()
    throwSupabaseError(signOutError)
    return { success: true }
  }

  return request(
    () => api.post('/auth/reset-password', payload),
    () => mock.resetPassword(payload),
  ).finally(() => {
    clearToken()
    storage.remove(USER_KEY)
  })
}

export const updateProfile = async (patch) => {
  if (supabaseEnabled) {
    const client = requireSupabase()
    const { data: authData, error: authError } = await client.auth.getUser()
    throwSupabaseError(authError)
    if (!authData.user) throw new Error('Sign in before updating your profile.')

    const profilePatch = {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.companyName !== undefined ? { company_name: patch.companyName } : {}),
      ...(patch.companySize !== undefined ? { company_size: patch.companySize } : {}),
    }
    const metadataFields = [
      'headline',
      'location',
      'bio',
      'skills',
      'experience',
      'education',
      'projects',
      'certifications',
      'social',
      'yearsOfExperience',
      'hasResume',
      'resumeName',
      'resumeSize',
      'resumeUploadedAt',
    ]
    const metadataPatch = Object.fromEntries(
      metadataFields
        .filter((field) => patch[field] !== undefined)
        .map((field) => [field, patch[field]]),
    )

    if (Object.keys(profilePatch).length) {
      const { error } = await client
        .from('profiles')
        .update(profilePatch)
        .eq('id', authData.user.id)
      throwSupabaseError(error)
    }
    if (Object.keys(metadataPatch).length) {
      const { error } = await client.auth.updateUser({ data: metadataPatch })
      throwSupabaseError(error)
    }
    const { data: refreshed, error: refreshError } = await client.auth.getUser()
    throwSupabaseError(refreshError)
    return getSupabaseAppUser(refreshed.user)
  }

  return request(
    () => api.put('/users/me', patch),
    () => mock.updateProfile(patch),
  )
}

export const changePassword = async (payload) => {
  if (supabaseEnabled) {
    const client = requireSupabase()
    const { data, error: userError } = await client.auth.getUser()
    throwSupabaseError(userError)
    if (!data.user?.email) throw new Error('Sign in before changing your password.')
    const { error: verifyError } = await client.auth.signInWithPassword({
      email: data.user.email,
      password: payload.currentPassword,
    })
    throwSupabaseError(verifyError)
    const { error } = await client.auth.updateUser({ password: payload.newPassword })
    throwSupabaseError(error)
    return { success: true }
  }

  return request(
    () => api.post('/users/me/password', payload),
    () => mock.changePassword(payload),
  )
}

/** Read-only helper for the login page's demo-account shortcuts. */
export const DEMO_ACCOUNTS = mock.DEMO_ACCOUNTS

export { TOKEN_KEY, USER_KEY }
export { supabaseEnabled }
