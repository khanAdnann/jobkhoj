import { Link } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { PATHS } from '@/routes/paths'

/**
 * TEMPORARY placeholder for routes whose real page lands in a later phase.
 *
 * It exists so navigation, guards and redirects stay clickable while the rest of
 * the PRD is being built. Every usage is replaced as its phase ships — grep
 * `Placeholder` to confirm none remain before release.
 */
export default function Placeholder({ title }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
          <Construction className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-5 text-xl font-bold tracking-tight text-ink-900">{title}</h1>

        <p className="mt-2 text-sm text-ink-500">
          This screen is being built. The route, layouts and access rules are already
          wired up.
        </p>

        <Link
          to={PATHS.home}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-ink-300 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}