import { api, request } from './api'
import * as mock from '@/mock/handlers/recruiter'
import { requireSupabase } from './supabaseClient'
import { getRecruiterJobs as getSupabaseRecruiterJobs } from './supabaseJobs'

/**
 * Recruiter service — everything scoped to the signed-in recruiter's company.
 *
 *   GET /recruiter/profile
 *   GET /recruiter/dashboard
 *   GET /recruiter/analytics
 *   GET /recruiter/jobs
 */
export const getRecruiterProfile = () =>
  request(() => api.get('/recruiter/profile'), () => mock.getRecruiterProfile())

export const getRecruiterDashboard = () =>
  request(() => api.get('/recruiter/dashboard'), () => mock.getRecruiterDashboard())

export const getRecruiterAnalytics = () =>
  request(() => api.get('/recruiter/analytics'), () => mock.getRecruiterAnalytics())

export const getRecruiterJobs = (params = {}) => {
  requireSupabase()
  return getSupabaseRecruiterJobs(params)
}
