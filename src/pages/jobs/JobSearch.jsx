import { useCallback, useEffect, useRef, useState } from 'react'
import { ListFilter, RefreshCw } from 'lucide-react'
import JobCard from '@/components/jobs/JobCard'
import { JobCardSkeletonList } from '@/components/jobs/JobCardSkeleton'
import JobFilters from '@/components/jobs/JobFilters'
import ActiveFilterChips from '@/components/jobs/ActiveFilterChips'
import SearchToolbar from '@/components/jobs/SearchToolbar'
import { Button, Drawer, EmptyState, Pagination } from '@/components/common'
import { listJobs } from '@/services/jobService'
import { getSavedJobs } from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { useJobFilters } from '@/hooks/useJobFilters'
import PageMetadata from '@/components/seo/PageMetadata'
import { mountAdUnit } from '@/utils/adUnits'

const PAGE_SIZE = 12
const BANNER_AD_OPTIONS = {
  key: 'e7d327803ef28edb646156ab56417c51',
  format: 'iframe',
  height: 60,
  width: 468,
  params: {},
}
const MOBILE_BANNER_AD_OPTIONS = {
  key: 'aea4711497036483082c71a44545381e',
  format: 'iframe',
  height: 50,
  width: 320,
  params: {},
}

function JobsBannerAd() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    return mountAdUnit(
      container,
      BANNER_AD_OPTIONS,
      'https://bicea.org/22/e7d327803ef28edb646156ab56417c51',
      '468×60 jobs banner',
    )
  }, [])

  return (
    <aside
      aria-label="Advertisement"
      className="my-6 hidden justify-center min-[500px]:flex"
    >
      <div ref={containerRef} className="h-[60px] w-[468px] max-w-full" />
    </aside>
  )
}

function JobsMobileBannerAd() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    return mountAdUnit(
      container,
      MOBILE_BANNER_AD_OPTIONS,
      'https://bicea.org/22/aea4711497036483082c71a44545381e',
      '320×50 jobs banner',
    )
  }, [])

  return (
    <aside
      aria-label="Advertisement"
      className="my-4 flex justify-center overflow-hidden"
    >
      <div ref={containerRef} className="h-[50px] w-[320px] max-w-full" />
    </aside>
  )
}

/**
 * Public job search (PRD section 6): keyword + faceted filters, sorting,
 * pagination and a save toggle on every result.
 */
export default function JobSearch() {
  const { filters, sort, page, setFilters, setSort, setPage, reset, activeCount } = useJobFilters()
  const { isAuthenticated, hasRole } = useAuth()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [savedIds, setSavedIds] = useState(() => new Set())

  const { data, loading, refetching, error, refetch } = useFetch(
    () => listJobs({ filters, sort, page, pageSize: PAGE_SIZE }),
    [JSON.stringify(filters), sort, page],
  )

  /* Saved-job ids: one request for the whole page rather than per card. */
  useEffect(() => {
    if (!isAuthenticated || hasRole('RECRUITER', 'ADMIN')) {
      setSavedIds(new Set())
      return undefined
    }

    let cancelled = false

    getSavedJobs()
      .then((result) => {
        if (cancelled) return
        const ids = (result?.items ?? result ?? []).map((row) =>
          typeof row === 'string' ? row : row.jobId,
        )
        setSavedIds(new Set(ids))
      })
      .catch(() => {
        // Saved state is a nicety; failing to load it must not break search.
        if (!cancelled) setSavedIds(new Set())
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, hasRole])

  const markSaved = useCallback((jobId, saved) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (saved) next.add(jobId)
      else next.delete(jobId)
      return next
    })
  }, [])

  const jobs = data?.items ?? []
  const facets = data?.facets ?? {}
  const showSkeleton = loading
  const showEmpty = !loading && !error && jobs.length === 0

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageMetadata
        title="Browse Jobs in India | JobKhoj"
        description="Search current job openings by role, skill, company, location, and work mode on JobKhoj."
      />
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Find your next job
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Search across active openings at verified companies.
        </p>
      </header>

      <SearchToolbar
        query={filters.query}
        onQueryChange={(query) => setFilters({ ...filters, query })}
        sort={sort}
        onSortChange={setSort}
        onOpenFilters={() => setDrawerOpen(true)}
        activeFilterCount={activeCount}
        resultCount={loading ? undefined : data?.totalItems}
      />

      <JobsBannerAd />
      <JobsMobileBannerAd />

      <ActiveFilterChips
        className="mt-4"
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mt-6 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8">
        {/* ----------------------------- desktop sidebar ------------------------ */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-ink-200 bg-white p-5">
            <JobFilters
              value={filters}
              onChange={setFilters}
              facets={facets}
              onReset={reset}
            />
          </div>
        </aside>

        {/* -------------------------------- results ---------------------------- */}
        <section aria-label="Job results" aria-busy={loading || refetching}>
          {refetching && !loading && (
            <p className="mb-3 flex items-center gap-2 text-xs text-ink-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Updating results…
            </p>
          )}

          {showSkeleton && <JobCardSkeletonList count={PAGE_SIZE > 6 ? 6 : PAGE_SIZE} />}

          {error && (
            <EmptyState
              icon="search"
              title="We couldn't load these jobs"
              description={error.message || 'Something went wrong. Please try again.'}
              action={
                <Button onClick={refetch}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </Button>
              }
            />
          )}

          {showEmpty && (
            <EmptyState
              icon="search"
              title="No jobs match your search"
              description="Try removing a filter, widening the location, or searching for a broader keyword."
              action={
                <Button variant="outline" onClick={reset}>
                  <ListFilter className="h-4 w-4" aria-hidden="true" />
                  Clear all filters
                </Button>
              }
            />
          )}

          {!showSkeleton && !error && jobs.length > 0 && (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={savedIds.has(job.id)}
                    onSavedChange={(next) => markSaved(job.id, next)}
                  />
                ))}
              </div>

              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalItems={data.totalItems}
                rangeStart={(data.page - 1) * PAGE_SIZE + 1}
                rangeEnd={Math.min(data.page * PAGE_SIZE, data.totalItems)}
                onChange={setPage}
                className="mt-8"
              />
            </>
          )}
        </section>
      </div>

      {/* --------------------------- mobile filter drawer ---------------------- */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        side="left"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={reset}>
              Clear all
            </Button>
            <Button fullWidth onClick={() => setDrawerOpen(false)}>
              Show {data?.totalItems ?? 0} jobs
            </Button>
          </div>
        }
      >
        <JobFilters value={filters} onChange={setFilters} facets={facets} onReset={reset} />
      </Drawer>
    </div>
  )
}