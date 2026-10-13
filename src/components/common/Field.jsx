import { cn } from '@/utils/cn'

/**
 * Shared label / hint / error wrapper so every form control in the app lines
 * up and reports errors identically.
 */
export default function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  className,
  children,
}) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  )
}
