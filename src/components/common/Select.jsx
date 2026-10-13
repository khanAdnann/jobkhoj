import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import Field from './Field'
import { cn } from '@/utils/cn'

/**
 * Native select styled to match <Input />.
 *
 * @param {Array<string|{value:string,label:string}>} options
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required = false,
    options = [],
    placeholder,
    className,
    containerClassName,
    id: idProp,
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
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'block h-10 w-full appearance-none rounded-lg border bg-white pr-9 pl-3 text-sm text-ink-900 transition-colors',
            'focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500',
            error
              ? 'border-danger-500 focus:border-danger-600 focus:ring-2 focus:ring-danger-500/20'
              : 'border-ink-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value
            const text = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={value} value={value}>
                {text}
              </option>
            )
          })}
        </select>

        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
})

export default Select
