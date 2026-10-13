import { Link } from 'react-router-dom'
import { Briefcase, CalendarDays, MapPin, ChevronRight } from 'lucide-react'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import { ApplicationStatusBadge } from './ApplicationTimeline'
import { JOB_STATUS } from '@/utils/constants'
import { timeAgo, formatSalaryRange } from '@/utils/format'
import { PATHS } from '@/routes/paths'

/**
 * Row in the "My applications" list.
 *
 * The mock `listMyApplications` handler nests a compact job snapshot under
 * `application.job`, so the card degrades gracefully when a job was removed.
 */
export default function ApplicationCard({ application }) {
  const job = application.job

  return (
    <Card hover padded={false} className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ApplicationStatusBadge status={application.status} />
            {job?.status === JOB_STATUS.CLOSED && (
              <Badge tone="outline">Job closed</Badge>
            )}
          </div>

          <h3 className="mt-2 truncate text-sm font-semibold text-ink-900">
            {job?.title ?? 'Role removed'}
          </h3>

          <p className="mt-0.5 text-sm text-ink-500">{job?.companyName ?? '—'}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {job?.location ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
              {job?.employmentType ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Applied {timeAgo(application.appliedAt)}
            </span>
            {job?.salaryMin != null && (
              <span className="font-medium text-ink-700">
                {formatSalaryRange(job.salaryMin, job.salaryMax)}
              </span>
            )}
          </div>
        </div>

        <Link
          to={PATHS.applicationDetails(application.id)}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 sm:self-center"
        >
          View
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">details for {job?.title}</span>
        </Link>
      </div>

      {application.coverNote && (
        <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-3">
          <p className="line-clamp-2 text-xs italic text-ink-600">{application.coverNote}</p>
        </div>
      )}
    </Card>
  )
}
