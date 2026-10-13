import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from './Button'

/**
 * Result pager with a sliding page window and "Showing X–Y of Z" summary.
 *
 * @param {number} page        current 1-based page
 * @param {number} totalPages
 * @param {Function} onChange  (nextPage) => void
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  onChange,
  totalItems,
  rangeStart,
  rangeEnd,
  className,
}) {
  if (totalPages <= 1) return null

  const windowSize = 5
  let from = Math.max(1, page - 2)
  let to = Math.min(totalPages, from + windowSize - 1)
  from = Math.max(1, to - windowSize + 1)

  const pages = Array.from({ length: to - from + 1 }, (_, i) => from + i)
  const hasRange = Number.isFinite(totalItems) && Number.isFinite(rangeStart)

  return (
    <nav
      className={cn('flex flex-col-reverse items-center justify-between gap-3 sm:flex-row', className)}
      aria-label="Pagination"
    >
      {hasRange ? (
        <p className="text-sm text-ink-500">
          Showing <span className="font-medium text-ink-700">{rangeStart}</span>–
          <span className="font-medium text-ink-700">{rangeEnd}</span> of{' '}
          <span className="font-medium text-ink-700">{totalItems}</span>
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <ul className="mx-1 hidden items-center gap-1 sm:flex">
          {from > 1 && (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => onChange(1)}
                  className="h-9 min-w-9 rounded-lg px-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100"
                >
                  1
                </button>
              </li>
              {from > 2 && (
                <li className="px-1 text-sm text-ink-400" aria-hidden="true">
                  …
                </li>
              )}
            </>
          )}

          {pages.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {p}
              </button>
            </li>
          ))}

          {to < totalPages && (
            <>
              {to < totalPages - 1 && (
                <li className="px-1 text-sm text-ink-400" aria-hidden="true">
                  …
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => onChange(totalPages)}
                  className="h-9 min-w-9 rounded-lg px-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100"
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}
        </ul>

        <span className="mx-2 text-sm font-medium text-ink-600 sm:hidden">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
