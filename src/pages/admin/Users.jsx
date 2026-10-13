import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, CheckCircle2, Search, Trash2, UserCog } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import DataTable, { StatSkeleton } from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import Select from '@/components/common/Select'
import Input from '@/components/common/Input'
import Avatar from '@/components/common/Avatar'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatCard from '@/components/common/StatCard'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as adminService from '@/services/adminService'
import { useAuth } from '@/hooks/useAuth'
import { ROLES, USER_STATUS } from '@/utils/constants'
import { formatNumber, timeAgo } from '@/utils/format'

const PAGE_SIZE = 12

const ROLE_TONE = {
  [ROLES.JOB_SEEKER]: 'info',
  [ROLES.RECRUITER]: 'brand',
  [ROLES.ADMIN]: 'warning',
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: ROLES.JOB_SEEKER, label: 'Job seekers' },
  { value: ROLES.RECRUITER, label: 'Recruiters' },
  { value: ROLES.ADMIN, label: 'Admins' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: USER_STATUS.ACTIVE, label: 'Active' },
  { value: USER_STATUS.BLOCKED, label: 'Blocked' },
]

/**
 * User moderation (PRD section 21).
 *
 * Filters live in the URL so an admin can bookmark or share "blocked
 * recruiters", and so the back button steps through filter changes.
 */
export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const { user: currentUser } = useAuth()

  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const role = searchParams.get('role') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  // Keep the search box in sync when navigation changes the URL (back/forward).
  useEffect(() => {
    setQuery(searchParams.get('query') ?? '')
  }, [searchParams])

  const { data, error, loading, refetch, setData } = useFetch(
    () => adminService.getAdminUsers({ role, status, query: searchParams.get('query') ?? '', page, pageSize: PAGE_SIZE }),
    [role, status, searchParams.get('query'), page],
  )

  const statsQuery = useFetch(() => adminService.getUserStats(), [])

  const users = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  /** Merges a patch into the URL, resetting to page 1 on any filter change. */
  function updateParams(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      // "all"/"" are the absence of a filter, and page 1 is the default.
      const isDefault = value === null || value === undefined || value === '' || value === 'all'
      if (isDefault || (key === 'page' && Number(value) <= 1)) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  function submitSearch(event) {
    event.preventDefault()
    updateParams({ query: query.trim() })
  }

  /** Patches one row in place so the table doesn't flash while refetching. */
  function patchRow(id, patch) {
    setData({
      ...data,
      items: users.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
  }

  async function toggleStatus(row) {
    const next = row.status === USER_STATUS.BLOCKED ? USER_STATUS.ACTIVE : USER_STATUS.BLOCKED

    setBusyId(row.id)
    try {
      const updated = await adminService.setUserStatus(row.id, next)
      patchRow(row.id, { status: updated.status })
      toast.success(`${row.name} is now ${updated.status.toLowerCase()}.`)
      statsQuery.refetch()
    } catch (err) {
      toast.error(err.message)
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  async function removeUser() {
    const row = confirm
    setBusyId(row.id)

    try {
      await adminService.deleteUser(row.id)
      toast.success(`${row.name} was removed.`)
      setConfirm(null)
      // Deleting the only row on the last page should step back a page.
      if (users.length === 1 && page > 1) updateParams({ page: page - 1 })
      else refetch()
      statsQuery.refetch()
    } catch (err) {
      toast.error(err.message)
      setConfirm(null)
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatar} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium text-ink-900">
              <span className="truncate">{row.name}</span>
              {row.id === currentUser?.id && (
                <Badge tone="brand" size="sm">
                  You
                </Badge>
              )}
            </p>
            <p className="truncate text-xs text-ink-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge tone={ROLE_TONE[row.role] ?? 'neutral'}>{row.role}</Badge>
      ),
    },
    { key: 'location', header: 'Location', render: (row) => row.location || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === USER_STATUS.BLOCKED ? 'danger' : 'success'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => <span className="text-ink-500">{timeAgo(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        const isSelf = row.id === currentUser?.id
        const busy = busyId === row.id

        return (
          <div
            className="inline-flex items-center gap-1.5"
            // Row-level buttons must not trigger any row click handler.
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="xs"
              variant="outline"
              loading={busy}
              disabled={isSelf}
              title={isSelf ? 'You cannot change your own status' : undefined}
              onClick={() => toggleStatus(row)}
            >
              {row.status === USER_STATUS.BLOCKED ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Unblock
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                  Block
                </>
              )}
            </Button>

            <Button
              size="xs"
              variant="ghost"
              className="text-ink-500 hover:text-danger-600"
              disabled={isSelf}
              title={isSelf ? 'You cannot delete your own account' : undefined}
              onClick={() => setConfirm(row)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle="Search, block or remove accounts across every role."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsQuery.loading ? (
          [0, 1, 2, 3].map((row) => <StatSkeleton key={row} />)
        ) : (
          <>
            <StatCard label="Total users" value={formatNumber(statsQuery.data?.totalUsers ?? 0)} icon={UserCog} tone="brand" />
            <StatCard label="Job seekers" value={formatNumber(statsQuery.data?.jobSeekers ?? 0)} tone="info" />
            <StatCard label="Recruiters" value={formatNumber(statsQuery.data?.recruiters ?? 0)} tone="brand" />
            <StatCard
              label="Blocked"
              value={formatNumber(statsQuery.data?.blockedUsers ?? 0)}
              icon={Ban}
              tone={statsQuery.data?.blockedUsers > 0 ? 'danger' : 'success'}
              hint={`${formatNumber(statsQuery.data?.activeUsers ?? 0)} active`}
            />
          </>
        )}
      </div>

      <Card>
        <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Search"
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email or location"
            className="sm:w-72"
          />

          <Select
            label="Role"
            name="role"
            value={role}
            onChange={(event) => updateParams({ role: event.target.value })}
            options={ROLE_OPTIONS}
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
        rows={users}
        loading={loading}
        error={error}
        emptyIcon="users"
        emptyTitle="No users match these filters"
        emptyDescription="Try a different role, status or search term."
      />

      <Pagination
        page={data?.page ?? page}
        totalPages={totalPages}
        totalItems={data?.totalItems ?? 0}
        rangeStart={((data?.page ?? page) - 1) * PAGE_SIZE + 1}
        rangeEnd={Math.min((data?.page ?? page) * PAGE_SIZE, data?.totalItems ?? 0)}
        onChange={(next) => updateParams({ page: next })}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={removeUser}
        title={`Delete ${confirm?.name ?? 'this user'}?`}
        message="This permanently removes the account along with its saved jobs, alerts and notifications. This cannot be undone."
        confirmLabel="Delete user"
      />
    </div>
  )
}