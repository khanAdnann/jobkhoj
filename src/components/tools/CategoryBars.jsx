import { cn } from '@/utils/cn'

function barColor(score) {
  if (score >= 80) return 'bg-success-500'
  if (score >= 60) return 'bg-info-500'
  if (score >= 40) return 'bg-warning-500'
  return 'bg-danger-500'
}

/**
 * Scored breakdown rows — ATS categories, match breakdown, factor lists.
 *
 * @param {Array<{label:string,score:number,weight?:number,note?:string}>} rows
 */
export default function CategoryBars({ rows = [], showWeight = false, className }) {
  if (!rows.length) return null

  return (
    <ul className={cn('space-y-3.5', className)}>
      {rows.map((row) => {
        const score = Math.max(0, Math.min(100, Math.round(row.score ?? 0)))
        return (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-ink-700">
                {row.label}
                {showWeight && row.weight != null && (
                  <span className="ml-1.5 text-xs font-normal text-ink-400">
                    weight {row.weight}%
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold tabular-nums text-ink-900">{score}</span>
            </div>

            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn('h-full rounded-full transition-all duration-500', barColor(score))}
                style={{ width: `${score}%` }}
              />
            </div>

            {row.note && <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{row.note}</p>}
          </li>
        )
      })}
    </ul>
  )
}
