import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react'
import Skeleton from './Skeleton'
import TableSkeleton from './TableSkeleton'
import EmptyState from './EmptyState'
import { cn } from '@/utils/cn'

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/**
 * Declarative table used by every admin and recruiter list screen.
 *
 * @param {Array}  columns   [{ key, header, render?(row), align?, width?, sortable?, sortValue?(row), headerClass?, cellClass? }]
 * @param {Array}  rows      Row objects.
 * @param {string} rowKey    Unique key field, default "id".
 * @param {string} sortKey / {Function} onSort  Enables column sorting.
 * @param {Function} onRowClick  Makes rows clickable (shows a chevron).
 */
export default function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  loading = false,
  skeletonRows = 6,
  error = null,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  emptyIcon = 'inbox',
  onRowClick,
  sortKey,
  sortDirection = 'asc',
  onSort,
  className,
}) {
  const hasActions = columns.some((col) => col.key === 'actions')

  function handleSort(column) {
    if (!column.sortable || !onSort) return
    // Same column toggles direction, otherwise start ascending.
    const next = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort({ key: column.key, direction: next })
  }

  function sortIcon(column) {
    if (!column.sortable) return null
    if (sortKey !== column.key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
    )
  }

  /* ------------------------------ loading ------------------------------- */

  if (loading) {
    return <TableSkeleton rows={skeletonRows} columns={Math.max(columns.length, 3)} />
  }

  /* ------------------------------- error -------------------------------- */

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm text-danger-700">
        {error.message || 'We could not load this table. Please try again.'}
      </div>
    )
  }

  /* ------------------------------ empty --------------------------------- */

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  /* ------------------------------- table -------------------------------- */

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-5 py-3 text-xs font-semibold tracking-wide text-ink-500 uppercase whitespace-nowrap',
                    ALIGN[column.align ?? 'left'],
                    column.sortable && onSort && 'cursor-pointer select-none hover:text-ink-700',
                    column.headerClass,
                  )}
                  onClick={() => handleSort(column)}
                  aria-sort={
                    sortKey === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      column.align === 'right' && 'flex-row-reverse',
                    )}
                  >
                    {column.header}
                    {sortIcon(column)}
                  </span>
                </th>
              ))}
              {onRowClick && hasActions && <th className="w-10 px-3 py-3" />}
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-100">
            {rows.map((row, index) => {
              const key = row[rowKey] ?? index

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-ink-50' : 'hover:bg-ink-50/60',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-5 py-3.5 align-middle text-ink-700',
                        ALIGN[column.align ?? 'left'],
                        column.cellClass,
                      )}
                    >
                      {column.render
                        ? column.render(row, index)
                        : (row[column.key] ?? '—')}
                    </td>
                  ))}

                  {onRowClick && hasActions && (
                    <td className="px-3 py-3.5 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-ink-300" aria-hidden="true" />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Compact card skeleton used while a KPI row loads. */
export function StatSkeleton({ className }) {
  return (
    <div className={cn('rounded-xl border border-ink-200 bg-white p-5 shadow-card', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  )
}
