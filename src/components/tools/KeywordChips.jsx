import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Present / missing keyword chips (ATS gaps, JD skills, match results).
 *
 * @param {string[]} present  Green chips.
 * @param {string[]} missing  Red chips.
 * @param {string} presentTitle
 * @param {string} missingTitle
 * @param {boolean} empty     Renders a neutral note when both lists are empty.
 */
export default function KeywordChips({
  present = [],
  missing = [],
  presentTitle = 'Found',
  missingTitle = 'Missing',
  emptyNote = null,
  className,
}) {
  if (!present.length && !missing.length) {
    return emptyNote ? (
      <p className="text-sm text-ink-500">{emptyNote}</p>
    ) : null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {present.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success-700">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {presentTitle} ({present.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {present.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-success-500/30 bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger-700">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {missingTitle} ({missing.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-danger-500/30 bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
