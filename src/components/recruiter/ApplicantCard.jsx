import { Link } from 'react-router-dom'
import {
  Briefcase,
  Check,
  GripVertical,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react'
import Badge from '@/components/common/Badge'
import Avatar from '@/components/common/Avatar'
import { cn } from '@/utils/cn'
import { formatYears, timeAgo } from '@/utils/format'
import { STATUS_TONE } from '@/utils/constants'
import { PATHS } from '@/routes/paths'

/**
 * One candidate card in the recruiter pipeline board (PRD section 17).
 *
 * Draggable via native HTML5 drag events — the board is column-based rather
 * than a free-form grid, so columns are drop targets and cards are sources.
 */
export default function ApplicantCard({ application, onMove, disabled }) {
  const skills = (application.skills ?? []).slice(0, 4)
  const email = application.candidateEmail ?? application.email
  const phone = application.candidatePhone ?? application.phone
  const candidateLocation = application.candidateLocation ?? application.location

  function handleDragStart(event) {
    // The payload is consumed by the column's drop handler.
    event.dataTransfer.setData('text/plain', application.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      className={cn(
        'group rounded-lg border border-ink-200 bg-white p-3 shadow-sm transition-shadow',
        !disabled && 'cursor-grab hover:shadow-card active:cursor-grabbing',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={application.candidateName} size="sm" src={application.avatarUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                {application.candidateName}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-500">{application.headline}</p>
            </div>

            {!disabled && (
              <GripVertical
                className="h-4 w-4 shrink-0 text-ink-300 group-hover:text-ink-400"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" aria-hidden="true" />
              {formatYears(application.yearsOfExperience)} yrs
            </span>
            {candidateLocation && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {candidateLocation}
              </span>
            )}
            <span>{timeAgo(application.appliedAt)}</span>
          </div>

          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-1.5 border-t border-ink-100 pt-2.5">
            {email && (
              <a
                href={`mailto:${email}`}
                aria-label={`Email ${application.candidateName}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                aria-label={`Call ${application.candidateName}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}

            <span className="ml-auto">
              <Badge tone={STATUS_TONE[application.status] ?? 'neutral'} size="sm">
                {application.status}
              </Badge>
            </span>
          </div>

          {/* Keyboard-accessible alternative to dragging. */}
          {onMove && !disabled && (
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => onMove(application, 'PREVIOUS')}
                disabled={application.isFirstColumn}
                className="inline-flex h-6 flex-1 items-center justify-center rounded border border-ink-300 text-[11px] font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Back
              </button>
              <button
                type="button"
                onClick={() => onMove(application, 'NEXT')}
                disabled={application.isLastColumn}
                className="inline-flex h-6 flex-1 items-center justify-center gap-1 rounded border border-ink-300 text-[11px] font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                Advance
              </button>
            </div>
          )}
        </div>
      </div>

      <Link
        to={PATHS.recruiter.applicantDetails(application.id)}
        className="mt-2 block text-[11px] font-semibold text-brand-600 hover:underline"
      >
        View full application
      </Link>
    </div>
  )
}