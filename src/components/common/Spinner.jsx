import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const SIZES = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

/** Inline loading indicator. Prefer `Button loading` inside buttons. */
export default function Spinner({ size = 'sm', className, label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        SIZES[size],
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Full-width centred loader for page-level pending states. */
export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-ink-500', className)}
    >
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
