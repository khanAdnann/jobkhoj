import { Link } from 'react-router-dom'
import {
  Briefcase,
  CheckCircle2,
  Eye,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import StatCard from '@/components/common/StatCard'
import EmptyState from '@/components/common/EmptyState'
import { BarSeries, DonutChart, HorizontalBars, LineTrend } from '@/components/charts/Charts'
import { useFetch } from '@/hooks/useFetch'
import * as recruiterService from '@/services/recruiterService'
import { JOB_STATUS_TONE, PIPELINE_STAGES } from '@/utils/constants'
import { formatNumber } from '@/utils/format'
import { PATHS } from '@/routes/paths'

/** Stage key -> the label recruiters actually use. */
const STAGE_LABEL = PIPELINE_STAGES.reduce((acc, stage) => {
  acc[stage.key] = stage.label
  return acc
}, {})

/**
 * Recruiter analytics (PRD section 18).
 *
 * Everything is scoped to the signed-in recruiter's own company, which the mock
 * enforces server-side — the page never filters by companyId itself.
 */
export default function Analytics() {
  const query = useFetch(() => recruiterService.getRecruiterAnalytics(), [])

  const data = query.data
  const totals = data?.totals ?? {}

  if (query.error) {
    return (
      <Card>
        <EmptyState
          icon="chart"
          title="Could not load analytics"
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

  const funnel = (data?.funnel ?? []).map((row) => ({
    label: STAGE_LABEL[row.stage] ?? row.stage,
    value: row.value,
  }))

  const topJobs = data?.topJobs ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="How your jobs and pipeline are performing."
        actions={
          <Button as={Link} to={PATHS.recruiter.jobs} variant="outline">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Manage jobs
          </Button>
        }
      />

      {/* --------------------------------- KPIs ----------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applicants"
          value={query.loading ? '—' : formatNumber(totals.applicants)}
          icon={Users}
          tone="brand"
          hint={`${formatNumber(totals.avgApplicantsPerJob)} per job on average`}
          loading={query.loading}
          to={PATHS.recruiter.candidates}
        />
        <StatCard
          label="Job views"
          value={query.loading ? '—' : formatNumber(totals.views)}
          icon={Eye}
          tone="info"
          hint={`Across ${formatNumber(totals.jobs)} postings`}
          loading={query.loading}
        />
        <StatCard
          label="Hired"
          value={query.loading ? '—' : formatNumber(totals.hired)}
          icon={UserCheck}
          tone="success"
          hint={`${formatNumber(totals.rejected)} rejected`}
          loading={query.loading}
        />
        <StatCard
          label="Offer acceptance"
          value={query.loading ? '—' : `${formatNumber(totals.hireRate)}%`}
          icon={TrendingUp}
          tone="warning"
          hint="Hired as a share of all decisions"
          loading={query.loading}
        />
      </div>

      {/* -------------------------------- trend ----------------------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <CardHeader
            title="Applications over time"
            subtitle="Monthly volume against jobs posted."
          />
          <div className="p-5">
            <LineTrend
              data={data?.trend ?? []}
              dataKey="month"
              series={[
                { key: 'applications', label: 'Applications' },
                { key: 'jobs', label: 'Jobs posted' },
              ]}
              height={280}
            />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader title="Pipeline health" subtitle="Where applicants sit right now." />
          <div className="p-5">
            <DonutChart
              data={funnel.filter((row) => row.value > 0)}
              centerValue={formatNumber(totals.applicants)}
              centerLabel="applicants"
              height={280}
            />
          </div>
        </Card>
      </div>

      {/* ------------------------------- funnel ----------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader
            title="Hiring funnel"
            subtitle="Candidates surviving each stage of your process."
          />
          <div className="p-5">
            <HorizontalBars data={funnel} height={280} />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Applicants by work mode"
            subtitle="Which arrangement attracts the most candidates."
          />
          <div className="p-5">
            <BarSeries data={data?.byWorkMode ?? []} dataKey="mode" height={280} color="#0891b2" />
          </div>
        </Card>
      </div>

      {/* ------------------------------ top jobs ---------------------------- */}
      <Card padded={false}>
        <CardHeader
          title="Top performing jobs"
          subtitle="Ranked by applicant volume."
          action={
            <Button as={Link} to={PATHS.recruiter.jobs} variant="ghost" size="sm">
              View all
            </Button>
          }
        />

        {query.loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-12 w-full animate-pulse rounded-lg bg-ink-100" />
            ))}
          </div>
        ) : topJobs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="briefcase"
              title="No jobs yet"
              description="Post your first job to start seeing performance data."
              action={
                <Button as={Link} to={PATHS.recruiter.createJob}>
                  Post a job
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {topJobs.map((job) => {
              const max = topJobs[0].applicants || 1

              return (
                <li key={job.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={PATHS.recruiter.jobDetails(job.id)}
                      className="block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.round((job.applicants / max) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <span className="hidden text-xs text-ink-500 sm:inline">{formatNumber(job.views)} views</span>
                  <span className="w-16 shrink-0 text-right text-sm font-semibold text-ink-800">
                    {formatNumber(job.applicants)}
                  </span>
                  <Badge tone={JOB_STATUS_TONE[job.status] ?? 'neutral'} size="sm">
                    {job.status}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* ------------------------------- insight ---------------------------- */}
      {!query.loading && totals.applicants > 0 && (
        <Card>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink-900">What this means</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                You convert{' '}
                <strong className="text-ink-800">
                  {formatNumber(totals.hireRate)}% of decided candidates
                </strong>{' '}
                into hires. With {formatNumber(totals.activeJobs)} active job
                {totals.activeJobs === 1 ? '' : 's'} averaging{' '}
                {formatNumber(totals.avgApplicantsPerJob)} applicants each, the clearest lever is
                the gap between {STAGE_LABEL.APPLIED.toLowerCase()} and{' '}
                {STAGE_LABEL.SCREENING.toLowerCase()} — most candidates never clear that first
                review.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}