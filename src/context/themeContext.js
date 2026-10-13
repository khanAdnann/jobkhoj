import { createContext } from 'react'

/**
 * Theme context object, kept in a plain .js module so react-refresh doesn't
 * treat it as a component module.
 *
 * The default value is a working light-mode stub rather than `null`, so any
 * component (navbar, footer, tool pages) can call `useTheme()` without being
 * wrapped in a provider — including the SSR render probes, which never mount
 * the provider tree.
 *
 * @typedef {Object} ThemeContextValue
 * @property {'light'|'dark'} mode      Current colour scheme.
 * @property {boolean} isDark
 * @property {() => void} toggleMode    Flip between light and dark.
 * @property {(mode:'light'|'dark') => void} setMode
 */
export const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  toggleMode: () => {},
  setMode: () => {},
})

export default ThemeContext
