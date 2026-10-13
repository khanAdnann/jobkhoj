import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Skeleton from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import ApplicationTimeline, {
  ApplicationStatusBadge,
} from '@/components/seeker/ApplicationTimeline'
import * as applicationService from '@/services/applicationService'
import { useFetch } from '@/hooks/useFetch'
import { JOB_STATUS, STATUS_TONE } from '@/utils/constants'
import { formatDate, formatSalaryRange, timeAgo } from '@/utils/format'
import { PATHS } from '@/routes/paths'

const QUESTION_LABELS = {
  whyHireYou: 'Why should we hire you?',
  noticePeriod: 'Notice period',
  currentCtc: 'Current CTC',
  expectedCtc: 'Expected CTC',
  willingToRelocate: 'Willing to relocate',
  hasVisa: 'Work authorisation / visa',
  portfolioUrl: 'Portfolio / LinkedIn',
  referredBy: 'Referred by',
}

/**
 * Single application view: the job snapshot, the candidate's answers and the
 * status timeline. Recruiters can add a note when they move a candidate, so
 * those are listed newest first.
 */
export default function ApplicationDetails() {
  const { id } = useParams()

  const query = useFetch(() => applicationService.getApplicationById(id), [id])

  if (query.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (query.error || !query.data) {
    return (
      <Card>
        <EmptyState
          icon="file"
          title="Application not found"
          description={query.error?.message ?? 'This application may have been removed.'}
          action={
            <Button as={Link} to={PATHS.applications} variant="secondary">
              Back to applications
            </Button>
          }
        />
      </Card>
    )
  }

  const application = query.data
  const job = application.job ?? {}
  const answers = Object.entries(application.answers ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== '' && value !== false,
  )
  const notes = application.notes ?? []

  return (
    <div className="space-y-6">
      <div>
        <Button as={Link} to={PATHS.applications} variant="ghost" size="sm" className="-ml-3 mb-3">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          All applications
        </Button>

        <PageHeader
          title={job.title ?? 'Application'}
          subtitle={`Applied ${formatDate(application.appliedAt)} — ${timeAgo(application.appliedAt)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ApplicationStatusBadge status={application.status} />
              {job.status && (
                <Badge tone={STATUS_TONE[application.status] ? 'outline' : 'neutral'}>
                  Job: {job.status}
                </Badge>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------- main ---------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* timeline */}
          <Card>
            <CardHeader title="Application progress" />
            <div className="p-5">
              <ApplicationTimeline application={application} />
            </div>
          </Card>

          {/* answers */}
          <Card padded={false}>
            <CardHeader
              title="Your answers"
              subtitle="What you submitted with this application."
            />
            <div className="p-5">
              {answers.length === 0 ? (
                <p className="text-sm text-ink-500">No additional answers were submitted.</p>
              ) : (
                <dl className="space-y-4">
                  {answers.map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                        {QUESTION_LABELS[key] ?? key}
                      </dt>
                      <dd className="mt-1 text-sm whitespace-pre-line text-ink-800">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </Card>

          {/* recruiter notes */}
          {notes.length > 0 && (
            <Card padded={false}>
              <CardHeader title="Recruiter updates" />
              <ul className="divide-y divide-ink-100">
                {notes.map((note) => (
                  <li key={note.id ?? note.at} className="p-4">
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      {note.by ? `${note.by} — ` : ''}
                      {formatDate(note.at)}
                    </div>
                    <p className="mt-1.5 text-sm text-ink-700">{note.text ?? note.note}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ------------------------------- side ---------------------------- */}
        <aside className="space-y-6">
          <Card padded={false}>
            <CardHeader title="Job" />
            <div className="space-y-3 p-5 text-sm">
              <p className="flex items-center gap-2 text-ink-700">
                <Building2 className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {job.companyName ?? '—'}
              </p>
              <p className="flex items-center gap-2 text-ink-600">
                <MapPin className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {job.location ?? '—'}
              </p>
              <p className="flex items-center gap-2 text-ink-600">
                <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {job.employmentType ?? '—'}
              </p>
              <p className="font-semibold text-ink-900">
                {formatSalaryRange(job.salaryMin, job.salaryMax)}
              </p>

              {job.status === JOB_STATUS.CLOSED && (
                <Badge tone="danger" className="mt-1">
                  This job is closed
                </Badge>
              )}

              {job.id && (
                <Button
                  as={Link}
                  to={`/jobs/${job.id}`}
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mt-2"
                >
                  View job posting
                </Button>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Submitted documents" />
            <div className="space-y-2 p-5 text-sm">
              <p className="flex items-start gap-2 text-ink-700">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {application.resumeName ?? 'No resume attached'}
                </span>
              </p>

              {application.coverNote && (
                <p className="rounded-lg bg-ink-50 p-3 text-xs whitespace-pre-line text-ink-600">
                  {application.coverNote}
                </p>
              )}

              <Button as={Link} to={PATHS.resume} variant="ghost" size="sm" fullWidth>
                Manage resume
              </Button>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Need help?" />
            <div className="space-y-2 p-5 text-sm text-ink-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                support@jobkhoj.in
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                +91 80 4000 1234
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
