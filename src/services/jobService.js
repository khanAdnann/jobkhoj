import * as supabaseJobs from './supabaseJobs'
import { requireSupabase } from './supabaseClient'

function callSupabase(operation) {
  requireSupabase()
  return operation()
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
  callSupabase(() => supabaseJobs.listJobs(params))

export const getJob = (id) =>
  callSupabase(() => supabaseJobs.getJob(id))

export const getSimilarJobs = (id, limit = 6) =>
  callSupabase(() => supabaseJobs.getSimilarJobs(id, limit))

export const getFeaturedJobs = (limit = 6) =>
  callSupabase(() => supabaseJobs.getFeaturedJobs(limit))

export const getFacets = () =>
  callSupabase(() => supabaseJobs.getFacets())

export const getJobsByCompany = (companyId, params = {}) =>
  callSupabase(() => supabaseJobs.getJobsByCompany(companyId, params))

export const createJob = (payload) =>
  callSupabase(() => supabaseJobs.createJob(payload))

export const updateJob = (id, patch) =>
  callSupabase(() => supabaseJobs.updateJob(id, patch))

export const deleteJob = (id) =>
  callSupabase(() => supabaseJobs.deleteJob(id))

export const duplicateJob = (id) =>
  callSupabase(() => supabaseJobs.duplicateJob(id))

export const closeJob = (id) =>
  callSupabase(() => supabaseJobs.closeJob(id))

/**
 * Fire-and-forget view counter. Deliberately not awaited by callers — it must
 * never delay rendering the job page.
 */
export const trackJobView = () => {}
