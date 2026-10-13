import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import Select from '@/components/common/Select'
import Avatar from '@/components/common/Avatar'
import StatCard from '@/components/common/StatCard'
import { useFetch } from '@/hooks/useFetch'
import * as adminService from '@/services/adminService'
import { PATHS } from '@/routes/paths'
import { APPLICATION_STATUS, STATUS_TONE } from '@/utils/constants'
import { formatNumber, timeAgo } from '@/utils/format'

const PAGE_SIZE = 12

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  ...Object.values(APPLICATION_STATUS).map((status) => ({ value: status, label: status })),
]

/**
 * Platform-wide application log (PRD section 21).
 *
 * Read-only by design: an admin can audit outcomes across every company, but
 * only the recruiter who owns the job can move a candidate through the
 * pipeline. Row links go to the public job, since there is no admin-side
 * candidate review screen.
 */
export default function AdminApplications() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const { data, error, loading } = useFetch(
    () => adminService.getAdminApplications({ status, page, pageSize: PAGE_SIZE }),
    [status, page],
  )

  const overviewQuery = useFetch(() => adminService.getAdminOverview(), [])
  const stats = overviewQuery.data?.stats ?? {}

  const applications = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const safePage = data?.page ?? page

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      const isDefault = value === null || value === undefined || value === '' || value === 'all'
      if (isDefault || (key === 'page' && Number(value) <= 1)) next.delete(key)
      else next.set(key, String(value))
    })
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const columns = [
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.candidateName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.candidateName}</p>
            <p className="truncate text-xs text-ink-500">{row.candidateEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job',
      render: (row) => (
        <div className="min-w-0">
          <Link
            to={PATHS.jobDetails(row.jobId)}
            className="block truncate font-medium text-ink-900 hover:text-brand-600 hover:underline"
          >
            {row.jobTitle}
          </Link>
          <p className="truncate text-xs text-ink-500">{row.companyName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>
      ),
    },
    {
      key: 'appliedAt',
      header: 'Applied',
      render: (row) => <span className="text-ink-500">{timeAgo(row.appliedAt)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applications"
        subtitle="Every application submitted on the platform, newest first."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total applications"
          value={formatNumber(stats.applications ?? 0)}
          tone="brand"
          loading={overviewQuery.loading}
        />
        <StatCard
          label="Candidates hired"
          value={formatNumber(stats.hiredCandidates ?? 0)}
          tone="success"
          loading={overviewQuery.loading}
          hint={
            stats.applications
              ? `${Math.round((stats.hiredCandidates / stats.applications) * 100)}% of applications`
              : undefined
          }
        />
        <StatCard
          label="Active jobs receiving"
          value={formatNumber(stats.activeJobs ?? 0)}
          tone="info"
          loading={overviewQuery.loading}
        />
      </div>

      <Card>
        <div className="max-w-xs">
          <Select
            label="Filter by status"
            name="status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
            options={STATUS_OPTIONS}
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={applications}
        loading={loading}
        error={error}
        emptyIcon="file"
        emptyTitle="No applications match this filter"
        emptyDescription="Choose a different status to see more results."
        emptyAction={
          <Button variant="outline" onClick={() => updateParams({ status: 'all' })}>
            Show all statuses
          </Button>
        }
      />

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={data?.totalItems ?? 0}
        rangeStart={(safePage - 1) * PAGE_SIZE + 1}
        rangeEnd={Math.min(safePage * PAGE_SIZE, data?.totalItems ?? 0)}
        onChange={(next) => updateParams({ page: next })}
      />
    </div>
  )
}