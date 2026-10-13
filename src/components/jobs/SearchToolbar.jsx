import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { SORT_OPTIONS } from '@/utils/constants'
import { useDebounce } from '@/hooks/useDebounce'

/**
 * Search bar + sort control + mobile filter trigger (PRD section 6).
 *
 * The text input is debounced before it reaches the URL so we don't fire a
 * request per keystroke, while `onQueryInput` still updates the input
 * immediately.
 */
export default function SearchToolbar({
  query: initialQuery = '',
  onQueryChange,
  sort,
  onSortChange,
  onOpenFilters,
  activeFilterCount = 0,
  resultCount,
  className,
}) {
  const [term, setTerm] = useState(initialQuery)
  const debounced = useDebounce(term, 350)

  useEffect(() => {
    onQueryChange?.(debounced)
    // Intentionally only when the debounced value settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Keep in sync when the URL changes from outside (back button, clear all).
  useEffect(() => {
    setTerm((prev) => (prev === initialQuery ? prev : initialQuery))
  }, [initialQuery])

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* ------------------------------ search ------------------------------ */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Job title, skill, company or location"
            aria-label="Search jobs"
            className="h-12 w-full rounded-lg border border-ink-300 bg-white pr-10 pl-11 text-sm transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-ink-400 transition-colors hover:text-ink-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* ------------------------------- sort ------------------------------- */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sort}
              onChange={(event) => onSortChange?.(event.target.value)}
              aria-label="Sort jobs by"
              className="h-12 w-full appearance-none rounded-lg border border-ink-300 bg-white pr-9 pl-3.5 text-sm text-ink-800 transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-none sm:w-48"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
          </div>

          {/* Filters open as a sidebar on desktop, a drawer below lg. */}
          <button
            type="button"
            onClick={onOpenFilters}
            className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-lg border border-ink-300 bg-white px-3.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-400 hover:bg-ink-50 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {typeof resultCount === 'number' && (
        <p className="mt-3 text-sm text-ink-500" aria-live="polite">
          <span className="font-semibold text-ink-900">{resultCount}</span>{' '}
          {resultCount === 1 ? 'job' : 'jobs'} found
        </p>
      )}
    </div>
  )
}