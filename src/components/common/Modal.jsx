import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[90vw]',
}

/**
 * Accessible dialog rendered in a portal.
 *
 * Handles: scroll lock, Escape to close, backdrop click, initial focus and
 * focus restoration on unmount.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  hideHeader = false,
  className,
  children,
}) {
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useBodyScrollLock(open)
  useEscapeKey(open, onClose)

  useEffect(() => {
    if (!open) return undefined

    restoreFocusRef.current = document.activeElement
    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'input:not([type="hidden"]), textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
      )
      ;(focusable ?? panelRef.current)?.focus()
    }, 50)

    return () => {
      clearTimeout(timer)
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus()
      }
    }
  }, [open])

  // Keep Tab inside the dialog.
  function onKeyDownTab(event) {
    if (event.key !== 'Tab' || !panelRef.current) return

    const focusables = panelRef.current.querySelectorAll(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDownTab}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col animate-slide-up rounded-t-2xl bg-white shadow-pop sm:rounded-2xl',
          SIZES[size],
          className,
        )}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold text-ink-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mt-1 -mr-1 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink-200 bg-ink-50/60 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
