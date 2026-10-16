import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/context/authContext'
import { storage } from '@/utils/storage'
import { clearToken, getToken, onUnauthorized } from '@/services/api'
import * as authService from '@/services/authService'
import { HOME_BY_ROLE, TOKEN_KEY, USER_KEY } from '@/utils/constants'
import { supabaseEnabled } from '@/services/supabaseClient'

/**
 * Authentication provider.
 *
 * Session restore strategy: hydrate synchronously from localStorage so a page
 * refresh does not flash a logged-out state, then validate against the API in
 * the background. A failed validation clears the session.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    supabaseEnabled ? null : storage.get(USER_KEY, null),
  )
  const [initialising, setInitialising] = useState(() =>
    supabaseEnabled ? true : Boolean(getToken()),
  )

  /* --------------------------- session restore --------------------------- */

  useEffect(() => {
    if (supabaseEnabled) {
      let cancelled = false

      authService
        .me()
        .then((fresh) => {
          if (!cancelled) setUser(fresh)
        })
        .catch((error) => {
          if (!cancelled) {
            console.error('[auth] Could not restore the Supabase profile.', error)
            setUser(null)
          }
        })
        .finally(() => {
          if (!cancelled) setInitialising(false)
        })

      return () => {
        cancelled = true
      }
    }

    const token = getToken()
    const cachedUser = storage.get(USER_KEY, null)

    if (!token || !cachedUser) {
      if (token && !cachedUser) clearToken()
      setUser(null)
      setInitialising(false)
      return undefined
    }

    let cancelled = false

    // Validate in the background; keep the cached user visible meanwhile.
    authService
      .me()
      .then((fresh) => {
        if (cancelled) return
        setUser(fresh)
        storage.set(USER_KEY, fresh)
      })
      .catch(() => {
        if (cancelled) return
        clearToken()
        storage.remove(USER_KEY)
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setInitialising(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /* ---------------------- react to backend 401s -------------------------- */

  useEffect(
    () => {
      if (supabaseEnabled) return undefined

      return onUnauthorized(() => {
        clearToken()
        storage.remove(USER_KEY)
        setUser(null)
      })
    },
    [],
  )

  /* ------------------------------- actions ------------------------------- */

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)
    setUser(result.user)
    return result.user
  }, [])

  const register = useCallback(async (payload) => {
    const result = await authService.register(payload)
    if (result?.user) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      if (!supabaseEnabled) {
        // Always clear the legacy mock/backend session, even if logout failed.
        clearToken()
        storage.remove(USER_KEY)
        storage.remove(TOKEN_KEY)
      }
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const fresh = await authService.me()
    setUser(fresh)
    if (!supabaseEnabled) storage.set(USER_KEY, fresh)
    return fresh
  }, [])

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      if (!supabaseEnabled) storage.set(USER_KEY, next)
      return next
    })
  }, [])

  /* -------------------------------- derived ------------------------------ */

  const value = useMemo(
    () => ({
      user,
      initialising,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      homeRoute: user ? (HOME_BY_ROLE[user.role] ?? '/') : '/',
      login,
      register,
      logout,
      refresh,
      updateUser,
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, initialising, login, register, logout, refresh, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
