import { useContext } from 'react'
import { ThemeContext } from '@/context/themeContext'

/**
 * Access the colour scheme.
 *
 *   const { mode, isDark, toggleMode } = useTheme()
 *
 * Safe outside <ThemeProvider> (renders as light mode) so components in the
 * nav/footer can call it unconditionally.
 */
export function useTheme() {
  return useContext(ThemeContext)
}

export default useTheme
