import { api, request } from './api'
import * as mock from '@/mock/handlers/companies'

/**
 * Company service — public company directory plus recruiter profile editing.
 *
 *   GET  /companies
 *   GET  /companies/:id
 *   GET  /companies/top
 *   PUT  /companies/me
 */
export const getCompanies = (params = {}) =>
  request(() => api.get('/companies', { params }), () => mock.listCompanies(params))

export const getCompany = (idOrSlug) =>
  request(() => api.get(`/companies/${idOrSlug}`), () => mock.getCompany(idOrSlug))

export const getTopCompanies = (limit = 8) =>
  request(() => api.get('/companies/top', { params: { limit } }), () =>
    mock.getTopCompanies(limit),
  )

/** Recruiter edits their own company profile. The company is resolved server-side. */
export const updateMyCompany = (patch) =>
  request(() => api.put('/companies/me', patch), () => mock.updateMyCompany(patch))
