import { forwardRef, useId } from 'react'
import Field from './Field'
import { cn } from '@/utils/cn'

const Textarea = forwardRef(function Textarea(
  { label, error, hint, required = false, rows = 4, className, containerClassName, id: idProp, ...props },
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
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 transition-colors placeholder:text-ink-400',
          'focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-100',
          error
            ? 'border-danger-500 focus:border-danger-600 focus:ring-2 focus:ring-danger-500/20'
            : 'border-ink-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
          className,
        )}
        {...props}
      />
    </Field>
  )
})

export default Textarea
