import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Check,
  Download,
  Mail,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Avatar from '@/components/common/Avatar'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ApplicationTimeline from '@/components/seeker/ApplicationTimeline'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as applicationService from '@/services/applicationService'
import { PIPELINE_STAGE, PIPELINE_STAGES, STATUS_TONE } from '@/utils/constants'
import { formatDate, formatSalaryRange, timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import { PATHS } from '@/routes/paths'

/**
 * Recruiter view of a single application (PRD section 17).
 *
 * Reachable from the pipeline board and table. Shows the snapshot the
 * candidate submitted (not their live profile, which may have changed since)
 * plus the actions available from the current stage.
 */
export default function ApplicantDetails() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [moving, setMoving] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const query = useFetch(() => applicationService.getApplicationById(applicationId), [applicationId])

  const application = query.data
  const stageIndex = PIPELINE_STAGES.findIndex((stage) => stage.key === application?.stage)
  const stage = PIPELINE_STAGES[stageIndex]
  const nextStage = PIPELINE_STAGES[stageIndex + 1]

  async function moveTo(targetStage) {
    setMoving(true)
    try {
      const updated = await applicationService.updateApplicationStage(applicationId, targetStage)
      query.setData({ ...application, ...updated })
      setConfirmAction(null)

      if (targetStage === PIPELINE_STAGE.REJECTED) toast.info(`${application.candidateName} was rejected.`)
      else toast.success(`Moved to ${targetStage.toLowerCase()}.`)
    } catch (error) {
      toast.error(error.message)
      query.refetch()
    } finally {
      setMoving(false)
    }
  }

  if (query.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (query.error || !application) {
    return (
      <Card>
        <EmptyState
          icon="inbox"
          title="Application not found"
          description={query.error?.message ?? 'This application may have been withdrawn.'}
          action={
            <Button as={Link} to={PATHS.recruiter.dashboard} variant="secondary">
              Back to dashboard
            </Button>
          }
        />
      </Card>
    )
  }

  const job = application.job
  const backTo = job ? PATHS.recruiter.applicants(job.id) : PATHS.recruiter.dashboard

  return (
    <div className="space-y-6">
      <Button
        as={Link}
        to={backTo}
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={(event) => {
          // Keep the back button working when the pipeline is opened directly.
          if (!job) {
            event.preventDefault()
            navigate(PATHS.recruiter.dashboard)
          }
        }}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {job ? 'Back to pipeline' : 'Back to dashboard'}
      </Button>

      <PageHeader
        title={application.candidateName}
        subtitle={application.headline || `${application.yearsOfExperience} yrs experience`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {application.candidateEmail && (
              <Button as="a" href={`mailto:${application.candidateEmail}`} variant="outline">
                <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Email
              </Button>
            )}

            {nextStage && (
              <Button
                variant="primary"
                loading={moving}
                onClick={() => moveTo(nextStage.key)}
              >
                {!moving && <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                Move to {nextStage.label}
              </Button>
            )}

            {stage?.key !== PIPELINE_STAGE.HIRED && (
              <Button
                variant="ghost"
                className="text-ink-500 hover:text-danger-600"
                onClick={() => setConfirmAction(PIPELINE_STAGE.REJECTED)}
              >
                <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Reject
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* --------------------------- profile --------------------------- */}
          <Card padded={false}>
            <CardHeader
              title="Candidate"
              action={<Badge tone={stage?.tone ?? 'neutral'}>{stage?.label ?? application.stage}</Badge>}
            />
            <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar name={application.candidateName} size="lg" src={application.avatarUrl} />

                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-ink-900">
                    {application.candidateName}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">{application.headline}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={STATUS_TONE[application.status] ?? 'neutral'}>
                    {application.status}
                  </Badge>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">Email</dt>
                  <dd className="mt-1 text-sm text-ink-800">
                    {application.candidateEmail || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">Phone</dt>
                  <dd className="mt-1 text-sm text-ink-800">
                    {application.candidatePhone || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm text-ink-800">
                    <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    {application.candidateLocation || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">
                    Experience
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm text-ink-800">
                    <Briefcase className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    {application.yearsOfExperience} yrs
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">
                    Expected salary
                  </dt>
                  <dd className="mt-1 text-sm text-ink-800">
                    {application.expectedSalary
                      ? formatSalaryRange(
                          application.expectedSalary,
                          application.expectedSalary,
                        )
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">
                    Notice period
                  </dt>
                  <dd className="mt-1 text-sm text-ink-800">{application.noticePeriod || '—'}</dd>
                </div>
              </dl>

              {application.skills?.length > 0 && (
                <div className="mt-5 border-t border-ink-100 pt-4">
                  <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {application.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ------------------------- cover letter ------------------------- */}
          <Card padded={false}>
            <CardHeader title="Cover letter" />
            <div className="p-5">
              {application.coverLetter ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-ink-700">
                  {application.coverLetter}
                </p>
              ) : (
                <p className="text-sm text-ink-400">No cover letter was submitted.</p>
              )}
            </div>
          </Card>

          {/* --------------------------- timeline --------------------------- */}
          <Card padded={false}>
            <CardHeader title="Activity" />
            <div className="p-5">
              <ApplicationTimeline application={application} />
            </div>
          </Card>
        </div>

        {/* ----------------------------- aside ----------------------------- */}
        <aside className="space-y-6">
          <Card padded={false}>
            <CardHeader title="Application" />
            <div className="space-y-3 p-5 text-sm">
              <p className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Applied</span>
                <span className="text-ink-800">{timeAgo(application.appliedAt)}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Applied on</span>
                <span className="text-ink-800">{formatDate(application.appliedAt)}</span>
              </p>
              {application.resumeName && (
                <p className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">Resume</span>
                  <span className="inline-flex items-center gap-1.5 text-ink-800">
                    <Download className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    {application.resumeName}
                  </span>
                </p>
              )}
              {job && (
                <p className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">Job</span>
                  <Link
                    to={PATHS.recruiter.jobDetails(job.id)}
                    className="truncate font-medium text-brand-600 hover:underline"
                  >
                    {job.title}
                  </Link>
                </p>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Quick actions" />
            <div className="space-y-2 p-5">
              {PIPELINE_STAGES.slice(Math.max(0, stageIndex - 2)).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={moving || option.key === application.stage}
                  onClick={() => moveTo(option.key)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    option.key === application.stage
                      ? 'border-brand-300 bg-brand-50 font-semibold text-brand-700'
                      : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                  )}
                >
                  <span>{option.label}</span>
                  {option.key === application.stage && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              ))}

              {stageIndex >= 0 && (
                <button
                  type="button"
                  disabled={moving}
                  onClick={() => moveTo(PIPELINE_STAGE.REJECTED)}
                  className="flex w-full items-center justify-between rounded-lg border border-ink-200 px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:border-danger-300 hover:bg-danger-50 hover:text-danger-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>Reject</span>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Snapshot view</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    This page shows what the candidate submitted on{' '}
                    {formatDate(application.appliedAt)}. Later edits to their profile are not reflected
                    here, which keeps your hiring decisions auditable.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          await moveTo(confirmAction)
        }}
        title={`Reject ${application.candidateName}?`}
        message="The candidate will see their status as Rejected. You can move them back to another stage later."
        confirmLabel="Reject candidate"
      />
    </div>
  )
}