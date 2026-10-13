import { Link } from 'react-router-dom'
import { usageFor } from '@/services/toolsService'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

/**
 * Remaining free runs for a tool's usage bucket.
 *
 * Reads the store on every render, so it reflects the consumption that just
 * happened as soon as the page re-renders after a run.
 *
 * @param {string} bucket  A FREE_LIMITS key ('atsCheck' | 'pdfConversion' | …)
 *                         Pass null for unlimited tools.
 */
export default function UsageMeter({ bucket, toolId, className }) {
  if (!bucket) return null

  const usage = usageFor(bucket)
  if (!usage.limit) return null

  const exhausted = usage.remaining === 0
  const low = !exhausted && usage.remaining <= 2

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
        exhausted
          ? 'border-warning-500/40 bg-warning-50 text-warning-700'
          : low
            ? 'border-warning-500/30 bg-warning-50/70 text-warning-700'
            : 'border-ink-200 bg-ink-50 text-ink-600',
        className,
      )}
      title={`${usage.used} of ${usage.limit} free runs used`}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          exhausted ? 'bg-warning-600' : low ? 'bg-warning-500' : 'bg-success-500',
        )}
        aria-hidden="true"
      />
      {exhausted ? (
        <Link to={`${PATHS.tools.history}?tab=usage`} className="underline-offset-2 hover:underline">
          Free runs used · view usage
        </Link>
      ) : (
        <span>
          {usage.remaining} of {usage.limit} free runs left
        </span>
      )}
      <span className="sr-only">for {toolId}</span>
    </div>
  )
}
