import { useContext } from 'react'
import { AuthContext } from '@/context/authContext'

/**
 * Access the authenticated user and auth actions.
 *
 *   const { user, isAuthenticated, logout } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth() must be called inside <AuthProvider>')
  }

  return context
}

export default useAuth
