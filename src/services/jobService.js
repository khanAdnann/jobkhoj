import * as supabaseJobs from './supabaseJobs'
import * as localJobs from '@/mock/handlers/jobs'
import { API_MODE } from './api'
import { requireSupabase } from './supabaseClient'

function callJobStorage(supabaseOperation, localOperation) {
  if (API_MODE === 'mock') return localOperation()
  requireSupabase()
  return supabaseOperation()
}

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
  callJobStorage(() => supabaseJobs.listJobs(params), () => localJobs.listJobs(params))

export const getJob = (id) =>
  callJobStorage(() => supabaseJobs.getJob(id), () => localJobs.getJob(id))

export const getSimilarJobs = (id, limit = 6) =>
  callJobStorage(
    () => supabaseJobs.getSimilarJobs(id, limit),
    () => localJobs.getSimilarJobs(id, limit),
  )

export const getFeaturedJobs = (limit = 6) =>
  callJobStorage(
    () => supabaseJobs.getFeaturedJobs(limit),
    () => localJobs.getFeaturedJobs(limit),
  )

export const getFacets = () =>
  callJobStorage(() => supabaseJobs.getFacets(), () => localJobs.getFacets())

export const getJobsByCompany = (companyId, params = {}) =>
  callJobStorage(
    () => supabaseJobs.getJobsByCompany(companyId, params),
    () => localJobs.getJobsByCompany(companyId, params),
  )

export const createJob = (payload) =>
  callJobStorage(() => supabaseJobs.createJob(payload), () => localJobs.createJob(payload))

export const updateJob = (id, patch) =>
  callJobStorage(
    () => supabaseJobs.updateJob(id, patch),
    () => localJobs.updateJob(id, patch),
  )

export const deleteJob = (id) =>
  callJobStorage(() => supabaseJobs.deleteJob(id), () => localJobs.deleteJob(id))

export const duplicateJob = (id) =>
  callJobStorage(
    () => supabaseJobs.duplicateJob(id),
    () => localJobs.duplicateJob(id),
  )

export const closeJob = (id) =>
  callJobStorage(() => supabaseJobs.closeJob(id), () => localJobs.closeJob(id))

/**
 * Fire-and-forget view counter. Deliberately not awaited by callers — it must
 * never delay rendering the job page.
 */
export const trackJobView = () => {}
