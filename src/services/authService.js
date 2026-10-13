import { api, request, setToken, clearToken, TOKEN_KEY, USER_KEY } from './api'
import * as mock from '@/mock/handlers/auth'
import { storage } from '@/utils/storage'

/**
 * Authentication service.
 *
 * Live mode maps 1:1 onto the expected Spring Boot endpoints:
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

export const login = (credentials) =>
  request(
    () => api.post('/auth/login', credentials),
    () => mock.login(credentials),
  ).then((result) => {
    // Persist so the request interceptor can attach the Bearer token.
    if (result?.token) setToken(result.token)
    if (result?.user) storage.set(USER_KEY, result.user)
    return result
  })

export const register = (payload) =>
  request(
    () => api.post('/auth/register', payload),
    () => mock.register(payload),
  ).then((result) => {
    if (result?.token) setToken(result.token)
    if (result?.user) storage.set(USER_KEY, result.user)
    return result
  })

export const logout = () =>
  request(
    () => api.post('/auth/logout'),
    () => mock.logout(),
  ).finally(() => {
    clearToken()
    storage.remove(USER_KEY)
  })

/** Restores the session on a hard refresh. */
export const me = () => request(() => api.get('/auth/me'), () => mock.me())

export const forgotPassword = (payload) =>
  request(
    () => api.post('/auth/forgot-password', payload),
    () => mock.forgotPassword(payload),
  )

export const resetPassword = (payload) =>
  request(
    () => api.post('/auth/reset-password', payload),
    () => mock.resetPassword(payload),
  ).finally(() => {
    clearToken()
    storage.remove(USER_KEY)
  })

export const updateProfile = (patch) =>
  request(
    () => api.put('/users/me', patch),
    () => mock.updateProfile(patch),
  )

export const changePassword = (payload) =>
  request(
    () => api.post('/users/me/password', payload),
    () => mock.changePassword(payload),
  )

/** Read-only helper for the login page's demo-account shortcuts. */
export const DEMO_ACCOUNTS = mock.DEMO_ACCOUNTS

export { TOKEN_KEY, USER_KEY }
