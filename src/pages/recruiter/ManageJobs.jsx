import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Copy,
  Eye,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import Dropdown from '@/components/common/Dropdown'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import EmptyState from '@/components/common/EmptyState'
import DataTable from '@/components/common/DataTable'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as recruiterService from '@/services/recruiterService'
import * as jobService from '@/services/jobService'
import { JOB_STATUS, JOB_STATUSES, JOB_STATUS_TONE } from '@/utils/constants'
import { formatDateShort, formatNumber } from '@/utils/format'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

/**
 * Recruiter job list (PRD section 15).
 *
 * Status filter lives in the URL so a specific queue (e.g. pending approval)
 * can be shared or bookmarked.
 */
export default function ManageJobs() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status') ?? 'all'
  const [pending, setPending] = useState({}) // id -> action name
  const [confirm, setConfirm] = useState(null)

  const query = useFetch(() => recruiterService.getRecruiterJobs({ status }), [status])

  const jobs = query.data ?? []

  function setStatusFilter(value) {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete('status')
    else next.set('status', value)
    setSearchParams(next, { replace: true })
  }

  async function runAction(job, action) {
    setPending((prev) => ({ ...prev, [job.id]: action }))
    try {
      if (action === 'delete') {
        await jobService.deleteJob(job.id)
        query.setData(jobs.filter((row) => row.id !== job.id))
        toast.success(`Deleted "${job.title}".`)
      } else if (action === 'duplicate') {
        await jobService.duplicateJob(job.id)
        toast.success('Job duplicated as a draft.')
        query.refetch()
      } else if (action === 'close') {
        await jobService.closeJob(job.id)
        query.setData(
          jobs.map((row) =>
            row.id === job.id ? { ...row, status: JOB_STATUS.CLOSED } : row,
          ),
        )
        toast.success('Job closed. No new applications will be accepted.')
      }
      setConfirm(null)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPending((prev) => {
        const next = { ...prev }
        delete next[job.id]
        return next
      })
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Job',
      sortable: true,
      render: (job) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{job.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {job.location}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-36',
      render: (job) => (
        <Badge tone={JOB_STATUS_TONE[job.status] ?? 'neutral'}>{job.status}</Badge>
      ),
    },
    {
      key: 'applicants',
      header: 'Applicants',
      align: 'right',
      width: 'w-28',
      render: (job) => (
        <Link
          to={PATHS.recruiter.applicants(job.id)}
          className="inline-flex items-center gap-1 font-medium text-ink-700 hover:text-brand-600 hover:underline"
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {formatNumber(job.applicantCount ?? 0)}
        </Link>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      align: 'right',
      width: 'w-24',
      render: (job) => (
        <span className="inline-flex items-center gap-1 text-ink-600">
          <Eye className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
          {formatNumber(job.views ?? 0)}
        </span>
      ),
    },
    {
      key: 'postedAt',
      header: 'Posted',
      align: 'right',
      width: 'w-28',
      sortable: true,
      render: (job) => (
        <span className={cn('text-sm text-ink-500')}>{formatDateShort(job.postedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-32',
      render: (job) => {
        const busy = pending[job.id]
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              as={Link}
              to={PATHS.recruiter.editJob(job.id)}
              size="icon-sm"
              variant="ghost"
              aria-label={`Edit ${job.title}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Dropdown
              align="right"
              trigger={
                <span className="inline-flex h-9 items-center justify-center rounded-lg px-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900">
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">More actions for {job.title}</span>
                </span>
              }
            >
              {({ close }) => (
                <>
                  <Dropdown.Item as={Link} to={PATHS.recruiter.jobDetails(job.id)} onClick={close}>
                    View recruiter page
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to={PATHS.recruiter.editJob(job.id)} onClick={close}>
                    Edit job
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={Copy}
                    disabled={Boolean(busy)}
                    onClick={() => {
                      close()
                      runAction(job, 'duplicate')
                    }}
                  >
                    Duplicate as draft
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={Briefcase}
                    disabled={job.status === JOB_STATUS.CLOSED || Boolean(busy)}
                    onClick={() => {
                      close()
                      setConfirm({ job, action: 'close' })
                    }}
                  >
                    Close job
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    variant="danger"
                    icon={Trash2}
                    disabled={Boolean(busy)}
                    onClick={() => {
                      close()
                      setConfirm({ job, action: 'delete' })
                    }}
                  >
                    Delete
                  </Dropdown.Item>
                </>
              )}
            </Dropdown>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Manage jobs"
        subtitle={`${jobs.length} job${jobs.length === 1 ? '' : 's'}${status === 'all' ? '' : ` with status "${status}"`}`}
        actions={
          <Button as={Link} to={PATHS.recruiter.createJob} variant="primary">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Post a job
          </Button>
        }
      />

      {/* --------------------------- status filter ------------------------- */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 rounded-lg bg-ink-100 p-1" role="tablist">
          {['all', ...JOB_STATUSES].map((value) => {
            const active = status === value
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
                )}
              >
                {value === 'all' ? 'All' : value}
              </button>
            )
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={jobs}
        loading={query.loading}
        error={query.error}
        onRowClick={(job) => navigate(PATHS.recruiter.jobDetails(job.id))}
        emptyIcon="inbox"
        emptyTitle="No jobs found"
        emptyDescription={
          status === 'all'
            ? 'Post your first job to start receiving applications.'
            : `You have no jobs with status "${status}".`
        }
        emptyAction={
          status === 'all' ? (
            <Button as={Link} to={PATHS.recruiter.createJob} variant="primary">
              Post a job
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStatusFilter('all')}>
              Clear filter
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm.job, confirm.action)}
        title={confirm?.action === 'delete' ? 'Delete this job?' : 'Close this job?'}
        message={
          confirm?.action === 'delete'
            ? `"${confirm.job.title}" and all of its applications will be permanently removed.`
            : 'No new applications will be accepted. Existing applicants stay visible.'
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete job' : 'Close job'}
      />
    </div>
  )
}