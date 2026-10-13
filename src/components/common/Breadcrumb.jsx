import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Breadcrumb trail: [{ label, to? }] — the last item renders as plain text. */
export default function Breadcrumb({ items = [], className }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate transition-colors hover:text-brand-600 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn('truncate', isLast && 'font-medium text-ink-700')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
