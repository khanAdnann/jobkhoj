import { API_MODE, api, request } from './api'
import * as mock from '@/mock/handlers/recruiter'
import { requireSupabase } from './supabaseClient'
import { getRecruiterJobs as getSupabaseRecruiterJobs } from './supabaseJobs'
import * as supabase from './supabaseRecruiter'

/**
 * Recruiter service — everything scoped to the signed-in recruiter's company.
 *
 *   GET /recruiter/profile
 *   GET /recruiter/dashboard
 *   GET /recruiter/analytics
 *   GET /recruiter/jobs
 */
export const getRecruiterProfile = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/recruiter/profile'), () => mock.getRecruiterProfile())
    : supabase.getRecruiterProfile()

export const getRecruiterDashboard = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/recruiter/dashboard'), () => mock.getRecruiterDashboard())
    : supabase.getRecruiterDashboard()

export const getRecruiterAnalytics = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/recruiter/analytics'), () => mock.getRecruiterAnalytics())
    : supabase.getRecruiterAnalytics()

export const getRecruiterJobs = (params = {}) => {
  if (API_MODE === 'mock') return mock.listRecruiterJobs(params)
  requireSupabase()
  return getSupabaseRecruiterJobs(params)
}
