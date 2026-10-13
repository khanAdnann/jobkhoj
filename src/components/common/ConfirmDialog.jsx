import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * Destructive-action confirmation used for delete/close/reject flows.
 *
 * `onConfirm` may be sync or async — the dialog awaits whatever it returns and
 * keeps itself open (with a loading state) until it settles, so a wrapper arrow
 * around an async call behaves the same as an async function.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon: Icon = AlertTriangle,
}) {
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    if (!onConfirm || pending) return

    setPending(true)
    try {
      await onConfirm()
      onClose?.()
    } catch {
      // The caller surfaces the message; stay open so the action can be retried.
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={pending ? undefined : onClose}
      closeOnBackdrop={!pending}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={handleConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={
            variant === 'danger'
              ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-600'
              : 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600'
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {message && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{message}</p>}
        </div>
      </div>
    </Modal>
  )
}
