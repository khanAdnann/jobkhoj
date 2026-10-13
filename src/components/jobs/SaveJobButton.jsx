import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { toggleSavedJob } from '@/services/userService'
import { cn } from '@/utils/cn'

/**
 * Save / unsave toggle (PRD section 7).
 *
 * Anonymous visitors are sent to the login page with the current location
 * stashed, so they land back on the job they were looking at.
 *
 * @param {boolean} defaultSaved  Initial state from the API, when known.
 * @param {(next:boolean)=>void} onToggle  Lets a list keep a shared saved-set.
 */
export default function SaveJobButton({
  jobId,
  defaultSaved = false,
  onToggle,
  size = 'md',
  className,
  showLabel = false,
}) {
  const { isAuthenticated, hasRole } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [saved, setSaved] = useState(defaultSaved)
  const [busy, setBusy] = useState(false)

  async function onClick(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      toast.info('Sign in to save jobs and get alerts.')
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }

    if (hasRole('RECRUITER', 'ADMIN')) {
      toast.info('Saving jobs is a job-seeker feature.')
      return
    }

    setBusy(true)

    // Optimistic: flip immediately, reconcile if the request fails.
    const next = !saved
    setSaved(next)
    onToggle?.(next)

    try {
      const result = await toggleSavedJob(jobId)
      const actual = result?.saved ?? next
      if (actual !== next) {
        setSaved(actual)
        onToggle?.(actual)
      }
      toast.success(actual ? 'Job saved to your list.' : 'Removed from saved jobs.')
    } catch (error) {
      setSaved(!next)
      onToggle?.(!next)
      toast.error(error.message || 'Could not update your saved jobs.')
    } finally {
      setBusy(false)
    }
  }

  const dimensions =
    size === 'sm'
      ? 'h-8 w-8'
      : showLabel
        ? 'h-10 px-3'
        : 'h-10 w-10'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
      title={saved ? 'Remove from saved jobs' : 'Save this job'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border transition-colors disabled:opacity-60',
        dimensions,
        saved
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-ink-300 bg-white text-ink-500 hover:border-ink-400 hover:bg-ink-50 hover:text-ink-800',
        className,
      )}
    >
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
      {showLabel && (
        <span className="text-sm font-medium">{saved ? 'Saved' : 'Save'}</span>
      )}
    </button>
  )
}