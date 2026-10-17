import { API_MODE, api, request } from './api'
import * as mock from '@/mock/handlers/admin'
// User moderation and company verification are owned by their own handler
// modules; only the overview/report/moderation endpoints live in admin.js.
// Aliased so the exported service functions below don't shadow (and infinitely
// recurse into) the handler functions they delegate to.
import {
  listUsers as mockListUsers,
  setUserStatus as mockSetUserStatus,
  deleteUser as mockDeleteUser,
  getUserStats as mockGetUserStats,
  resetMockData as mockResetMockData,
} from '@/mock/handlers/users'
import {
  verifyCompany as mockVerifyCompany,
  rejectCompany as mockRejectCompany,
  suspendCompany as mockSuspendCompany,
} from '@/mock/handlers/companies'
import { JOB_STATUS, COMPANY_STATUS } from '@/utils/constants'
import * as supabase from './supabaseAdmin'

/**
 * Admin service — moderation and platform reporting.
 *
 *   GET    /admin/overview
 *   GET    /admin/jobs
 *   PUT    /admin/jobs/:id/status
 *   GET    /admin/companies
 *   PUT    /admin/companies/:id/verify
 *   GET    /admin/applications
 *   GET    /admin/reports
 *   GET    /admin/users
 *   PUT    /admin/users/:id/status
 *   DELETE /admin/users/:id
 */
export const getAdminOverview = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/overview'), () => mock.getAdminOverview())
    : supabase.getAdminOverview()

export const getReports = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/reports'), () => mock.getReports())
    : supabase.getAdminReports()

/* ---------------------------------- jobs ---------------------------------- */

export const getAdminJobs = (params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/jobs', { params }), () => mock.listAdminJobs(params))
    : supabase.getAdminJobs(params)

export const setJobStatus = (id, status) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/admin/jobs/${id}/status`, { status }), () =>
        mock.setJobStatus(id, status),
      )
    : supabase.setAdminJobStatus(id, status)

export const approveJob = (id) => setJobStatus(id, JOB_STATUS.ACTIVE)
export const rejectJob = (id) => setJobStatus(id, JOB_STATUS.REJECTED)
export const closeJob = (id) => setJobStatus(id, JOB_STATUS.CLOSED)

/* -------------------------------- companies ------------------------------- */

export const getAdminCompanies = (params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/companies', { params }), () => mock.listAdminCompanies(params))
    : supabase.getAdminCompanies(params)

export const verifyCompany = (id) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/admin/companies/${id}/verify`, { verification: COMPANY_STATUS.VERIFIED }), () =>
        mockVerifyCompany(id),
      )
    : supabase.setAdminCompanyStatus(id, COMPANY_STATUS.VERIFIED)

export const rejectCompany = (id) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/admin/companies/${id}/verify`, { verification: COMPANY_STATUS.REJECTED }), () =>
        mockRejectCompany(id),
      )
    : supabase.setAdminCompanyStatus(id, COMPANY_STATUS.REJECTED)

export const suspendCompany = (id) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/admin/companies/${id}/verify`, { verification: COMPANY_STATUS.SUSPENDED }), () =>
        mockSuspendCompany(id),
      )
    : supabase.setAdminCompanyStatus(id, COMPANY_STATUS.SUSPENDED)

/* ------------------------------- applications ----------------------------- */

export const getAdminApplications = (params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/applications', { params }), () =>
        mock.listAdminApplications(params),
      )
    : supabase.getAdminApplications(params)

/* ---------------------------------- users --------------------------------- */

export const getAdminUsers = (params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/users', { params }), () => mockListUsers(params))
    : supabase.getAdminUsers(params)

export const setUserStatus = (id, status) =>
  API_MODE === 'mock'
    ? request(() => api.put(`/admin/users/${id}/status`, { status }), () => mockSetUserStatus(id, status))
    : supabase.setAdminUserStatus(id, status)

export const deleteUser = (id) =>
  API_MODE === 'mock'
    ? request(() => api.delete(`/admin/users/${id}`), () => mockDeleteUser(id))
    : supabase.deleteAdminUser(id)

/* -------------------------------- platform -------------------------------- */

export const getUserStats = () =>
  API_MODE === 'mock'
    ? request(() => api.get('/admin/users/stats'), () => mockGetUserStats())
    : supabase.getAdminUserStats()

export const resetMockData = () =>
  API_MODE === 'mock'
    ? request(() => api.post('/admin/mock-data/reset'), () => mockResetMockData())
    : supabase.resetAdminMockData()
