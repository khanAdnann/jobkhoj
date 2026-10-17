import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Eye,
  Plus,
  Users,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import { useFetch } from '@/hooks/useFetch'
import * as recruiterService from '@/services/recruiterService'
import { JOB_STATUS, JOB_STATUS_TONE, STATUS_TONE } from '@/utils/constants'
import { formatDateShort, formatNumber, timeAgo } from '@/utils/format'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

export default function Dashboard() {
  const query = useFetch(() => recruiterService.getRecruiterDashboard(), [])
  const [showAllApplicants, setShowAllApplicants] = useState(false)

  if (query.error) {
    return (
      <Card>
        <EmptyState
          icon="inbox"
          title="Could not load your dashboard"
          description={query.error.message}
          action={
            <Button variant="secondary" onClick={query.refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  const { company, stats, recentApplicants = [], topJobs = [] } = query.data ?? {}
  const applicants = showAllApplicants ? recentApplicants : recentApplicants.slice(0, 4)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter dashboard"
        subtitle={company ? `${company.name} — manage your openings and candidates.` : 'Loading—'}
        actions={
          <Button as={Link} to={PATHS.recruiter.createJob} variant="primary">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Post a job
          </Button>
        }
      />

      {/* --------------------------------- stats ---------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active jobs"
          value={query.loading ? '—' : formatNumber(stats?.activeJobs)}
          icon={Briefcase}
          tone="brand"
          to={`${PATHS.recruiter.jobs}?status=${encodeURIComponent(JOB_STATUS.ACTIVE)}`}
          loading={query.loading}
        />
        <StatCard
          label="Total applicants"
          value={query.loading ? '—' : formatNumber(stats?.totalApplicants)}
          icon={Users}
          tone="info"
          loading={query.loading}
        />
        <StatCard
          label="Shortlisted"
          value={query.loading ? '—' : formatNumber(stats?.shortlisted)}
          icon={CheckCircle2}
          tone="success"
          loading={query.loading}
        />
        <StatCard
          label="Interviews"
          value={query.loading ? '—' : formatNumber(stats?.interviews)}
          icon={CalendarClock}
          tone="warning"
          loading={query.loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* --------------------------- applicants --------------------------- */}
        <section className="lg:col-span-2">
          <Card padded={false}>
            <CardHeader
              title="Recent applicants"
              subtitle="Candidates who applied to any of your jobs."
              action={
                recentApplicants.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllApplicants((prev) => !prev)}
                  >
                    {showAllApplicants ? 'Show less' : 'View all'}
                  </Button>
                )
              }
            />

            <ul className="divide-y divide-ink-100">
              {query.loading &&
                [1, 2, 3, 4].map((key) => (
                  <li key={key} className="p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                  </li>
                ))}

              {!query.loading && recentApplicants.length === 0 && (
                <li className="p-5">
                  <EmptyState
                    icon="users"
                    title="No applicants yet"
                    description="Once candidates start applying to your jobs they will appear here."
                    action={
                      <Button as={Link} to={PATHS.recruiter.createJob} variant="primary">
                        Post your first job
                      </Button>
                    }
                  />
                </li>
              )}

              {applicants.map((applicant) => (
                <li key={applicant.id}>
                  <Link
                    to={PATHS.recruiter.applicants(applicant.jobId)}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-ink-50/70"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                      {applicant.candidateName?.[0] ?? '?'}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink-900">
                          {applicant.candidateName}
                        </p>
                        <Badge tone={STATUS_TONE[applicant.status] ?? 'neutral'}>
                          {applicant.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-ink-500">{applicant.jobTitle}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {applicant.yearsOfExperience} yrs — Applied {timeAgo(applicant.appliedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ---------------------------- top jobs --------------------------- */}
        <aside>
          <Card padded={false}>
            <CardHeader title="Top performing jobs" subtitle="Ranked by applicants." />
            <ul className="divide-y divide-ink-100">
              {query.loading &&
                [1, 2, 3].map((key) => (
                  <li key={key} className="p-4">
                    <Skeleton className="h-4 w-2/3" />
                  </li>
                ))}

              {!query.loading && topJobs.length === 0 && (
                <li className="p-5">
                  <EmptyState
                    icon="inbox"
                    title="No active jobs"
                    description="Post a job to start receiving applications."
                    compact
                  />
                </li>
              )}

              {topJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    to={PATHS.recruiter.jobDetails(job.id)}
                    className="block p-4 transition-colors hover:bg-ink-50/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-ink-900">
                        {job.title}
                      </p>
                      <Badge tone={JOB_STATUS_TONE[job.status] ?? 'neutral'} size="sm">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{job.location}</p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {job.applicants}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatNumber(job.views)}
                      </span>
                      <span
                        className={cn(
                          'ml-auto',
                          job.applicants === 0 && 'font-medium text-warning-600',
                        )}
                      >
                        {job.applicants === 0
                          ? 'No applicants'
                          : `Posted ${formatDateShort(job.postedAt)}`}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}