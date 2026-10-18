import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { Button, EmptyState, Pagination } from '@/components/common'
import JobCard from '@/components/jobs/JobCard'
import { JobCardSkeletonList } from '@/components/jobs/JobCardSkeleton'
import PageMetadata from '@/components/seo/PageMetadata'
import { useFetch } from '@/hooks/useFetch'
import { getAllPublicJobs } from '@/services/jobService'
import { JOB_CATEGORIES, JOB_CATEGORY_BY_SLUG } from '@/utils/jobCategories'

const PAGE_SIZE = 12

export function JobCategoryLinks({ className = '' }) {
  return (
    <nav aria-label="Popular job categories" className={className}>
      <ul className="flex flex-wrap gap-2">
        {JOB_CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link
              to={`/jobs/${category.slug}`}
              className="inline-flex rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {category.heading}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function JobCategory({ slug }) {
  const category = JOB_CATEGORY_BY_SLUG.get(slug)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const filters = useMemo(
    () => ({
      ...(category?.query ? { query: category.query } : {}),
      ...(category?.experienceMax !== undefined
        ? { experienceMax: category.experienceMax }
        : {}),
      ...(category?.workMode ? { workMode: [category.workMode] } : {}),
    }),
    [category],
  )
  const { data: matchingJobs, loading, error, refetch } = useFetch(
    () => (category ? getAllPublicJobs({ filters }) : Promise.resolve([])),
    [category, filters],
    { initialData: [] },
  )

  const jobs = category
    ? matchingJobs.filter(category.matches)
    : []
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageJobs = jobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (!category) {
    return (
      <EmptyState
        icon="search"
        title="Job category not found"
        description="Browse all active job listings to find a role that fits."
        action={<Link to="/jobs">Browse jobs</Link>}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageMetadata
        title={category.title}
        description={category.description}
        canonical={`/jobs/${category.slug}${currentPage > 1 ? `?page=${currentPage}` : ''}`}
        robots={!loading && !error && jobs.length === 0 ? 'noindex, follow' : 'index, follow'}
      />
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          {category.heading} in India
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">
          {category.intro}
        </p>
      </header>

      <section aria-label={`${category.heading} results`} aria-busy={loading}>
        {loading && <JobCardSkeletonList count={6} />}

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

        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            icon="search"
            title={`No active ${category.heading.toLowerCase()} right now`}
            description="Browse all current listings or check back as employers post new roles."
            action={
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
              >
                Browse all jobs <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        )}

        {!loading && !error && pageJobs.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-500">
              {jobs.length} active {jobs.length === 1 ? 'job' : 'jobs'} in this category
            </p>
            <div className="space-y-4">
              {pageJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={jobs.length}
              rangeStart={(currentPage - 1) * PAGE_SIZE + 1}
              rangeEnd={Math.min(currentPage * PAGE_SIZE, jobs.length)}
              onChange={(nextPage) => {
                const next = new URLSearchParams(searchParams)
                if (nextPage > 1) next.set('page', String(nextPage))
                else next.delete('page')
                setSearchParams(next, { replace: true })
              }}
              className="mt-8"
            />
          </>
        )}
      </section>

      <section className="mt-10 border-t border-ink-200 pt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Explore more job categories</h2>
        <JobCategoryLinks />
      </section>
    </div>
  )
}
