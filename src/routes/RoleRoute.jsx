import { Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from './paths'
import FullPageLoader from '@/components/layout/FullPageLoader'

/**
 * Role-Based Access Control (PRD section 34).
 *
 * Wraps ProtectedRoute so an unauthenticated visitor is sent to /login and an
 * authenticated user in the wrong role is sent to /403 instead of being
 * silently redirected — they deserve to know the page exists but is closed.
 *
 * Order matters: authentication is checked before role, otherwise a logged-out
 * visitor looks like a "wrong role" user and gets bounced to 403 instead of
 * being offered a chance to sign in.
 *
 *   <RoleRoute roles={[ROLES.RECRUITER]}><JobEditor /></RoleRoute>
 */
export default function RoleRoute({ roles = [], children }) {
  const { role, isAuthenticated, homeRoute, initialising } = useAuth()
  const location = useLocation()

  if (initialising) {
    return <FullPageLoader label="Checking your access…" />
  }

  if (!isAuthenticated) {
    return <ProtectedRoute>{children}</ProtectedRoute>
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/403" state={{ from: location.pathname, homeRoute }} replace />
  }

  return children
}

/** Convenience wrapper that also redirects an already-correct-role user home. */
export function GuestRoute({ children }) {
  const { isAuthenticated, homeRoute, initialising } = useAuth()

  if (initialising) {
    return <FullPageLoader label="Loading…" />
  }

  if (isAuthenticated) {
    return <Navigate to={homeRoute} replace />
  }

  return children
}
