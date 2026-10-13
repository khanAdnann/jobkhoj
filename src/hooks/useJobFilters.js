import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filter/sort/page state for job search, kept in the URL.
 *
 * Sharing a search by copying the address bar has to keep working, so the
 * query string is the single source of truth rather than component state.
 * Multi-select filters are stored comma-separated:
 *   ?q=java&location=Mumbai%2C+Bengaluru&workMode=Remote&sort=newest&page=2
 */

const MULTI_KEYS = ['location', 'experience', 'department', 'skills', 'jobType', 'workMode', 'company']

const EMPTY = {
  query: '',
  location: [],
  experience: [],
  department: [],
  skills: [],
  jobType: [],
  workMode: [],
  company: [],
  postedDate: 'any',
  salaryMin: '',
  salaryMax: '',
}

function parseList(raw) {
  return raw ? raw.split(',').map((item) => item.trim()).filter(Boolean) : []
}

export function useJobFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const next = { ...EMPTY }

    next.query = searchParams.get('q') ?? ''

    MULTI_KEYS.forEach((key) => {
      next[key] = parseList(searchParams.get(key))
    })

    next.postedDate = searchParams.get('postedDate') ?? 'any'
    next.salaryMin = searchParams.get('salaryMin') ?? ''
    next.salaryMax = searchParams.get('salaryMax') ?? ''

    return next
  }, [searchParams])

  const sort = searchParams.get('sort') ?? 'relevance'
  const page = Number(searchParams.get('page')) || 1

  /**
   * @param {Object}  nextFilters
   * @param {Object}  options  { sort, page } — omitted values are preserved.
   */
  const apply = useCallback(
    (nextFilters, options = {}) => {
      const params = new URLSearchParams()
      const source = nextFilters ?? filters

      if (source.query) params.set('q', source.query)

      MULTI_KEYS.forEach((key) => {
        if (source[key]?.length) params.set(key, source[key].join(','))
      })

      if (source.postedDate && source.postedDate !== 'any') {
        params.set('postedDate', source.postedDate)
      }
      if (source.salaryMin) params.set('salaryMin', String(source.salaryMin))
      if (source.salaryMax) params.set('salaryMax', String(source.salaryMax))

      const nextSort = options.sort ?? sort
      if (nextSort && nextSort !== 'relevance') params.set('sort', nextSort)

      const nextPage = options.page ?? 1
      if (nextPage > 1) params.set('page', String(nextPage))

      setSearchParams(params, { replace: true })
    },
    [filters, sort, setSearchParams],
  )

  // Any filter change resets to page 1 — otherwise you land on a page 5 that
  // no longer exists and the list looks broken.
  const setFilters = useCallback(
    (next) => apply(next, { page: 1 }),
    [apply],
  )

  const setSort = useCallback((nextSort) => apply(filters, { sort: nextSort, page: 1 }), [apply, filters])
  const setPage = useCallback((nextPage) => apply(filters, { page: nextPage }), [apply, filters])

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const activeCount =
    MULTI_KEYS.reduce((total, key) => total + filters[key].length, 0) +
    (filters.postedDate !== 'any' ? 1 : 0) +
    (filters.salaryMin || filters.salaryMax ? 1 : 0)

  return { filters, sort, page, setFilters, setSort, setPage, reset, activeCount }
}

export default useJobFilters