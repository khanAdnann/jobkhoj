import { Check, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { PROFILE_CHECKLIST, profileChecks } from './profileChecks'

/**
 * Profile completion meter (PRD section 11).
 *
 * Each entry is a checklist item; completed items contribute an equal share of
 * the score, so the percentage is simply `done / total`.
 *
 * The checklist logic lives in profileChecks.js so the seeker dashboard can
 * compute the score without pulling in this component.
 */
const TONE = {
  low: { bar: 'bg-danger-500', text: 'text-danger-600' },
  medium: { bar: 'bg-warning-500', text: 'text-warning-600' },
  high: { bar: 'bg-success-500', text: 'text-success-600' },
}

export default function ProfileCompleteness({ user, className, showChecklist = true }) {
  const items = profileChecks(user)
  const complete = items.filter((item) => item.done).length
  const percent = Math.round((complete / PROFILE_CHECKLIST.length) * 100)

  const tone = percent >= 80 ? TONE.high : percent >= 50 ? TONE.medium : TONE.low

  const message =
    percent >= 80
      ? 'Great — your profile stands out to recruiters.'
      : percent >= 50
        ? 'Good start. Fill the remaining items to double your views.'
        : 'Complete your profile to get matched with relevant roles.'

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-700">Profile strength</p>
          <p className={cn('mt-0.5 text-xs font-semibold', tone.text)}>{percent}% complete</p>
        </div>
        <p className="text-xs text-ink-500">
          {complete}/{PROFILE_CHECKLIST.length} done
        </p>
      </div>

      <div
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ink-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', tone.bar)}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-ink-500">{message}</p>

      {showChecklist && (
        <ul className="mt-4 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={item.href}
                className="group inline-flex items-center gap-1.5 text-xs text-ink-600 transition-colors hover:text-brand-600"
              >
                {item.done ? (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-success-600"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
                )}
                <span className={cn('group-hover:underline', item.done && 'text-ink-400')}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}