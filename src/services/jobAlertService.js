import { api, request } from './api'
import * as mock from '@/mock/handlers/users'

/**
 * Job alert service — saved searches with a delivery frequency.
 *
 * Split out from userService because alerts are a distinct product surface
 * (PRD section 14) rather than a profile sub-resource.
 *
 *   GET    /job-alerts
 *   POST   /job-alerts
 *   PUT    /job-alerts/:id
 *   DELETE /job-alerts/:id
 */
export const getAlerts = () =>
  request(() => api.get('/job-alerts'), () => mock.listJobAlerts())

export const createAlert = (payload) =>
  request(() => api.post('/job-alerts', payload), () => mock.createJobAlert(payload))

export const updateAlert = (id, patch) =>
  request(() => api.put(`/job-alerts/${id}`, patch), () => mock.updateJobAlert(id, patch))

export const deleteAlert = (id) =>
  request(() => api.delete(`/job-alerts/${id}`), () => mock.deleteJobAlert(id))
