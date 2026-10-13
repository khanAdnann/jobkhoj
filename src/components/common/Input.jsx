import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import Field from './Field'
import { cn } from '@/utils/cn'

/**
 * Text input. Forwards its ref and spreads props so it works with both
 * react-hook-form's `register()` and plain onChange handlers.
 *
 * @param {React.ComponentType} icon  leading icon component (e.g. lucide icon)
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required = false,
    icon: Icon,
    trailing,
    className,
    containerClassName,
    id: idProp,
    type = 'text',
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        )}

        <input
          ref={ref}
          id={id}
          type={type}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'block h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink-900 transition-colors placeholder:text-ink-400',
            'focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500',
            Icon && 'pl-9',
            trailing && 'pr-10',
            error
              ? 'border-danger-500 focus:border-danger-600 focus:ring-2 focus:ring-danger-500/20'
              : 'border-ink-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
            className,
          )}
          {...props}
        />

        {trailing && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2 text-ink-400">{trailing}</div>
        )}

        {error && (
          <AlertCircle
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-danger-500"
            aria-hidden="true"
          />
        )}
      </div>
    </Field>
  )
})

export default Input
