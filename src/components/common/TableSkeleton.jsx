import Skeleton from './Skeleton'
import { cn } from '@/utils/cn'

/**
 * Generic table placeholder that mirrors <DataTable />'s structure so swapping
 * skeleton -> real rows doesn't shift the layout.
 *
 * @param {number} rows      number of skeleton rows
 * @param {number} columns   number of columns to draw
 */
export default function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-ink-200 bg-white">
      <div className="border-b border-ink-200 bg-ink-50 px-5 py-3.5">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn('h-3', i === 0 ? 'w-32' : 'w-20')} />
          ))}
        </div>
      </div>

      <div className="divide-y divide-ink-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-40' : 'w-16')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
