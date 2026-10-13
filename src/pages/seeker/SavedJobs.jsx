import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import JobCard from '@/components/jobs/JobCard'
import * as userService from '@/services/userService'
import { useFetch } from '@/hooks/useFetch'
import { formatDate } from '@/utils/format'

/**
 * Saved jobs list.
 *
 * `listSavedJobs` returns `{ id, jobId, savedAt, job }`. Each row passes
 * `saved` + `onSavedChange` to <JobCard /> so the card's own bookmark button can
 * unsave the row in place instead of duplicating that control here.
 */
export default function SavedJobs() {
  const query = useFetch(() => userService.getSavedJobs(), [])

  const saved = query.data ?? []

  function handleSavedChange(jobId, nextSaved) {
    query.setData(
      nextSaved ? saved : saved.filter((row) => row.jobId !== jobId),
    )
  }

  return (
    <div>
      <PageHeader
        title="Saved jobs"
        subtitle={
          query.loading
            ? 'Loading your saved jobs…'
            : `${saved.length} job${saved.length === 1 ? '' : 's'} saved for later`
        }
        actions={
          <Button as={Link} to="/jobs" variant="outline">
            <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Browse jobs
          </Button>
        }
      />

      {query.error ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="Could not load saved jobs"
            description={query.error.message}
            action={
              <Button variant="secondary" onClick={query.refetch}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {query.loading &&
            [1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-52 w-full rounded-xl" />
            ))}

          {!query.loading && saved.length === 0 && (
            <div className="md:col-span-2">
              <Card>
                <EmptyState
                  icon="inbox"
                  title="No saved jobs yet"
                  description="Tap the bookmark on any job to keep it here for later."
                  action={
                    <Button as={Link} to="/jobs" variant="primary">
                      Find jobs to save
                    </Button>
                  }
                />
              </Card>
            </div>
          )}

          {saved.map((row) => (
            <div key={row.id ?? row.jobId}>
              <p className="mb-1.5 text-xs text-ink-400">Saved {formatDate(row.savedAt)}</p>
              <JobCard
                job={row.job}
                saved
                onSavedChange={(next) => handleSavedChange(row.jobId, next)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}