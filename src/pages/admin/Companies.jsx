import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Ban, CheckCircle2, Search, XCircle } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import Select from '@/components/common/Select'
import Input from '@/components/common/Input'
import { CompanyLogo } from '@/components/common/Avatar'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as adminService from '@/services/adminService'
import { PATHS } from '@/routes/paths'
import { COMPANY_STATUS, COMPANY_STATUS_TONE } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

const PAGE_SIZE = 12

const VERIFICATION_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: COMPANY_STATUS.PENDING, label: 'Pending' },
  { value: COMPANY_STATUS.VERIFIED, label: 'Verified' },
  { value: COMPANY_STATUS.REJECTED, label: 'Rejected' },
  { value: COMPANY_STATUS.SUSPENDED, label: 'Suspended' },
]

/**
 * Company verification queue (PRD section 21).
 *
 * Only pending companies get the verify action — an already-verified company
 * cannot be "verified again", and suspending a rejected company is not a
 * meaningful transition, so the buttons shown follow the current status.
 */
export default function AdminCompanies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const verification = searchParams.get('verification') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const search = searchParams.get('query') ?? ''

  useEffect(() => {
    setQuery(search)
  }, [search])

  const { data, error, loading, refetch, setData } = useFetch(
    () => adminService.getAdminCompanies({ verification, query: search, page, pageSize: PAGE_SIZE }),
    [verification, search, page],
  )

  const companies = data?.items ?? []
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

  /** Patches one company in place, then re-syncs the row if the filter excludes it. */
  function patchCompany(id, patch) {
    const updatedItem = companies.find((row) => row.id === id)
    const stillMatches =
      verification === 'all' ||
      (patch.verification ? patch.verification : updatedItem?.verification) === verification

    if (!stillMatches) {
      refetch()
      return
    }

    setData({
      ...data,
      items: companies.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
  }

  async function run(company, action, message) {
    setBusyId(company.id)
    try {
      const updated = await action(company.id)
      patchCompany(company.id, { verification: updated.verification })
      toast.success(message(company, updated))
    } catch (err) {
      toast.error(err.message)
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <CompanyLogo company={row} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate text-xs text-ink-500">{row.industry || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'location', header: 'Location', render: (row) => row.location || '—' },
    {
      key: 'openJobs',
      header: 'Open jobs',
      align: 'right',
      render: (row) => formatNumber(row.openJobs ?? 0),
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (row) => (
        <Badge tone={COMPANY_STATUS_TONE[row.verification] ?? 'neutral'}>
          {row.verification}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        const busy = busyId === row.id
        const isPending = row.verification === COMPANY_STATUS.PENDING

        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            {isPending && (
              <>
                <Button
                  size="xs"
                  variant="success"
                  loading={busy}
                  onClick={() =>
                    run(row, adminService.verifyCompany, (company) => `${company.name} is now verified.`)
                  }
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Verify
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  className="text-ink-500 hover:text-danger-600"
                  onClick={() => setConfirm({ company: row, action: 'reject' })}
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Reject
                </Button>
              </>
            )}

            {row.verification === COMPANY_STATUS.VERIFIED && (
              <Button
                size="xs"
                variant="outline"
                loading={busy}
                onClick={() => setConfirm({ company: row, action: 'suspend' })}
              >
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                Suspend
              </Button>
            )}

            {(row.verification === COMPANY_STATUS.REJECTED ||
              row.verification === COMPANY_STATUS.SUSPENDED) && (
              <Button
                size="xs"
                variant="outline"
                loading={busy}
                onClick={() =>
                  run(row, adminService.verifyCompany, (company) => `${company.name} was reinstated.`)
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Reinstate
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const pendingAction = confirm?.action
  const confirmCompany = confirm?.company

  async function confirmModeration() {
    const company = confirmCompany
    const isReject = pendingAction === 'reject'
    setConfirm(null)

    await run(
      company,
      isReject ? adminService.rejectCompany : adminService.suspendCompany,
      (target) =>
        isReject
          ? `${target.name}'s verification was rejected.`
          : `${target.name} has been suspended.`,
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Companies"
        subtitle="Verify employer claims and suspend companies that break the rules."
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
            label="Search companies"
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Company name or industry"
            className="sm:w-72"
          />

          <Select
            label="Verification"
            name="verification"
            value={verification}
            onChange={(event) => updateParams({ verification: event.target.value })}
            options={VERIFICATION_OPTIONS}
          />

          <Button type="submit" variant="primary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
        </form>
      </Card>

      <DataTable
        columns={columns}
        rows={companies}
        loading={loading}
        error={error}
        emptyIcon="company"
        emptyTitle="No companies match these filters"
        emptyDescription="Try a different verification status or search term."
        emptyAction={
          <Button as={Link} to={PATHS.companies} variant="outline">
            View public directory
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

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={confirmModeration}
        title={
          pendingAction === 'reject'
            ? `Reject ${confirmCompany?.name ?? 'this company'}?`
            : `Suspend ${confirmCompany?.name ?? 'this company'}?`
        }
        message={
          pendingAction === 'reject'
            ? 'The company will be marked as rejected and will not appear in the verified directory.'
            : 'Suspending hides the company from job seekers immediately. Its job posts stop appearing in search.'
        }
        confirmLabel={pendingAction === 'reject' ? 'Reject company' : 'Suspend company'}
        variant={pendingAction === 'reject' ? 'danger' : 'primary'}
      />
    </div>
  )
}