import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { PATHS } from '@/routes/paths'
import { ROLE_LABELS } from '@/utils/constants'

/**
 * Shown by <RoleRoute> when an authenticated user opens a page belonging to a
 * different role. We explain the situation rather than silently redirecting,
 * so nobody wonders why they "lost" a link from the email.
 */
export default function Forbidden() {
  const { user, homeRoute } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  function goHome() {
    navigate(homeRoute, { replace: true })
    toast.info('Taken back to your dashboard.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </span>

        <p className="mt-6 text-sm font-semibold tracking-widest text-danger-600 uppercase">
          403
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
          This area is not available to you
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          {user
            ? `You are signed in as a ${ROLE_LABELS[user.role] ?? 'user'}, and this page belongs to a different account type.`
            : 'You need an account with the right permissions to view this page.'}{' '}
          You tried to open{' '}
          <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700">
            {location.state?.from ?? location.pathname}
          </code>
          .
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to={homeRoute}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Go to my dashboard
          </Link>

          <Link
            to={PATHS.home}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-ink-300 bg-white px-5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            Back to home
          </Link>
        </div>

        {user && (
          <button
            type="button"
            onClick={goHome}
            className="mt-6 text-xs font-medium text-brand-600 hover:underline"
          >
            Or continue from where you were
          </button>
        )}
      </div>
    </div>
  )
}