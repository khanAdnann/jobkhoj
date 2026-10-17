import { API_MODE, api, request } from './api'
import * as mock from '@/mock/handlers/companies'
import * as supabase from './supabaseCompanies'

/**
 * Company service — public company directory plus recruiter profile editing.
 *
 *   GET  /companies
 *   GET  /companies/:id
 *   GET  /companies/top
 *   PUT  /companies/me
 */
export const getCompanies = (params = {}) =>
  API_MODE === 'mock'
    ? request(() => api.get('/companies', { params }), () => mock.listCompanies(params))
    : supabase.listCompanies(params)

export const getCompany = (idOrSlug) =>
  API_MODE === 'mock'
    ? request(() => api.get(`/companies/${idOrSlug}`), () => mock.getCompany(idOrSlug))
    : supabase.getCompany(idOrSlug)

export const getTopCompanies = (limit = 8) =>
  API_MODE === 'mock'
    ? request(() => api.get('/companies/top', { params: { limit } }), () =>
        mock.getTopCompanies(limit),
      )
    : supabase.getTopCompanies(limit)

/** Recruiter edits their own company profile. The company is resolved server-side. */
export const updateMyCompany = (patch) =>
  API_MODE === 'mock'
    ? request(() => api.put('/companies/me', patch), () => mock.updateMyCompany(patch))
    : supabase.updateMyCompany(patch)
