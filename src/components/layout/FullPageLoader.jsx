import { Briefcase } from 'lucide-react'

/**
 * Centred spinner shown while a route guard resolves or the app boots.
 * Kept separate from Spinner so it can own the full viewport height.
 */
export default function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-brand-600 text-white">
        <Briefcase className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-ink-500">{label}</p>
    </div>
  )
}
