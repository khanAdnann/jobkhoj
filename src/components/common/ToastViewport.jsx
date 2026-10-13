import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const TONES = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-success-500',
    iconColor: 'text-success-600',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-danger-500',
    iconColor: 'text-danger-600',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-warning-500',
    iconColor: 'text-warning-600',
  },
  info: {
    icon: Info,
    bar: 'bg-info-500',
    iconColor: 'text-info-600',
  },
}

/**
 * Toast viewport. Mount once inside <ToastProvider /> — toasts themselves are
 * pushed imperatively anywhere via `useToast()`.
 */
export default function ToastViewport() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const tone = TONES[toast.tone] ?? TONES.info
        const Icon = tone.icon

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 overflow-hidden rounded-xl border border-ink-200 bg-white p-3.5 shadow-pop"
          >
            <span className={cn('absolute inset-y-0 left-0 w-1', tone.bar)} />

            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', tone.iconColor)} aria-hidden="true" />

            <div className="min-w-0 flex-1">
              {toast.title && (
                <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
              )}
              <p className={cn('text-sm text-ink-600', toast.title && 'mt-0.5')}>
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-mt-0.5 -mr-0.5 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
