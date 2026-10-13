import { api, request } from './api'
import * as mock from '@/mock/handlers/users'

/**
 * Notification service — powers the navbar bell and /dashboard/notifications.
 *
 *   GET    /notifications
 *   PUT    /notifications/:id/read
 *   PUT    /notifications/read-all
 *   DELETE /notifications/:id
 */
export const getNotifications = (params = {}) =>
  request(() => api.get('/notifications', { params }), () => mock.listNotifications(params))

export const getUnreadCount = async () => {
  const result = await getNotifications({ page: 1, pageSize: 1 })
  return result.unreadCount ?? 0
}

export const markAsRead = (id) =>
  request(() => api.put(`/notifications/${id}/read`), () => mock.markNotificationRead(id))

export const markAllAsRead = () =>
  request(() => api.put('/notifications/read-all'), () => mock.markAllNotificationsRead())

export const deleteNotification = (id) =>
  request(() => api.delete(`/notifications/${id}`), () => mock.deleteNotification(id))
