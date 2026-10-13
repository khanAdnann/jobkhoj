import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import Pagination from '@/components/common/Pagination'
import {
  NOTIFICATION_TONE,
  NOTIFICATION_TONE_FALLBACK,
} from '@/components/common/notificationTone'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import * as notificationService from '@/services/notificationService'
import { timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import { PATHS } from '@/routes/paths'



/**
 * Full notification centre (PRD section 11) — the bell dropdown is the
 * at-a-glance version of this list.
 */
export default function Notifications() {
  const toast = useToast()
  const { refreshUnreadCount } = useAuth()

  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  const query = useFetch(() => notificationService.getNotifications({ page, pageSize: 10 }), [page])

  const { items = [], total = 0, totalPages = 1, unreadCount = 0 } = query.data ?? {}

  async function handleRead(notification) {
    if (notification.read) return
    setBusyId(notification.id)

    try {
      await notificationService.markAsRead(notification.id)
      query.setData({
        ...query.data,
        unreadCount: Math.max(0, unreadCount - 1),
        items: items.map((row) => (row.id === notification.id ? { ...row, read: true } : row)),
      })
      refreshUnreadCount?.()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await notificationService.markAllAsRead()
      query.setData({
        ...query.data,
        unreadCount: 0,
        items: items.map((row) => ({ ...row, read: true })),
      })
      refreshUnreadCount?.()
      toast.success('All notifications marked as read.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleDelete(notification) {
    setBusyId(notification.id)
    try {
      await notificationService.deleteNotification(notification.id)
      query.setData({
        ...query.data,
        total: total - 1,
        unreadCount: notification.read ? unreadCount : Math.max(0, unreadCount - 1),
        items: items.filter((row) => row.id !== notification.id),
      })
      refreshUnreadCount?.()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          query.loading
            ? 'Loading notifications…'
            : unreadCount > 0
              ? `${unreadCount} unread of ${total}`
              : `All caught up — ${total} notification${total === 1 ? '' : 's'}`
        }
        actions={
          <Button
            variant="outline"
            loading={markingAll}
            disabled={unreadCount === 0}
            onClick={handleMarkAll}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Mark all read
          </Button>
        }
      />

      {query.error ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="Could not load notifications"
            description={query.error.message}
            action={
              <Button variant="secondary" onClick={query.refetch}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card padded={false} className="overflow-hidden">
            {query.loading &&
              [1, 2, 3, 4].map((key) => (
                <div key={key} className="border-b border-ink-100 p-4 last:border-0">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                </div>
              ))}

            {!query.loading && items.length === 0 && (
              <EmptyState
                icon="inbox"
                title="No notifications"
                description="Application updates, new matching jobs and messages will appear here."
              />
            )}

            <ul className="divide-y divide-ink-100">
              {items.map((notification) => {
                const tone = NOTIFICATION_TONE[notification.type] ?? NOTIFICATION_TONE_FALLBACK
                const Icon = tone.icon

                return (
                  <li
                    key={notification.id}
                    className={cn(
                      'flex gap-3.5 p-4 transition-colors hover:bg-ink-50/70',
                      !notification.read && 'bg-brand-50/40',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        tone.className,
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            notification.read ? 'text-ink-600' : 'font-semibold text-ink-900',
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      <p className="mt-0.5 text-sm text-ink-500">{notification.message}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-xs text-ink-400">{timeAgo(notification.createdAt)}</span>

                        {notification.jobId ? (
                          <Link
                            to={`/jobs/${notification.jobId}`}
                            onClick={() => handleRead(notification)}
                            className="text-xs font-semibold text-brand-600 hover:underline"
                          >
                            View job
                          </Link>
                        ) : (
                          <Link
                            to={PATHS.jobAlerts}
                            className="text-xs font-semibold text-brand-600 hover:underline"
                          >
                            Manage alerts
                          </Link>
                        )}

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => handleRead(notification)}
                            disabled={busyId === notification.id}
                            className="text-xs font-medium text-ink-500 hover:text-ink-800"
                          >
                            Mark read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(notification)}
                          disabled={busyId === notification.id}
                          aria-label={`Delete ${notification.title}`}
                          className="ml-auto inline-flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-danger-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
          )}
        </>
      )}
    </div>
  )
}
