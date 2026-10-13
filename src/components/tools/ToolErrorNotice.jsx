import { AlertTriangle, Info, Lock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

const TONES = {
  limit: {
    icon: Lock,
    className: 'border-warning-500/40 bg-warning-50 text-warning-700',
    title: 'Free runs used up',
  },
  backend: {
    icon: MapPin,
    className: 'border-info-500/30 bg-info-50 text-info-700',
    title: 'Needs the document backend',
  },
  invalid: {
    icon: AlertTriangle,
    className: 'border-danger-500/30 bg-danger-50 text-danger-700',
    title: 'That file will not work',
  },
  empty: {
    icon: Info,
    className: 'border-ink-300 bg-ink-100 text-ink-700',
    title: 'Nothing to process yet',
  },
}

function toneFor(error) {
  switch (error?.code) {
    case 'LIMIT_EXCEEDED':
      return 'limit'
    case 'BACKEND_REQUIRED':
      return 'backend'
    case 'EMPTY':
      return 'empty'
    case 'INVALID_FILE':
    case 'UNSUPPORTED':
      return 'invalid'
    default:
      return 'invalid'
  }
}

/**
 * Renders a tool failure as guidance instead of a crash.
 *
 * The BACKEND_REQUIRED path is the honest one: it names the endpoint that
 * will serve the operation rather than pretending a file was produced.
 */
export default function ToolErrorNotice({ error, className }) {
  if (!error) return null

  const tone = TONES[toneFor(error)]
  const Icon = tone.icon
  const isLimit = error.code === 'LIMIT_EXCEEDED'

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-xl border p-4', tone.className, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />

      <div className="min-w-0 text-sm">
        <p className="font-semibold">{tone.title}</p>
        <p className="mt-0.5 leading-relaxed">{error.message}</p>

        {error.endpoint && (
          <code className="mt-2 inline-block rounded bg-white/70 px-2 py-1 text-xs font-medium">
            {error.endpoint}
          </code>
        )}

        {isLimit && (
          <p className="mt-2">
            <Link
              to={`${PATHS.tools.history}?tab=usage`}
              className="font-semibold underline-offset-2 hover:underline"
            >
              See your usage
            </Link>{' '}
            or reset it from the history page while the backend is in mock mode.
          </p>
        )}
      </div>
    </div>
  )
}
