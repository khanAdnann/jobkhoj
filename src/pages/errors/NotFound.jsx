import { Link } from 'react-router-dom'
import { Compass, Home, Search } from 'lucide-react'
import { PATHS } from '@/routes/paths'

/** Catch-all 404 (PRD section 30). */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>

        <p className="mt-6 text-sm font-semibold tracking-widest text-brand-600 uppercase">
          404
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
          We couldn't find that page
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          The link may be broken, or the job listing may have been closed or removed by
          the employer.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to={PATHS.home}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>

          <Link
            to={PATHS.jobs}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-ink-300 bg-white px-5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse jobs
          </Link>
        </div>
      </div>
    </div>
  )
}