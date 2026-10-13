import { forwardRef, useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Checkbox with an animated tick. Works with react-hook-form `register`. */
const Checkbox = forwardRef(function Checkbox(
  { label, description, className, id: idProp, indeterminate = false, ...props },
  ref,
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span className="relative flex h-5 shrink-0 items-center justify-center">
        <input
          ref={(node) => {
            // The DOM `indeterminate` flag cannot be set as a JSX attribute.
            if (node) node.indeterminate = indeterminate && !node.checked
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          id={id}
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-ink-300 bg-white transition-colors checked:border-brand-600 checked:bg-brand-600 indeterminate:border-brand-600 indeterminate:bg-brand-600 disabled:cursor-not-allowed disabled:bg-ink-100"
          {...props}
        />
        <Check
          className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100 peer-indeterminate:opacity-0"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>

      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="text-sm font-medium text-ink-800">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
        </label>
      )}
    </div>
  )
})

export default Checkbox
