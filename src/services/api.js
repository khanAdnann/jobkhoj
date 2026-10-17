import axios from 'axios'
import { storage } from '@/utils/storage'
import { TOKEN_KEY, USER_KEY } from '@/utils/constants'

/**
 * Centralised HTTP client.
 *
 * Every network call in the app goes through this file — components never
 * reference a URL, and `VITE_API_BASE_URL` from .env is the single place a
 * backend address is configured.
 *
 * `VITE_API_MODE=mock` selects browser-local mock auth and localStorage-backed
 * persistence, even if Supabase credentials are present. `live` enables
 * Supabase-backed services and uses the REST backend for remaining endpoints.
 *
 * Modes
 * -----
 * VITE_API_MODE=mock  -> services use localStorage-backed mock handlers.
 * VITE_API_MODE=live  -> Supabase auth/jobs/portal data plus REST for endpoints
 *                        that do not yet have a Supabase implementation.
 *                        Live requests never fall back to mock data.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const API_MODE = (import.meta.env.VITE_API_MODE ?? 'mock').toLowerCase()

export { TOKEN_KEY, USER_KEY }

/* ------------------------------ token helpers ----------------------------- */

export const getToken = () => storage.get(TOKEN_KEY, null)
export const setToken = (token) => storage.set(TOKEN_KEY, token)
export const clearToken = () => storage.remove(TOKEN_KEY)

/* -------------------------------- instance -------------------------------- */

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

/* ------------------------------ interceptors ------------------------------ */

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/** Subscribers notified when the backend reports the session has expired. */
const unauthorizedHandlers = new Set()

export function onUnauthorized(handler) {
  unauthorizedHandlers.add(handler)
  return () => unauthorizedHandlers.delete(handler)
}

let liveUnavailable = false

/**
 * True only when the app is explicitly configured for mock mode.
 */
export function isMockMode() {
  return API_MODE === 'mock'
}

/** Forces live mode back on (used by the "retry backend" admin action). */
export function resetMockFallback() {
  liveUnavailable = false
}

/** Whether the live backend has been marked unreachable. */
export function isLiveUnavailable() {
  return liveUnavailable
}

function isNetworkFailure(error) {
  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    (error.response === undefined && error.request !== undefined)
  )
}

api.interceptors.response.use(
  (response) => {
    liveUnavailable = false
    // Spring Boot typically wraps payloads; unwrap a bare { data: ... } envelope
    // but leave arrays and primitives untouched.
    const payload = response.data
    if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
      return payload.data
    }
    return payload
  },
  (error) => {
    const status = error.response?.status

    if (isNetworkFailure(error)) {
      // Backend down / CORS blocked / offline.
      if (!liveUnavailable) {
        liveUnavailable = true
        console.warn(
          `[api] Backend unreachable at ${API_BASE_URL} — falling back to mock data.`,
        )
      }
    }

    if (status === 401) {
      clearToken()
      unauthorizedHandlers.forEach((handler) => handler(error))
    }

    return Promise.reject(normalizeError(error))
  },
)

/* ------------------------------ error shaping ----------------------------- */

/** Converts an axios error into a predictable Error the UI can render. */
export function normalizeError(error) {
  const status = error.response?.status
  const serverMessage =
    error.response?.data?.message ?? error.response?.data?.error ?? null

  const fallback =
    status === 401
      ? 'Your session has expired. Please sign in again.'
      : status === 403
        ? 'You do not have permission to perform this action.'
        : status === 404
          ? 'The requested resource could not be found.'
          : status >= 500
            ? 'Something went wrong on our side. Please try again.'
            : error.message || 'Network error. Please check your connection.'

  const normalised = new Error(serverMessage || fallback)
  normalised.status = status ?? 0
  normalised.original = error
  normalised.isNetworkError = isNetworkFailure(error)

  return normalised
}

/* --------------------------------- request -------------------------------- */

/**
 * Runs a service call against the configured backend.
 *
 *   return request(
 *     () => api.get('/jobs', { params }),   // live
 *     () => mockListJobs(params),           // mock
 *   )
 *
 * Mock handlers are available only when VITE_API_MODE=mock. Live network
 * failures and HTTP errors are re-thrown so the UI can surface them.
 */
export async function request(liveCall, mockCall) {
  if (isMockMode()) {
    return mockCall()
  }

  return liveCall()
}

export default api
