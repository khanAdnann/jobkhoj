import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, CheckCircle2, Search, UserCheck } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import Select from '@/components/common/Select'
import Input from '@/components/common/Input'
import Avatar from '@/components/common/Avatar'
import StatCard from '@/components/common/StatCard'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as adminService from '@/services/adminService'
import { ROLES, USER_STATUS } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

const PAGE_SIZE = 12

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: USER_STATUS.ACTIVE, label: 'Active' },
  { value: USER_STATUS.BLOCKED, label: 'Blocked' },
]

/**
 * Recruiter directory (PRD section 21).
 *
 * A role-filtered view over the same user collection as the Users screen —
 * the recruiter account is just a user whose role gates the recruiter area, so
 * there is no separate collection to keep in sync.
 */
export default function AdminRecruiters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [busyId, setBusyId] = useState(null)

  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const search = searchParams.get('query') ?? ''

  useEffect(() => {
    setQuery(search)
  }, [search])

  const { data, error, loading, refetch, setData } = useFetch(
    () =>
      adminService.getAdminUsers({
        role: ROLES.RECRUITER,
        status,
        query: search,
        page,
        pageSize: PAGE_SIZE,
      }),
    [status, search, page],
  )

  const statsQuery = useFetch(() => adminService.getUserStats(), [])

  const recruiters = data?.items ?? []
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

  async function toggleStatus(row) {
    const next = row.status === USER_STATUS.BLOCKED ? USER_STATUS.ACTIVE : USER_STATUS.BLOCKED

    setBusyId(row.id)
    try {
      const updated = await adminService.setUserStatus(row.id, next)
      setData({
        ...data,
        items: recruiters.map((item) => (item.id === row.id ? { ...item, status: updated.status } : item)),
      })
      toast.success(`${row.name} is now ${updated.status.toLowerCase()}.`)
      statsQuery.refetch()
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
      header: 'Recruiter',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate text-xs text-ink-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'title', header: 'Role', render: (row) => row.title || '—' },
    {
      key: 'companyName',
      header: 'Company',
      render: (row) => row.companyName ?? 'Unlinked',
    },
    { key: 'location', header: 'Location', render: (row) => row.location || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === USER_STATUS.BLOCKED ? 'danger' : 'success'}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          loading={busyId === row.id}
          onClick={() => toggleStatus(row)}
        >
          {row.status === USER_STATUS.BLOCKED ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Reactivate
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              Block
            </>
          )}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recruiters"
        subtitle="Employer accounts that can post jobs and review applicants."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Recruiters"
          value={formatNumber(statsQuery.data?.recruiters ?? 0)}
          icon={UserCheck}
          tone="brand"
          loading={statsQuery.loading}
          hint="Employer accounts"
        />
        <StatCard
          label="Active recruiters"
          value={formatNumber(statsQuery.data?.recruiters ?? 0)}
          tone="success"
          loading={statsQuery.loading}
          hint="Can post and review"
        />
        <StatCard
          label="Blocked recruiters"
          value={formatNumber(statsQuery.data?.blockedUsers ?? 0)}
          icon={Ban}
          tone={statsQuery.data?.blockedUsers > 0 ? 'danger' : 'success'}
          loading={statsQuery.loading}
          hint="Across all roles"
        />
      </div>

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            updateParams({ query: query.trim() })
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Input
            label="Search recruiters"
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email or location"
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
        rows={recruiters}
        loading={loading}
        error={error}
        emptyIcon="users"
        emptyTitle="No recruiters match these filters"
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
    </div>
  )
}