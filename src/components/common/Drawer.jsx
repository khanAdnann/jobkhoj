import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay'
import { cn } from '@/utils/cn'

const SIDES = {
  left: 'inset-y-0 left-0 h-full w-80 max-w-[85vw] border-r',
  right: 'inset-y-0 right-0 h-full w-96 max-w-[92vw] border-l',
  top: 'inset-x-0 top-0 max-h-[85vh] w-full border-b',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full border-t',
}

const ANIMATION = {
  left: 'animate-slide-in-left',
  right: 'animate-slide-in-right',
  top: 'animate-slide-up',
  bottom: 'animate-slide-up',
}

/**
 * Slide-over panel. Used for the mobile navigation, the mobile job-filter
 * drawer and the recruiter pipeline detail view.
 */
export default function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  className,
  children,
  footer,
  hideClose = false,
}) {
  useBodyScrollLock(open)
  useEscapeKey(open, onClose)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'absolute flex flex-col bg-white shadow-pop',
          SIDES[side],
          ANIMATION[side],
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 px-4 py-3.5">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-ink-200 bg-ink-50/60 px-4 py-3">{footer}</div>
        )}
      </aside>
    </div>,
    document.body,
  )
}
