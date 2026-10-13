import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Skeleton from './Skeleton'
import { cn } from '@/utils/cn'
import { formatDelta } from '@/utils/format'

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-info-50 text-info-600',
  neutral: 'bg-ink-100 text-ink-600',
}

/**
 * KPI tile used on the seeker, recruiter and admin dashboards.
 *
 * @param {string|number} value      Pre-formatted value (e.g. "1.2k").
 * @param {number} delta             Optional % change vs previous period.
 * @param {string} to                Optional link target for the whole card.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  delta,
  deltaLabel = 'vs last month',
  hint,
  to,
  loading = false,
  className,
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && (
          <span
            className={cn(
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              TONES[tone],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-3 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {Number.isFinite(delta) && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold',
              delta >= 0 ? 'text-success-600' : 'text-danger-600',
            )}
          >
            {delta >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {formatDelta(delta)}
          </span>
        )}
        {(hint || (Number.isFinite(delta) && deltaLabel)) && (
          <span className="text-xs text-ink-400">{hint ?? deltaLabel}</span>
        )}
      </div>
    </>
  )

  const shared = cn(
    'block rounded-xl border border-ink-200 bg-white p-5 shadow-card',
    to && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={shared}>
        {body}
      </Link>
    )
  }

  return <div className={shared}>{body}</div>
}
