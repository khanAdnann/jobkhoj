import { api, request } from './api'
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
  request(() => api.get('/admin/overview'), () => mock.getAdminOverview())

export const getReports = () => request(() => api.get('/admin/reports'), () => mock.getReports())

/* ---------------------------------- jobs ---------------------------------- */

export const getAdminJobs = (params = {}) =>
  request(() => api.get('/admin/jobs', { params }), () => mock.listAdminJobs(params))

export const setJobStatus = (id, status) =>
  request(() => api.put(`/admin/jobs/${id}/status`, { status }), () =>
    mock.setJobStatus(id, status),
  )

export const approveJob = (id) => setJobStatus(id, JOB_STATUS.ACTIVE)
export const rejectJob = (id) => setJobStatus(id, JOB_STATUS.REJECTED)
export const closeJob = (id) => setJobStatus(id, JOB_STATUS.CLOSED)

/* -------------------------------- companies ------------------------------- */

export const getAdminCompanies = (params = {}) =>
  request(() => api.get('/admin/companies', { params }), () => mock.listAdminCompanies(params))

export const verifyCompany = (id) =>
  request(() => api.put(`/admin/companies/${id}/verify`, { verification: COMPANY_STATUS.VERIFIED }), () =>
    mockVerifyCompany(id),
  )

export const rejectCompany = (id) =>
  request(() => api.put(`/admin/companies/${id}/verify`, { verification: COMPANY_STATUS.REJECTED }), () =>
    mockRejectCompany(id),
  )

export const suspendCompany = (id) =>
  request(() => api.put(`/admin/companies/${id}/verify`, { verification: COMPANY_STATUS.SUSPENDED }), () =>
    mockSuspendCompany(id),
  )

/* ------------------------------- applications ----------------------------- */

export const getAdminApplications = (params = {}) =>
  request(() => api.get('/admin/applications', { params }), () =>
    mock.listAdminApplications(params),
  )

/* ---------------------------------- users --------------------------------- */

export const getAdminUsers = (params = {}) =>
  request(() => api.get('/admin/users', { params }), () => mockListUsers(params))

export const setUserStatus = (id, status) =>
  request(() => api.put(`/admin/users/${id}/status`, { status }), () => mockSetUserStatus(id, status))

export const deleteUser = (id) =>
  request(() => api.delete(`/admin/users/${id}`), () => mockDeleteUser(id))

/* -------------------------------- platform -------------------------------- */

export const getUserStats = () =>
  request(() => api.get('/admin/users/stats'), () => mockGetUserStats())

export const resetMockData = () =>
  request(() => api.post('/admin/mock-data/reset'), () => mockResetMockData())
