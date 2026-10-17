import { API_MODE, api, request } from './api'
import * as mock from '@/mock/handlers/users'
// Profile writes live with the auth handlers, not the user CRUD handlers.
import { updateProfile as mockUpdateProfile } from '@/mock/handlers/auth'
import * as supabaseUsers from './supabaseUsers'
import { updateProfile as updateSupabaseProfile } from './authService'

/**
 * User service — profiles, resume, saved jobs and job alerts.
 *
 *   GET    /users/:id
 *   PUT    /users/me
 *   GET    /users/me/resume
 *   POST   /users/me/resume        (multipart)
 *   DELETE /users/me/resume
 *   GET    /users/me/saved-jobs
 *   POST   /users/me/saved-jobs
 *   DELETE /users/me/saved-jobs/:jobId
 *   POST   /users/me/saved-jobs/:jobId/toggle
 *   GET    /users/me/job-alerts
 *   POST   /users/me/job-alerts
 *   PUT    /users/me/job-alerts/:id
 *   DELETE /users/me/job-alerts/:id
 */
export const getUser = (id) =>
  API_MODE === 'mock'
    ? mock.getUser(id)
    : supabaseUsers.getUserById(id)

export const updateProfile = (patch) =>
  API_MODE === 'mock'
    ? request(() => api.put('/users/me', patch), () => mockUpdateProfile(patch))
    : updateSupabaseProfile(patch)

/* --------------------------------- resume --------------------------------- */

export const getResume = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/users/me/resume'), () => mock.getResume())
    : supabaseUsers.getResume()

/**
 * Resume upload.
 * Live mode must send multipart/form-data — the mock only records metadata.
 */
export const uploadResume = (file) => {
  if (API_MODE !== 'mock') {
    const actualFile = file instanceof FormData ? file.get('file') : file
    if (typeof File === 'undefined' || !(actualFile instanceof File)) {
      return Promise.reject(new Error('A resume file is required.'))
    }
    return supabaseUsers.uploadResume(actualFile)
  }

  if (file instanceof FormData) {
    return request(
      () =>
        api.post('/users/me/resume', file, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      () => mock.uploadResume(file.get('file') ?? null),
    )
  }

  return request(
    () => {
      const form = new FormData()
      form.append('file', file)
      return api.post('/users/me/resume', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    () => mock.uploadResume(file),
  )
}

export const deleteResume = () =>
  API_MODE === 'mock'
    ? request(() => api.delete('/users/me/resume'), () => mock.deleteResume())
    : supabaseUsers.deleteResume()

/* ------------------------------- saved jobs ------------------------------- */

export const getSavedJobs = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/users/me/saved-jobs'), () => mock.listSavedJobs())
    : supabaseUsers.listSavedJobs()

export const saveJob = (jobId) =>
  API_MODE === 'mock'
    ? request(() => api.post('/users/me/saved-jobs', { jobId }), () => mock.saveJob(jobId))
    : supabaseUsers.saveJob(jobId)

export const removeSavedJob = (jobId) =>
  API_MODE === 'mock'
    ? request(() => api.delete(`/users/me/saved-jobs/${jobId}`), () => mock.removeSavedJob(jobId))
    : supabaseUsers.removeSavedJob(jobId)

export const toggleSavedJob = (jobId) =>
  API_MODE === 'mock'
    ? request(() => api.post(`/users/me/saved-jobs/${jobId}/toggle`), () =>
        mock.toggleSavedJob(jobId),
      )
    : supabaseUsers.toggleSavedJob(jobId)

/* ------------------------------- job alerts ------------------------------- */

export const getJobAlerts = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/users/me/job-alerts'), () => mock.listJobAlerts())
    : supabaseUsers.listJobAlerts()

export const createJobAlert = (payload) =>
  API_MODE === 'mock'
    ? request(() => api.post('/users/me/job-alerts', payload), () => mock.createJobAlert(payload))
    : supabaseUsers.createJobAlert(payload)

export const updateJobAlert = (id, patch) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/users/me/job-alerts/${id}`, patch), () =>
        mock.updateJobAlert(id, patch),
      )
    : supabaseUsers.updateJobAlert(id, patch)

export const deleteJobAlert = (id) =>
  API_MODE === 'mock'
    ? request(() => api.delete(`/users/me/job-alerts/${id}`), () => mock.deleteJobAlert(id))
    : supabaseUsers.deleteJobAlert(id)
