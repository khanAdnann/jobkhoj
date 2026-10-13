import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ExternalLink, Search, XCircle } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import Select from '@/components/common/Select'
import Input from '@/components/common/Input'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as adminService from '@/services/adminService'
import { PATHS } from '@/routes/paths'
import { JOB_STATUS, JOB_STATUS_TONE } from '@/utils/constants'
import { formatLpa, formatNumber, timeAgo } from '@/utils/format'

const PAGE_SIZE = 12

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  ...Object.values(JOB_STATUS).map((status) => ({ value: status, label: status })),
]

/**
 * Job moderation queue (PRD section 21).
 *
 * Rejecting a post is the only destructive action here, so it goes through a
 * confirmation; approving is reversible and runs immediately.
 */
export default function AdminJobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const search = searchParams.get('query') ?? ''

  useEffect(() => {
    setQuery(search)
  }, [search])

  const { data, error, loading, refetch, setData } = useFetch(
    () => adminService.getAdminJobs({ status, query: search, page, pageSize: PAGE_SIZE }),
    [status, search, page],
  )

  const jobs = data?.items ?? []
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

  /**
   * Applies a moderation outcome. When the active status filter no longer
   * matches the new status the row has to leave the table, so we refetch instead
   * of patching it in place.
   */
  function applyOutcome(id, nextStatus) {
    const current = jobs.find((row) => row.id === id)

    if (status !== 'all' && nextStatus !== current?.status) {
      refetch()
      return
    }

    setData({
      ...data,
      items: jobs.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)),
    })
  }

  async function moderate(job, action, nextStatus, message) {
    setBusyId(job.id)
    try {
      const updated = await action(job.id)
      applyOutcome(job.id, updated.status ?? nextStatus)
      toast.success(message(job))
    } catch (err) {
      toast.error(err.message)
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Job',
      render: (row) => (
        <div className="min-w-0">
          <Link
            to={PATHS.jobDetails(row.id)}
            className="block truncate font-medium text-ink-900 hover:text-brand-600 hover:underline"
          >
            {row.title}
          </Link>
          <p className="truncate text-xs text-ink-500">
            {row.companyName} · {row.location}
          </p>
        </div>
      ),
    },
    {
      key: 'workMode',
      header: 'Type',
      render: (row) => (
        <span className="text-ink-600">
          {row.employmentType} · {row.workMode}
        </span>
      ),
    },
    {
      key: 'salaryMax',
      header: 'Salary',
      align: 'right',
      render: (row) => (
        <span className="text-ink-600">{formatLpa(row.salaryMax)}</span>
      ),
    },
    {
      key: 'applications',
      header: 'Applicants',
      align: 'right',
      render: (row) => formatNumber(row.applicationCount ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={JOB_STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>
      ),
    },
    {
      key: 'postedAt',
      header: 'Posted',
      render: (row) => <span className="text-ink-500">{timeAgo(row.postedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        const busy = busyId === row.id
        const isActive = row.status === JOB_STATUS.ACTIVE
        const isPending = row.status === JOB_STATUS.PENDING

        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            {isPending && (
              <>
                <Button
                  size="xs"
                  variant="success"
                  loading={busy}
                  onClick={() =>
                    moderate(row, adminService.approveJob, JOB_STATUS.ACTIVE, (job) => `${job.title} is now live.`)
                  }
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  className="text-ink-500 hover:text-danger-600"
                  onClick={() => setConfirm(row)}
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Reject
                </Button>
              </>
            )}

            {isActive && (
              <Button
                size="xs"
                variant="ghost"
                className="text-ink-500"
                loading={busy}
                onClick={() =>
                  moderate(row, adminService.closeJob, JOB_STATUS.CLOSED, (job) => `${job.title} was closed.`)
                }
              >
                Close
              </Button>
            )}

            <Button as={Link} to={PATHS.jobDetails(row.id)} size="xs" variant="ghost">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jobs"
        subtitle="Approve or reject every posting that recruiters submit."
      />

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            updateParams({ query: query.trim() })
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Input
            label="Search jobs"
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, company or location"
            className="sm:w-72"
          />

          <Select
            label="Status"
            name="status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
            options={STATUS_OPTIONS}
          />

          <Button type="submit" variant="primary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
        </form>
      </Card>

      <DataTable
        columns={columns}
        rows={jobs}
        loading={loading}
        error={error}
        emptyIcon="briefcase"
        emptyTitle="No jobs match these filters"
        emptyDescription="Try a different status or search term."
      />

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={data?.totalItems ?? 0}
        rangeStart={(safePage - 1) * PAGE_SIZE + 1}
        rangeEnd={Math.min(safePage * PAGE_SIZE, data?.totalItems ?? 0)}
        onChange={(next) => updateParams({ page: next })}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const job = confirm
          return moderate(job, adminService.rejectJob, JOB_STATUS.REJECTED, (target) => `${target.title} was rejected.`)
        }}
        title={`Reject ${confirm?.title ?? 'this job'}?`}
        message="The post is removed from job search and the recruiter is notified. You can re-approve it later if it is corrected."
        confirmLabel="Reject job"
      />
    </div>
  )
}