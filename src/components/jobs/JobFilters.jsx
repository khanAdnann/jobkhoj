import { useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import { DATE_FILTERS } from '@/utils/constants'
import { cn } from '@/utils/cn'

/**
 * Filter sidebar for /jobs (PRD section 6).
 *
 * Fully controlled: it never owns filter state, it just emits the next filters
 * object. That keeps the URL the single source of truth in JobSearch.
 *
 * @param {Object}   value    Current filter object.
 * @param {Function} onChange Receives the full next filter object.
 * @param {Object}   facets   Distinct values + counts from the jobs endpoint.
 */
export default function JobFilters({ value, onChange, facets = {}, onReset }) {
  const toggle = (key, option) => {
    const current = toArray(value[key])
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option]

    onChange({ ...value, [key]: next })
  }

  const set = (key, nextValue) => onChange({ ...value, [key]: nextValue })

  const activeCount =
    ['location', 'experience', 'department', 'skills', 'jobType', 'workMode', 'company'].reduce(
      (total, key) => total + toArray(value[key]).length,
      0,
    ) +
    (value.postedDate && value.postedDate !== 'any' ? 1 : 0) +
    (value.salaryMin || value.salaryMax ? 1 : 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">
          Filters
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {activeCount}
            </span>
          )}
        </h2>

        {activeCount > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition-colors hover:text-danger-600"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {/* ------------------------------ date posted ----------------------------- */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
          Date posted
        </legend>
        <div className="space-y-1.5">
          {DATE_FILTERS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700"
            >
              <input
                type="radio"
                name="postedDate"
                checked={(value.postedDate ?? 'any') === option.value}
                onChange={() => set('postedDate', option.value)}
                className="h-4 w-4 border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* -------------------------------- salary -------------------------------- */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
          Salary (LPA)
        </legend>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={value.salaryMin ?? ''}
            onChange={(event) => set('salaryMin', event.target.value)}
            placeholder={String(facets.salary?.min ?? 0)}
            aria-label="Minimum salary in lakhs per annum"
            className="h-10 w-full rounded-lg border border-ink-300 px-3 text-sm transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
          <span className="text-ink-400" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={value.salaryMax ?? ''}
            onChange={(event) => set('salaryMax', event.target.value)}
            placeholder={String(facets.salary?.max ?? 0)}
            aria-label="Maximum salary in lakhs per annum"
            className="h-10 w-full rounded-lg border border-ink-300 px-3 text-sm transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>
      </fieldset>

      {/* ------------------------------- work mode ------------------------------ */}
      <FilterGroup
        title="Work mode"
        options={facets.workModes}
        selected={toArray(value.workMode)}
        onToggle={(option) => toggle('workMode', option)}
      />

      <FilterGroup
        title="Job type"
        options={facets.jobTypes}
        selected={toArray(value.jobType)}
        onToggle={(option) => toggle('jobType', option)}
      />

      <FilterGroup
        title="Experience"
        options={facets.experience}
        selected={toArray(value.experience)}
        onToggle={(option) => toggle('experience', option)}
      />

      <FilterGroup
        title="Department"
        options={facets.departments}
        selected={toArray(value.department)}
        onToggle={(option) => toggle('department', option)}
        defaultOpen={false}
        searchable
      />

      <FilterGroup
        title="Skills"
        options={facets.skills}
        selected={toArray(value.skills)}
        onToggle={(option) => toggle('skills', option)}
        defaultOpen={false}
        searchable
        limit={8}
      />

      <FilterGroup
        title="Location"
        options={facets.locations}
        selected={toArray(value.location)}
        onToggle={(option) => toggle('location', option)}
        defaultOpen={false}
        searchable
        limit={8}
      />

      <FilterGroup
        title="Company"
        options={facets.companies}
        selected={toArray(value.company)}
        onToggle={(option) => toggle('company', option)}
        defaultOpen={false}
        searchable
        limit={8}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function toArray(value) {
  if (value === undefined || value === null || value === '') return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Collapsible checkbox group.
 *
 * @param {Array<{value:string,count:number}>} options
 */
function FilterGroup({
  title,
  options = [],
  selected = [],
  onToggle,
  defaultOpen = true,
  searchable = false,
  limit = 6,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [term, setTerm] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    if (!term.trim()) return options
    const needle = term.trim().toLowerCase()
    return options.filter((option) => option.value.toLowerCase().includes(needle))
  }, [options, term])

  const visible = showAll ? filtered : filtered.slice(0, limit)
  const hidden = filtered.length - visible.length

  if (options.length === 0) return null

  return (
    <div className="border-t border-ink-200 pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
          {title}
          {selected.length > 0 && (
            <span className="ml-2 text-brand-600">({selected.length})</span>
          )}
        </span>

        <ChevronDown
          className={cn('h-4 w-4 text-ink-400 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="mt-3">
          {searchable && filtered.length > limit && (
            <div className="relative mb-2.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={`Search ${title.toLowerCase()}`}
                aria-label={`Search ${title.toLowerCase()}`}
                className="h-9 w-full rounded-lg border border-ink-300 pr-2 pl-8 text-sm transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-1 text-xs text-ink-400">No matches for “{term}”.</p>
          ) : (
            <ul className="space-y-1.5">
              {visible.map((option) => {
                const checked = selected.includes(option.value)

                return (
                  <li key={option.value}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(option.value)}
                        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="min-w-0 flex-1 truncate">{option.value}</span>
                      <span className="shrink-0 text-xs text-ink-400">{option.count}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          {hidden > 0 && !term && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs font-medium text-brand-600 hover:underline"
            >
              Show {hidden} more
            </button>
          )}

          {showAll && filtered.length > limit && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="mt-2 text-xs font-medium text-ink-500 hover:underline"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  )
}