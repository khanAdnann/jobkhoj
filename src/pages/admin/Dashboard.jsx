import { Link } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Card, { CardBody, CardHeader } from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import { LineTrend, DonutChart } from '@/components/charts/Charts'
import { useFetch } from '@/hooks/useFetch'
import * as adminService from '@/services/adminService'
import { PATHS } from '@/routes/paths'
import { formatNumber, timeAgo } from '@/utils/format'
import { COMPANY_STATUS, JOB_STATUS } from '@/utils/constants'

/**
 * Platform overview (PRD section 21).
 *
 * Deliberately queue-first: the moderation work waiting on an admin (pending
 * jobs, unverified companies, blocked accounts) is the reason this screen
 * exists, so those three lists sit directly under the KPIs rather than being
 * buried in their own pages.
 */
export default function AdminDashboard() {
  const { data, error, loading, refetch } = useFetch(() => adminService.getAdminOverview(), [])

  const stats = data?.stats ?? {}
  const queues = data?.queues ?? { pendingJobs: [], pendingCompanies: [], blockedUsers: [] }
  const charts = data?.charts ?? {}

  const hireRate = stats.applications
    ? Math.round((stats.hiredCandidates / stats.applications) * 100)
    : 0

  if (error) {
    return (
      <Card>
        <EmptyState
          icon="alert"
          title="Could not load the admin overview"
          description={error.message}
          action={
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Platform overview"
        subtitle="Moderation queues and marketplace health across JobKhoj."
        actions={
          <Button as={Link} to={PATHS.admin.reports} variant="outline">
            <BarChart3 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            View reports
          </Button>
        }
      />

      {/* ------------------------------- KPIs ------------------------------- */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={formatNumber(stats.totalUsers ?? 0)}
          icon={Users}
          tone="brand"
          loading={loading}
          hint={`${formatNumber(stats.jobSeekers ?? 0)} seekers`}
          to={PATHS.admin.users}
        />
        <StatCard
          label="Companies"
          value={formatNumber(stats.companies ?? 0)}
          icon={Building2}
          tone="info"
          loading={loading}
          hint="Registered employers"
          to={PATHS.admin.companies}
        />
        <StatCard
          label="Active jobs"
          value={formatNumber(stats.activeJobs ?? 0)}
          icon={Briefcase}
          tone="success"
          loading={loading}
          hint={`${formatNumber(stats.totalJobs ?? 0)} total`}
          to={PATHS.admin.jobs}
        />
        <StatCard
          label="Applications"
          value={formatNumber(stats.applications ?? 0)}
          icon={FileCheck2}
          tone="warning"
          loading={loading}
          hint={`${hireRate}% hired`}
          to={PATHS.admin.applications}
        />
      </div>

      {/* ------------------------------ queues ------------------------------ */}

      <div className="grid gap-5 lg:grid-cols-3">
        <QueueCard
          title="Jobs awaiting review"
          icon={CheckCircle2}
          count={stats.pendingJobs ?? 0}
          to={PATHS.admin.jobs}
          loading={loading}
          emptyTitle="No jobs waiting"
          emptyDescription="Newly posted jobs will appear here for review."
          items={queues.pendingJobs}
          renderItem={(job) => ({
            key: job.id,
            title: job.title,
            meta: job.companyName,
            trailing: timeAgo(job.postedAt),
          })}
        />

        <QueueCard
          title="Companies to verify"
          icon={Building2}
          count={queues.pendingCompanies.length}
          to={PATHS.admin.companies}
          loading={loading}
          emptyTitle="Nothing to verify"
          emptyDescription="New company registrations will appear here."
          items={queues.pendingCompanies}
          renderItem={(company) => ({
            key: company.id,
            title: company.name,
            meta: company.location,
            trailing: (
              <Badge tone={COMPANY_STATUS_TONE[company.verification] ?? 'neutral'}>
                {company.verification}
              </Badge>
            ),
          })}
        />

        <QueueCard
          title="Blocked accounts"
          icon={ShieldAlert}
          count={queues.blockedUsers.length}
          to={PATHS.admin.users}
          loading={loading}
          emptyTitle="No blocked accounts"
          emptyDescription="Accounts you block will be listed here."
          items={queues.blockedUsers}
          renderItem={(user) => ({
            key: user.id,
            title: user.name,
            meta: user.email,
            trailing: <Badge tone="neutral">{user.role}</Badge>,
          })}
        />
      </div>

      {/* ------------------------------ charts ------------------------------ */}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <CardHeader
            title="Marketplace activity"
            subtitle="Jobs posted and applications received over the last 12 months."
          />
          <CardBody>
            {loading ? (
              <div className="h-64" />
            ) : (
              <LineTrend
                data={charts.jobsPostedPerMonth ?? []}
                dataKey="month"
                series={[
                  { key: 'jobs', label: 'Jobs posted', color: '#4f46e5' },
                  { key: 'applications', label: 'Applications', color: '#0891b2' },
                ]}
                height={260}
              />
            )}
          </CardBody>
        </Card>

        <Card padded={false}>
          <CardHeader title="Job pipeline" subtitle="Every job by moderation status." />
          <CardBody>
            {loading ? (
              <div className="h-64" />
            ) : (
              <DonutChart
                data={jobStatusSplit(stats)}
                height={260}
                valueKey="value"
                dataKey="label"
                centerValue={formatNumber(stats.totalJobs ?? 0)}
                centerLabel="total jobs"
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ----------------------------- shortcuts ---------------------------- */}

      <Card padded={false}>
        <CardHeader title="Administration" subtitle="Jump to a moderation queue." />
        <div className="grid gap-px bg-ink-100 sm:grid-cols-2 lg:grid-cols-3">
          <Shortcut to={PATHS.admin.users} icon={Users} title="Users" hint="Block, unblock or remove accounts" />
          <Shortcut
            to={PATHS.admin.recruiters}
            icon={UserCheck}
            title="Recruiters"
            hint="Recruiter directory and status"
          />
          <Shortcut
            to={PATHS.admin.companies}
            icon={Building2}
            title="Companies"
            hint="Verify, reject or suspend employers"
          />
          <Shortcut to={PATHS.admin.jobs} icon={Briefcase} title="Jobs" hint="Approve or reject postings" />
          <Shortcut
            to={PATHS.admin.applications}
            icon={FileCheck2}
            title="Applications"
            hint="Every application on the platform"
          />
          <Shortcut to={PATHS.admin.reports} icon={BarChart3} title="Reports" hint="Exportable platform metrics" />
        </div>
      </Card>
    </div>
  )
}

/** Approximate tone map kept local so the dashboard needs no extra imports. */
const COMPANY_STATUS_TONE = {
  [COMPANY_STATUS.PENDING]: 'warning',
  [COMPANY_STATUS.VERIFIED]: 'success',
  [COMPANY_STATUS.REJECTED]: 'danger',
  [COMPANY_STATUS.SUSPENDED]: 'danger',
}

/** Turns flat job counters into donut slices. */
function jobStatusSplit(stats) {
  return [
    { label: 'Active', value: stats.activeJobs ?? 0 },
    { label: JOB_STATUS.PENDING, value: stats.pendingJobs ?? 0 },
    { label: 'Draft', value: stats.draftJobs ?? 0 },
    { label: 'Closed', value: stats.closedJobs ?? 0 },
  ].filter((slice) => slice.value > 0)
}

/** One moderation queue rendered as a list inside a card. */
function QueueCard({
  title,
  icon: Icon,
  count,
  to,
  items,
  renderItem,
  loading,
  emptyTitle,
  emptyDescription,
}) {
  const rendered = items.map(renderItem)

  return (
    <Card padded={false} className="flex flex-col">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-ink-400" aria-hidden="true" />
            {title}
            {!loading && count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-50 px-1.5 text-xs font-bold text-brand-700">
                {count}
              </span>
            )}
          </span>
        }
        subtitle={loading ? 'Loading…' : `${count} item${count === 1 ? '' : 's'}`}
        action={
          <Button as={Link} to={to} size="xs" variant="ghost">
            View all
          </Button>
        }
      />

      <div className="flex-1">
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-9 animate-pulse rounded-lg bg-ink-100" />
            ))}
          </CardBody>
        ) : rendered.length === 0 ? (
          <EmptyState icon="check" title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {rendered.slice(0, 5).map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{item.title}</p>
                  <p className="truncate text-xs text-ink-500">{item.meta}</p>
                </div>
                <div className="shrink-0 text-xs text-ink-400">{item.trailing}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

/** Tiled link into another admin screen. */
function Shortcut({ to, icon: Icon, title, hint }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-white px-5 py-4 transition-colors hover:bg-ink-50"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-900">{title}</span>
        <span className="block truncate text-xs text-ink-500">{hint}</span>
      </span>
    </Link>
  )
}