import { api, request } from './api'
import * as mock from '@/mock/handlers/applications'

/**
 * Application service — candidate submissions plus the recruiter pipeline.
 *
 *   GET  /applications                 (mine)
 *   GET  /applications/:id
 *   POST /applications                 (apply)
 *   GET  /jobs/:id/applicants
 *   GET  /jobs/:id/pipeline
 *   PUT  /applications/:id/stage
 *   GET  /candidates
 *   GET  /candidates/:id
 */
export const getMyApplications = (params = {}) =>
  request(() => api.get('/applications', { params }), () => mock.listMyApplications(params))

export const getMyApplicationStats = () =>
  request(() => api.get('/applications/stats'), () => mock.getMyApplicationStats())

export const getApplicationById = (id) =>
  request(() => api.get(`/applications/${id}`), () => mock.getApplicationById(id))

export const submitApplication = (payload) =>
  request(() => api.post('/applications', payload), () => mock.submitApplication(payload))

/* --------------------------- recruiter pipeline --------------------------- */

export const getJobApplicants = (jobId, params = {}) =>
  request(() => api.get(`/jobs/${jobId}/applicants`, { params }), () =>
    mock.listJobApplicants(jobId, params),
  )

export const getPipeline = (jobId) =>
  request(() => api.get(`/jobs/${jobId}/pipeline`), () => mock.getPipeline(jobId))

export const updateApplicationStage = (id, stage) =>
  request(() => api.put(`/applications/${id}/stage`, { stage }), () =>
    mock.updateApplicationStage(id, stage),
  )

export const shortlistApplication = (id) =>
  request(() => api.post(`/applications/${id}/shortlist`), () => mock.shortlistApplication(id))

export const rejectApplication = (id) =>
  request(() => api.post(`/applications/${id}/reject`), () => mock.rejectApplication(id))

export const hireApplication = (id) =>
  request(() => api.post(`/applications/${id}/hire`), () => mock.hireApplication(id))

/* -------------------------------- candidates ------------------------------ */

export const searchCandidates = (params = {}) =>
  request(() => api.get('/candidates', { params }), () => mock.searchCandidates(params))

export const getCandidate = (id) =>
  request(() => api.get(`/candidates/${id}`), () => mock.getCandidateById(id))
