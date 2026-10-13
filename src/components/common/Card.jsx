import { cn } from '@/utils/cn'

/**
 * Surface primitive. `hover` adds the lift transition used by job/company
 * cards; `padded` is off for cards that manage their own inner spacing.
 */
export default function Card({
  as: Tag = 'div',
  hover = false,
  padded = true,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-ink-200 bg-white shadow-card',
        padded && 'p-5',
        hover &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

/** Section wrapper with a title + optional action slot. */
export function CardHeader({ title, subtitle, action, className, children }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('flex items-center gap-3 border-t border-ink-200 px-5 py-4', className)}>
      {children}
    </div>
  )
}
