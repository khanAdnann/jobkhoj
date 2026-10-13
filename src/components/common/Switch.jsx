import { useId } from 'react'
import { cn } from '@/utils/cn'

/** iOS-style toggle for settings and filter switches. */
export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  id: idProp,
}) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {(label || description) && (
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          {label && <span className="block text-sm font-medium text-ink-800">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
        </label>
      )}

      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-brand-600' : 'bg-ink-300',
        )}
      >
        <span
          className={cn(
            'switch-knob inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
