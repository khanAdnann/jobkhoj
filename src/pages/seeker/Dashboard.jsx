import { Link } from 'react-router-dom'
import {
  Briefcase,
  Bookmark,
  CalendarClock,
  Search,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import ApplicationCard from '@/components/seeker/ApplicationCard'
import ProfileCompleteness from '@/components/seeker/ProfileCompleteness'
import JobCard from '@/components/jobs/JobCard'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import * as applicationService from '@/services/applicationService'
import * as jobService from '@/services/jobService'
import { formatNumber } from '@/utils/format'
import { PATHS } from '@/routes/paths'

const GREETING = (() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})()

export default function Dashboard() {
  const { user } = useAuth()

  const stats = useFetch(() => applicationService.getMyApplicationStats(), [])
  const recent = useFetch(() => applicationService.getMyApplications({ pageSize: 3 }), [])
  const suggested = useFetch(
    () => jobService.listJobs({ pageSize: 3, sort: 'newest' }),
    [],
  )

  const s = stats.data
  const resumeMissing = !user?.hasResume

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${GREETING}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        subtitle="Here is how your job search is going."
        actions={
          <Button as={Link} to="/jobs" variant="primary">
            <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Browse jobs
          </Button>
        }
      />

      {/* ------------------------------ resume nudge ------------------------ */}
      {resumeMissing && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning-500/30 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-warning-600">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Upload your resume</p>
              <p className="mt-0.5 text-sm text-ink-600">
                Applications without a resume are skipped by most recruiters.
              </p>
            </div>
          </div>
          <Button as={Link} to={PATHS.resume} variant="primary" className="shrink-0">
            Upload resume
          </Button>
        </div>
      )}

      {/* --------------------------------- stats ---------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applied"
          value={stats.loading ? '—' : formatNumber(s?.appliedJobs)}
          icon={Briefcase}
          tone="brand"
          to={PATHS.applications}
          loading={stats.loading}
        />
        <StatCard
          label="Under review"
          value={stats.loading ? '—' : formatNumber(s?.underReview)}
          icon={TrendingUp}
          tone="info"
          to={`${PATHS.applications}?status=Under+Review`}
          loading={stats.loading}
        />
        <StatCard
          label="Shortlisted"
          value={stats.loading ? '—' : formatNumber(s?.shortlisted)}
          icon={UserCheck}
          tone="success"
          to={`${PATHS.applications}?status=Shortlisted`}
          loading={stats.loading}
        />
        <StatCard
          label="Saved jobs"
          value={stats.loading ? '—' : formatNumber(s?.savedJobs)}
          icon={Bookmark}
          tone="warning"
          to={PATHS.savedJobs}
          loading={stats.loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------ applications ---------------------- */}
        <section className="lg:col-span-2">
          <Card padded={false}>
            <CardHeader
              title="Recent applications"
              subtitle="Track the status of your latest applications."
              action={
                <Link
                  to={PATHS.applications}
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  View all
                </Link>
              }
            />

            <div className="space-y-3 p-5">
              {recent.loading &&
                [1, 2, 3].map((key) => (
                  <Skeleton key={key} className="h-28 w-full rounded-xl" />
                ))}

              {!recent.loading && recent.error && (
                <EmptyState
                  icon={Briefcase}
                  title="Could not load applications"
                  description={recent.error}
                  action={
                    <Button variant="secondary" onClick={recent.refetch}>
                      Try again
                    </Button>
                  }
                />
              )}

              {!recent.loading &&
                !recent.error &&
                recent.data?.items.length === 0 && (
                  <EmptyState
                    icon={Briefcase}
                    title="No applications yet"
                    description="When you apply to a job it will show up here with its live status."
                    action={
                      <Button as={Link} to="/jobs" variant="primary">
                        Find jobs
                      </Button>
                    }
                  />
                )}

              {recent.data?.items.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </Card>
        </section>

        {/* ------------------------------- side rail ------------------------- */}
        <aside className="space-y-6">
          <Card>
            <ProfileCompleteness user={user} />
          </Card>

          <Card padded={false}>
            <CardHeader title="Quick actions" />
            <div className="space-y-1 p-3">
              {[
                { to: '/jobs', label: 'Search jobs', icon: Search },
                { to: PATHS.savedJobs, label: 'Saved jobs', icon: Bookmark },
                { to: PATHS.jobAlerts, label: 'Manage alerts', icon: CalendarClock },
                { to: PATHS.resume, label: 'My resume', icon: UserCheck },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
                >
                  <item.icon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {/* ------------------------------ suggestions ------------------------ */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink-900">Fresh opportunities</h2>
            <p className="mt-0.5 text-sm text-ink-500">Recently posted roles you might like.</p>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand-600 hover:underline">
            See all
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suggested.loading &&
            [1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-52 w-full rounded-xl" />
            ))}

          {suggested.data?.items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </div>
  )
}
