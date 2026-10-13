import { api, request } from './api'
import * as mock from '@/mock/handlers/jobs'

/**
 * Job service — public browsing plus recruiter job management.
 *
 *   GET    /jobs                 (filters, sort, page)
 *   GET    /jobs/:id
 *   GET    /jobs/:id/similar
 *   GET    /jobs/featured
 *   GET    /jobs/facets
 *   GET    /companies/:id/jobs
 *   POST   /jobs
 *   PUT    /jobs/:id
 *   DELETE /jobs/:id
 *   POST   /jobs/:id/duplicate
 *   POST   /jobs/:id/close
 */
export const listJobs = (params = {}) =>
  request(
    () => api.get('/jobs', { params }),
    () => mock.listJobs(params),
  )

export const getJob = (id) =>
  request(() => api.get(`/jobs/${id}`), () => mock.getJob(id))

export const getSimilarJobs = (id, limit = 6) =>
  request(() => api.get(`/jobs/${id}/similar`, { params: { limit } }), () =>
    mock.getSimilarJobs(id, limit),
  )

export const getFeaturedJobs = (limit = 6) =>
  request(() => api.get('/jobs/featured', { params: { limit } }), () =>
    mock.getFeaturedJobs(limit),
  )

export const getFacets = () => request(() => api.get('/jobs/facets'), () => mock.getFacets())

export const getJobsByCompany = (companyId, params = {}) =>
  request(() => api.get(`/companies/${companyId}/jobs`, { params }), () =>
    mock.getJobsByCompany(companyId, params),
  )

export const createJob = (payload) =>
  request(() => api.post('/jobs', payload), () => mock.createJob(payload))

export const updateJob = (id, patch) =>
  request(() => api.put(`/jobs/${id}`, patch), () => mock.updateJob(id, patch))

export const deleteJob = (id) =>
  request(() => api.delete(`/jobs/${id}`), () => mock.deleteJob(id))

export const duplicateJob = (id) =>
  request(() => api.post(`/jobs/${id}/duplicate`), () => mock.duplicateJob(id))

export const closeJob = (id) =>
  request(() => api.post(`/jobs/${id}/close`), () => mock.closeJob(id))

/**
 * Fire-and-forget view counter. Deliberately not awaited by callers — it must
 * never delay rendering the job page.
 */
export const trackJobView = (id) => {
  mock.incrementViews(id).catch(() => {})
}
