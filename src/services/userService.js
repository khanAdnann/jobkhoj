import { api, request } from './api'
import * as mock from '@/mock/handlers/users'
// Profile writes live with the auth handlers, not the user CRUD handlers.
import { updateProfile as mockUpdateProfile } from '@/mock/handlers/auth'

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
export const getUser = (id) => request(() => api.get(`/users/${id}`), () => mock.getUser(id))

export const updateProfile = (patch) =>
  request(() => api.put('/users/me', patch), () => mockUpdateProfile(patch))

/* --------------------------------- resume --------------------------------- */

export const getResume = () =>
  request(() => api.get('/users/me/resume'), () => mock.getResume())

/**
 * Resume upload.
 * Live mode must send multipart/form-data — the mock only records metadata.
 */
export const uploadResume = (file) => {
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
  request(() => api.delete('/users/me/resume'), () => mock.deleteResume())

/* ------------------------------- saved jobs ------------------------------- */

export const getSavedJobs = () =>
  request(() => api.get('/users/me/saved-jobs'), () => mock.listSavedJobs())

export const saveJob = (jobId) =>
  request(() => api.post('/users/me/saved-jobs', { jobId }), () => mock.saveJob(jobId))

export const removeSavedJob = (jobId) =>
  request(() => api.delete(`/users/me/saved-jobs/${jobId}`), () => mock.removeSavedJob(jobId))

export const toggleSavedJob = (jobId) =>
  request(() => api.post(`/users/me/saved-jobs/${jobId}/toggle`), () =>
    mock.toggleSavedJob(jobId),
  )

/* ------------------------------- job alerts ------------------------------- */

export const getJobAlerts = () =>
  request(() => api.get('/users/me/job-alerts'), () => mock.listJobAlerts())

export const createJobAlert = (payload) =>
  request(() => api.post('/users/me/job-alerts', payload), () => mock.createJobAlert(payload))

export const updateJobAlert = (id, patch) =>
  request(() => api.put(`/users/me/job-alerts/${id}`, patch), () =>
    mock.updateJobAlert(id, patch),
  )

export const deleteJobAlert = (id) =>
  request(() => api.delete(`/users/me/job-alerts/${id}`), () => mock.deleteJobAlert(id))
