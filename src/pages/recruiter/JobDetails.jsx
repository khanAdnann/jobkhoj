import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Copy,
  Eye,
  MapPin,
  Pencil,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import StatCard from '@/components/common/StatCard'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as jobService from '@/services/jobService'
import { JOB_STATUS, JOB_STATUS_TONE } from '@/utils/constants'
import { formatDate, formatNumber, formatSalaryRange } from '@/utils/format'
import { PATHS } from '@/routes/paths'

/**
 * Recruiter-facing view of one job (PRD section 15) — performance at a glance
 * plus the actions a recruiter takes most: review applicants, edit, close.
 */
export default function JobDetails() {
  const { id } = useParams()
  const toast = useToast()

  const [confirm, setConfirm] = useState(null)
  const [working, setWorking] = useState(false)

  const query = useFetch(() => jobService.getJob(id), [id])

  if (query.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (query.error || !query.data) {
    return (
      <Card>
        <EmptyState
          icon="file"
          title="Job not found"
          description={query.error?.message ?? 'This job may have been deleted.'}
          action={
            <Button as={Link} to={PATHS.recruiter.jobs} variant="secondary">
              Back to jobs
            </Button>
          }
        />
      </Card>
    )
  }

  const job = query.data
  const closed = job.status === JOB_STATUS.CLOSED

  async function run(action) {
    setWorking(true)
    try {
      if (action === 'close') {
        const updated = await jobService.closeJob(job.id)
        query.setData({ ...query.data, ...updated })
        toast.success('Job closed.')
      } else if (action === 'duplicate') {
        await jobService.duplicateJob(job.id)
        toast.success('Duplicated as a draft.')
      }
      setConfirm(null)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          as={Link}
          to={PATHS.recruiter.jobs}
          variant="ghost"
          size="sm"
          className="-ml-3 mb-3"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          All jobs
        </Button>

        <PageHeader
          title={job.title}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge tone={JOB_STATUS_TONE[job.status] ?? 'neutral'}>{job.status}</Badge>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                Posted {formatDate(job.postedAt)}
              </span>
              {job.deadline && <span>Closes {formatDate(job.deadline)}</span>}
            </span>
          }
          actions={
            <>
              <Button
                as={Link}
                to={PATHS.recruiter.editJob(job.id)}
                variant="outline"
                disabled={closed}
              >
                <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Edit
              </Button>

              <Button
                variant="outline"
                loading={working}
                disabled={closed}
                onClick={() => run('duplicate')}
              >
                {!working && <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                Duplicate
              </Button>

              <Button
                variant="danger"
                disabled={closed}
                onClick={() => setConfirm('close')}
                className="bg-danger-50 text-danger-700 hover:bg-danger-100"
              >
                Close job
              </Button>
            </>
          }
        />
      </div>

      {/* ------------------------------ stats ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Applicants" value={formatNumber(job.applicantCount ?? 0)} icon={Users} tone="brand" />
        <StatCard label="Views" value={formatNumber(job.views ?? 0)} icon={Eye} tone="info" />
        <StatCard
          label="Openings"
          value={formatNumber(job.openings ?? 1)}
          icon={Briefcase}
          tone="neutral"
        />
      </div>

      {closed && (
        <div className="rounded-xl border border-ink-300 bg-ink-100 p-4 text-sm text-ink-700">
          This job is closed. It is no longer accepting applications, but existing applicants remain
          visible on the{' '}
          <Link
            to={PATHS.recruiter.applicants(job.id)}
            className="font-semibold text-brand-600 hover:underline"
          >
            applicants page
          </Link>
          .
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ------------------------- description ------------------------ */}
          <Card padded={false}>
            <CardHeader title="Job description" />
            <div className="space-y-5 p-5">
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink-700">
                {job.description || 'No description provided.'}
              </p>

              {[
                { title: 'Responsibilities', items: job.responsibilities },
                { title: 'Requirements', items: job.requirements },
                { title: 'Preferred skills', items: job.preferredSkills },
                { title: 'Benefits', items: job.benefits },
              ]
                .filter((section) => section.items?.length > 0)
                .map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                      {section.title}
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-ink-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* --------------------------- side rail -------------------------- */}
        <aside className="space-y-6">
          <Card padded={false}>
            <CardHeader title="At a glance" />
            <dl className="divide-y divide-ink-100 text-sm">
              {[
                ['Department', job.department],
                ['Employment type', job.employmentType],
                ['Work mode', job.workMode],
                ['Experience', job.experienceLabel],
                ['Salary', formatSalaryRange(job.salaryMin, job.salaryMax)],
                ['Education', job.education || 'Not specified'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-5 py-2.5">
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="text-right font-medium text-ink-800">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card padded={false}>
            <CardHeader title="Skills" />
            <div className="flex flex-wrap gap-1.5 p-5">
              {(job.skills ?? []).length === 0 && (
                <p className="text-sm text-ink-500">No skills listed.</p>
              )}
              {(job.skills ?? []).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          <Card padded={false}>
            <div className="p-5">
              <Button
                as={Link}
                to={PATHS.recruiter.applicants(job.id)}
                variant="primary"
                fullWidth
              >
                <Users className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Review {job.applicantCount ?? 0} applicant
                {job.applicantCount === 1 ? '' : 's'}
              </Button>

              <Button
                as={Link}
                to={PATHS.jobDetails(job.id)}
                variant="ghost"
                size="sm"
                fullWidth
                className="mt-2"
              >
                View public page
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === 'close'}
        onClose={() => setConfirm(null)}
        onConfirm={() => run('close')}
        title="Close this job?"
        message="No new applications will be accepted. Existing applicants stay visible and you can still manage them."
        confirmLabel="Close job"
      />
    </div>
  )
}