import { CheckCircle2, Circle, Clock } from 'lucide-react'
import Badge from '@/components/common/Badge'
import { APPLICATION_STATUS, STATUS_TONE } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

/** The happy path an application moves through, in order. */
const FLOW = [
  APPLICATION_STATUS.APPLIED,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW,
  APPLICATION_STATUS.HIRED,
]

const TONE = {
  done: 'bg-success-500 text-white border-success-500',
  current: 'bg-brand-600 text-white border-brand-600 ring-4 ring-brand-100',
  todo: 'bg-white text-ink-300 border-ink-300',
  rejected: 'bg-danger-500 text-white border-danger-500',
}

/**
 * Visual progress of a single application (PRD section 11).
 *
 * Rejected is a terminal branch rather than a step, so it renders as its own
 * red state instead of pretending the flow continues.
 */
export default function ApplicationTimeline({ application, className }) {
  if (!application) return null

  const { status = APPLICATION_STATUS.APPLIED, timeline = [] } = application
  const rejected = status === APPLICATION_STATUS.REJECTED

  const currentIndex = rejected
    ? 1
    : Math.max(0, FLOW.indexOf(status))

  const reached = (index) => !rejected && index <= currentIndex

  const entryFor = (label) =>
    [...timeline].reverse().find((item) => item.label === label)?.at

  return (
    <ol className={cn('space-y-0', className)}>
      {FLOW.map((label, index) => {
        const isCurrent = !rejected && index === currentIndex
        const isDone = reached(index)
        const at = entryFor(label)

        const circleClass = rejected
          ? index < currentIndex
            ? TONE.done
            : TONE.todo
          : isCurrent
            ? TONE.current
            : isDone
              ? TONE.done
              : TONE.todo

        return (
          <li key={label} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  circleClass,
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone && !isCurrent ? (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                ) : isCurrent ? (
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Circle className="h-2 w-2 fill-current" aria-hidden="true" />
                )}
              </span>

              {index < FLOW.length - 1 && (
                <span
                  className={cn(
                    'my-0.5 w-0.5 flex-1 rounded-full transition-colors',
                    isDone && !isCurrent ? 'bg-success-500' : 'bg-ink-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-6">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent ? 'text-ink-900' : isDone ? 'text-ink-700' : 'text-ink-400',
                )}
              >
                {label}
              </p>
              {at && <p className="mt-0.5 text-xs text-ink-500">{formatDate(at)}</p>}
            </div>
          </li>
        )
      })}

      {rejected && (
        <li className="flex gap-3.5">
          <span
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
              TONE.rejected,
            )}
          >
            <Circle className="h-2 w-2 fill-current" aria-hidden="true" />
          </span>
          <div className="pb-2">
            <p className="text-sm font-medium text-danger-700">{APPLICATION_STATUS.REJECTED}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {entryFor(APPLICATION_STATUS.REJECTED)
                ? formatDate(entryFor(APPLICATION_STATUS.REJECTED))
                : 'This application is closed'}
            </p>
          </div>
        </li>
      )}
    </ol>
  )
}

/** Compact status pill for list rows. */
export function ApplicationStatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{status}</Badge>
}