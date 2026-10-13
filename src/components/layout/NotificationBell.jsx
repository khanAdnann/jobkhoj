import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'
import {
  NOTIFICATION_TONE,
  NOTIFICATION_TONE_FALLBACK,
} from '@/components/common/notificationTone'
import { NOTIFICATION_TYPE } from '@/utils/constants'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAuth } from '@/hooks/useAuth'
import * as notificationService from '@/services/notificationService'
import { PATHS } from '@/routes/paths'
import { timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'

/**
 * Navbar notification bell with an unread badge and a dropdown preview
 * (PRD section 24). Marking read happens on open, which keeps the interaction
 * to a single tap.
 */
export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useClickOutside(() => setOpen(false), open)
  const loadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const result = await notificationService.getNotifications({ page: 1, pageSize: 5 })
      setItems(result.items ?? [])
      setUnread(result.unreadCount ?? 0)
      loadedOnce.current = true
    } catch {
      // A failed notification fetch must never break the navbar.
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) load()
    else {
      setItems([])
      setUnread(0)
    }
  }, [isAuthenticated, load])

  async function markAllRead() {
    try {
      await notificationService.markAllAsRead()
      setUnread(0)
      setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch {
      // Non-critical.
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && !loadedOnce.current ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <span className="skeleton h-9 w-9 shrink-0 rounded-full" />
                    <span className="flex-1 space-y-1.5">
                      <span className="skeleton block h-3 w-full" />
                      <span className="skeleton block h-3 w-2/3" />
                    </span>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-500">
                You have no notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.jobId ? PATHS.jobDetails(item.jobId) : PATHS.notifications}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                    >
                      <span
                        className={cn(
                          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          NOTIFICATION_TONE[item.type]?.className ??
                            NOTIFICATION_TONE[NOTIFICATION_TYPE.STATUS].className,
                        )}
                      >
                        <Bell className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-sm',
                            item.read ? 'text-ink-600' : 'font-semibold text-ink-900',
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="line-clamp-2-safe mt-0.5 block text-xs text-ink-500">
                          {item.message}
                        </span>
                        <span className="mt-1 block text-[11px] text-ink-400">
                          {timeAgo(item.createdAt)}
                        </span>
                      </span>

                      {!item.read && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                          aria-label="Unread"
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-ink-200 bg-ink-50/60 px-4 py-2.5">
            <Link
              to={PATHS.notifications}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
