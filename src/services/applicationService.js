import { API_MODE, api, request } from './api'
import * as mock from '@/mock/handlers/applications'
import * as supabase from './supabaseApplications'

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
  API_MODE === 'mock'
    ? request(() => api.get('/applications', { params }), () => mock.listMyApplications(params))
    : supabase.listMyApplications(params)

export const getMyApplicationStats = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/applications/stats'), () => mock.getMyApplicationStats())
    : supabase.getMyApplicationStats()

export const getApplicationById = (id) =>
  API_MODE === 'mock'
    ? request(() => api.get(`/applications/${id}`), () => mock.getApplicationById(id))
    : supabase.getApplicationById(id)

export const submitApplication = (payload) =>
  API_MODE === 'mock'
    ? request(() => api.post('/applications', payload), () => mock.submitApplication(payload))
    : supabase.submitApplication(payload)

/* --------------------------- recruiter pipeline --------------------------- */

export const getJobApplicants = (jobId, params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get(`/jobs/${jobId}/applicants`, { params }), () =>
        mock.listJobApplicants(jobId, params),
      )
    : supabase.listJobApplicants(jobId, params)

export const getPipeline = (jobId) =>
  API_MODE === 'mock'
    ? request(() => api.get(`/jobs/${jobId}/pipeline`), () => mock.getPipeline(jobId))
    : supabase.getPipeline(jobId)

export const updateApplicationStage = (id, stage) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/applications/${id}/stage`, { stage }), () =>
        mock.updateApplicationStage(id, stage),
      )
    : supabase.updateApplicationStage(id, stage)

export const shortlistApplication = (id) =>
  API_MODE === 'mock'
    ? request(() => api.post(`/applications/${id}/shortlist`), () => mock.shortlistApplication(id))
    : supabase.shortlistApplication(id)

export const rejectApplication = (id) =>
  API_MODE === 'mock'
    ? request(() => api.post(`/applications/${id}/reject`), () => mock.rejectApplication(id))
    : supabase.rejectApplication(id)

export const hireApplication = (id) =>
  API_MODE === 'mock'
    ? request(() => api.post(`/applications/${id}/hire`), () => mock.hireApplication(id))
    : supabase.hireApplication(id)

/* -------------------------------- candidates ------------------------------ */

export const searchCandidates = (params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get('/candidates', { params }), () => mock.searchCandidates(params))
    : supabase.searchCandidates(params)

export const getCandidate = (id) =>
  API_MODE === 'mock'
    ? request(() => api.get(`/candidates/${id}`), () => mock.getCandidateById(id))
    : supabase.getCandidateById(id)
