import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from './paths'
import FullPageLoader from '@/components/layout/FullPageLoader'

/**
 * Gate for authenticated areas.
 *
 * While the session is being restored we render a loader rather than
 * redirecting, otherwise a hard refresh on a protected URL would bounce the
 * user to /login before the stored session is read.
 *
 * The attempted location is stashed in router state so Login can send the user
 * back where they were headed.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  const location = useLocation()

  if (initialising) {
    return <FullPageLoader label="Restoring your session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location.pathname + location.search }} replace />
  }

  return children
}
