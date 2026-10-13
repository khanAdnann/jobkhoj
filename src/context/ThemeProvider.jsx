import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from '@/context/themeContext'
import { storage } from '@/utils/storage'

const THEME_KEY = 'theme.mode'
const VALID = ['light', 'dark']

/**
 * Theme provider — owns the light/dark colour scheme.
 *
 * The stored choice is applied to <html class="dark"> in an effect, and every
 * surface/border/text colour in the app is derived from CSS variables that the
 * `.dark` block in index.css redefines, so one class flips the whole product.
 */
export default function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    const stored = storage.get(THEME_KEY, null)
    return VALID.includes(stored) ? stored : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const dark = mode === 'dark'
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    storage.set(THEME_KEY, mode)
  }, [mode])

  const setMode = useCallback((next) => {
    if (VALID.includes(next)) setModeState(next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ mode, isDark: mode === 'dark', setMode, toggleMode }),
    [mode, setMode, toggleMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
