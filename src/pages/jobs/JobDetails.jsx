import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  MapPin,
  Share2,
  Users,
} from 'lucide-react'
import JobCard from '@/components/jobs/JobCard'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import ApplyModal from '@/components/jobs/ApplyModal'
import { useAuth } from '@/hooks/useAuth'
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  Spinner,
} from '@/components/common'
import { getJob, getSimilarJobs, trackJobView } from '@/services/jobService'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import { PATHS } from '@/routes/paths'
import { formatDate, formatSalaryRange, timeAgo } from '@/utils/format'
import { COMPANY_STATUS, JOB_STATUS } from '@/utils/constants'

/**
 * Public job detail page (PRD section 8).
 *
 * The apply CTA is replaced by the real flow in phase 6; until then it routes
 * anonymous visitors to login and seekers to the application entry point.
 */
export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAuthenticated } = useAuth()

  const [shareState, setShareState] = useState('idle')
  const [applyOpen, setApplyOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const { data: job, loading, error, refetch } = useFetch(() => getJob(id), [id])

  const { data: similar } = useFetch(() => getSimilarJobs(id, 4), [id], {
    initialData: [],
  })

  /* Fire-and-forget view counter. */
  useEffect(() => {
    if (id) trackJobView(id)
  }, [id])

  /* Per-job document title, restored on unmount (PRD section 35). */
  useEffect(() => {
    if (!job?.title) return undefined

    document.title = `${job.title} at ${job.company?.name ?? 'JobKhoj'} | JobKhoj`
    return () => {
      document.title = 'JobKhoj — Find Your Dream Job'
    }
  }, [job?.title, job?.company?.name])

  const handleShare = useCallback(async () => {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: `${job.title} at ${job.company?.name}`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      setShareState('copied')
      toast.success('Job link copied to your clipboard.')
      setTimeout(() => setShareState('idle'), 2000)
    } catch {
      // User dismissed the native share sheet — nothing to report.
    }
  }, [job, toast])

  function handleApply() {
    if (!isAuthenticated) {
      toast.info('Sign in to apply for this job.')
      navigate(PATHS.login, { state: { from: `/jobs/${id}` } })
      return
    }

    setApplyOpen(true)
  }

  if (loading) return <JobDetailsSkeleton />

  if (error) {
    const notFound = /not found/i.test(error.message)

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20">
        <EmptyState
          icon="search"
          title={notFound ? 'This job is no longer available' : 'We couldn’t load this job'}
          description={
            notFound
              ? 'The listing may have been closed, filled or removed by the employer.'
              : error.message || 'Something went wrong. Please try again.'
          }
          action={
            <div className="flex flex-wrap justify-center gap-3">
              {!notFound && (
                <Button onClick={refetch}>
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Try again
                </Button>
              )}
              <Link
                to={PATHS.jobs}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-ink-300 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                Browse other jobs
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  if (!job) return null

  const alreadyApplied = job.hasApplied || hasApplied
  const isClosed = job.status !== JOB_STATUS.ACTIVE

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'Home', to: PATHS.home },
          { label: 'Jobs', to: PATHS.jobs },
          ...(job.company
            ? [
                {
                  label: job.company.name,
                  to: PATHS.companyDetails(job.company.slug ?? job.company.id),
                },
              ]
            : []),
          { label: job.title },
        ]}
      />

      <Link
        to={PATHS.jobs}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600 lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to jobs
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6">
          {/* ------------------------------- header ------------------------------ */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
                    {job.title}
                  </h1>
                  {job.featured && (
                    <Badge tone="brand" size="sm">
                      Featured
                    </Badge>
                  )}
                </div>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                  {job.company && (
                    <Link
                      to={PATHS.companyDetails(job.company.slug ?? job.company.id)}
                      className="font-semibold text-ink-800 hover:text-brand-600 hover:underline"
                    >
                      {job.company.name}
                    </Link>
                  )}
                  {job.company?.verification === COMPANY_STATUS.VERIFIED && (
                    <BadgeCheck
                      className="h-4 w-4 text-success-600"
                      strokeWidth={2.5}
                      aria-label="Verified company"
                    />
                  )}
                  {job.department && (
                    <>
                      <span className="text-ink-300" aria-hidden="true">
                        •
                      </span>
                      <span>{job.department}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {shareState === 'copied' ? 'Copied' : 'Share'}
                </Button>
                <SaveJobButton jobId={job.id} defaultSaved={job.isSaved} showLabel />
              </div>
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              <MetaItem icon={MapPin} label="Location" value={job.location} />
              <MetaItem icon={Briefcase} label="Job type" value={job.employmentType} />
              <MetaItem icon={Clock} label="Work mode" value={job.workMode} />
              <MetaItem icon={GraduationCap} label="Experience" value={job.experienceLabel} />
              <MetaItem icon={Users} label="Openings" value={String(job.openings)} />
              <MetaItem
                icon={CalendarClock}
                label="Apply before"
                value={job.deadline ? formatDate(job.deadline) : null}
              />
            </ul>

            <div className="mt-6 border-t border-ink-200 pt-5">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Salary range
              </p>
              <p className="mt-1 text-xl font-bold text-success-700">
                {formatSalaryRange(job.salaryMin, job.salaryMax)}
              </p>
            </div>
          </Card>

          {isClosed && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
              <p className="text-sm font-semibold text-warning-700">
                This listing is no longer accepting applications
              </p>
              <Link
                to={PATHS.jobs}
                className="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Browse similar open roles
              </Link>
            </div>
          )}

          {/* ---------------------------- description --------------------------- */}
          <Card>
            <CardHeader title="About this role" />
            <CardBody>
              <div className="space-y-4 text-sm leading-relaxed text-ink-600">
                {job.description
                  ?.split('\n')
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </CardBody>
          </Card>

          <BulletCard title="What you'll do" items={job.responsibilities} />
          <BulletCard title="What you'll need" items={job.requirements} tone="brand" />
          <BulletCard title="Benefits" items={job.benefits} tone="success" />

          {job.skills?.length > 0 && (
            <Card>
              <CardHeader title="Skills" />
              <CardBody>
                <ul className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <li key={skill}>
                      <Badge tone="brand" size="sm">
                        {skill}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {job.preferredSkills?.length > 0 && (
            <Card>
              <CardHeader title="Good to have" />
              <CardBody>
                <ul className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((skill) => (
                    <li key={skill}>
                      <Badge tone="neutral" size="sm">
                        {skill}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {/* ------------------------------ company ----------------------------- */}
          {job.company && (
            <Card>
              <CardHeader title={`About ${job.company.name}`} />
              <CardBody>
                <p className="text-sm leading-relaxed text-ink-600">
                  {job.company.about || 'This employer has not added a description yet.'}
                </p>

                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-ink-500">Industry</dt>
                    <dd className="font-medium text-ink-800">
                      {job.company.industry ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-500">Company size</dt>
                    <dd className="font-medium text-ink-800">{job.company.size ?? '—'}</dd>
                  </div>
                </dl>

                <Link
                  to={PATHS.companyDetails(job.company.slug ?? job.company.id)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
                >
                  View company profile
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardBody>
            </Card>
          )}
        </div>

        {/* ------------------------------- sidebar ------------------------------ */}
        <aside className="mt-6 space-y-4 lg:sticky lg:top-24 lg:mt-0">
          <Card className="text-center">
            <Button
              fullWidth
              size="lg"
              variant={alreadyApplied ? 'success' : 'primary'}
              disabled={isClosed || alreadyApplied}
              onClick={handleApply}
            >
              {alreadyApplied ? 'Already applied' : isClosed ? 'Applications closed' : 'Apply now'}
            </Button>

            <Button variant="outline" fullWidth className="mt-3" onClick={handleShare}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share job
            </Button>

            <dl className="mt-5 space-y-2.5 border-t border-ink-200 pt-4 text-xs text-ink-500">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Views
                </dt>
                <dd className="font-semibold text-ink-800">{job.views ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Posted
                </dt>
                <dd className="font-semibold text-ink-800">{timeAgo(job.postedAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Reference
                </dt>
                <dd className="font-mono font-semibold text-ink-800">{job.id}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Job alerts" />
            <CardBody>
              <p className="text-sm text-ink-600">
                Get notified the moment a similar role is posted.
              </p>
              <Link
                to={PATHS.jobAlerts}
                className="mt-3 inline-flex text-sm font-medium text-brand-600 hover:underline"
              >
                Create an alert
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>

      {/* ------------------------------ similar jobs --------------------------- */}
      {similar?.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-ink-900">Similar jobs</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {similar.map((item) => (
              <JobCard key={item.id} job={item} />
            ))}
          </div>
        </section>
      )}

      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        job={job}
        onApplied={() => setHasApplied(true)}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function MetaItem({ icon: Icon, label, value }) {
  if (!value) return null

  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="truncate text-sm font-medium text-ink-800">{value}</p>
      </div>
    </li>
  )
}

const BULLET_TONE = {
  success: 'text-success-600',
  brand: 'text-brand-600',
  info: 'text-info-600',
}

function BulletCard({ title, items, tone = 'info' }) {
  if (!items?.length) return null

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <ul className="space-y-2.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-ink-600">
              <CheckCircle2
                className={`mt-0.5 h-4 w-4 shrink-0 ${BULLET_TONE[tone]}`}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function JobDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex items-center gap-3 text-sm text-ink-500">
        <Spinner label="Loading job details" />
        Loading job details…
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="space-y-6">
          <Card>
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/3" />
            <Skeleton className="mt-6 h-20 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-11/12" />
            <Skeleton className="mt-2 h-3 w-4/5" />
          </Card>
        </div>

        <Card className="mt-6 lg:mt-0">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Card>
      </div>
    </div>
  )
}