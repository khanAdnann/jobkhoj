import { cn } from '@/utils/cn'

const TONES = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-50 text-success-700 ring-success-500/25',
  warning: 'bg-warning-50 text-warning-700 ring-warning-500/25',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/25',
  info: 'bg-info-50 text-info-700 ring-info-500/25',
  outline: 'bg-white text-ink-600 ring-ink-300',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

/**
 * Small status pill. `tone` is shared with STATUS_TONE / JOB_STATUS_TONE in
 * utils/constants so status colours stay consistent across the app.
 */
export default function Badge({
  tone = 'neutral',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}
