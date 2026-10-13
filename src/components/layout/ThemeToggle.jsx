import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

/**
 * Light/dark colour-scheme switch.
 *
 * Used in the public header and the dashboard header; safe anywhere (falls
 * back to light mode when no <ThemeProvider> is mounted).
 */
export default function ThemeToggle({ className, withLabel = false }) {
  const { isDark, toggleMode } = useTheme()
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggleMode}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100',
          className,
        )}
      >
        {isDark ? 'Light mode' : 'Dark mode'}
        <Icon className="h-4 w-4 text-ink-400" aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900',
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
