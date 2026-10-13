import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import Pagination from '@/components/common/Pagination'
import ApplicationCard from '@/components/seeker/ApplicationCard'
import * as applicationService from '@/services/applicationService'
import { useFetch } from '@/hooks/useFetch'
import { APPLICATION_STATUSES } from '@/utils/constants'
import { cn } from '@/utils/cn'

/**
 * "My applications" list (PRD section 11).
 *
 * Status + page live in the URL so a filtered view can be shared or bookmarked.
 */
export default function MyApplications() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status') ?? 'all'
  const page = Number(searchParams.get('page') ?? 1)

  const query = useFetch(
    () => applicationService.getMyApplications({ status, page, pageSize: 8 }),
    [status, page],
  )

  const { items = [], total = 0, totalPages = 1 } = query.data ?? {}

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value === 'all' && key === 'status') next.delete('status')
    else next.set(key, value)
    if (key === 'status') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const tabs = ['all', ...APPLICATION_STATUSES]

  return (
    <div>
      <PageHeader
        title="My applications"
        subtitle="Every role you have applied to, with its current status."
        actions={
          <Button as={Link} to="/jobs" variant="outline">
            <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Find more jobs
          </Button>
        }
      />

      {/* ------------------------------ status tabs ------------------------- */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          className="flex min-w-max gap-1 rounded-lg bg-ink-100 p-1"
          role="tablist"
          aria-label="Filter applications by status"
        >
          {tabs.map((tab) => {
            const label = tab === 'all' ? 'All' : tab
            const active = status === tab

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParam('status', tab)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-500 hover:text-ink-800',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {query.error ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="Could not load your applications"
            description={query.error.message}
            action={
              <Button variant="secondary" onClick={query.refetch}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-500">
            {query.loading ? 'Loading applications…' : `${total} application${total === 1 ? '' : 's'}`}
            {status !== 'all' && ` with status "${status}"`}
          </p>

          <div className="space-y-3">
            {query.loading &&
              [1, 2, 3, 4].map((key) => (
                <Skeleton key={key} className="h-32 w-full rounded-xl" />
              ))}

            {!query.loading && items.length === 0 && (
              <Card>
                <EmptyState
                  icon="inbox"
                  title={status === 'all' ? 'No applications yet' : `No ${status.toLowerCase()} applications`}
                  description={
                    status === 'all'
                      ? 'Apply to a role and it will appear here with live status updates.'
                      : 'Try a different status filter to see your other applications.'
                  }
                  action={
                    status === 'all' ? (
                      <Button as={Link} to="/jobs" variant="primary">
                        Browse jobs
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setParam('status', 'all')}>
                        Clear filter
                      </Button>
                    )
                  }
                />
              </Card>
            )}

            {items.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>

          {!query.loading && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(next) => setParam('page', String(next))}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}