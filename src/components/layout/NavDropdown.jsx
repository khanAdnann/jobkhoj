import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/utils/cn'

/**
 * Desktop dropdown for nav items that have children (e.g. "Career Tools").
 *
 * The first level opens below the trigger; a nested group such as "PDF Tools"
 * opens as a flyout to the right on hover/focus, which keeps the primary menu
 * short enough to scan.
 */
export default function NavDropdown({ item, isActive }) {
  const [open, setOpen] = useState(false)
  const [flyout, setFlyout] = useState(false)
  const ref = useClickOutside(() => {
    setOpen(false)
    setFlyout(false)
  }, open)
  const location = useLocation()

  const active = isActive(item.to)
  const childActive = item.menu?.some((child) =>
    child.to
      ? location.pathname === child.to
      : child.children?.some((nested) => location.pathname === nested.to),
  )

  const triggerClass = cn(
    'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    active || childActive ? 'text-brand-600' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClass}
      >
        {item.label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-ink-400 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-64 animate-scale-in origin-top-left rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop"
          onMouseLeave={() => setOpen(false)}
        >
          <Link
            to={item.to}
            onClick={() => setOpen(false)}
            className="mb-1 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            role="menuitem"
          >
            Career Tools Home
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {item.menu?.map((child, index) => {
            if (child.children) {
              return (
                <div
                  key={`${child.label}-${index}`}
                  className="relative"
                  onMouseEnter={() => setFlyout(true)}
                  onMouseLeave={() => setFlyout(false)}
                >
                  <div
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                    role="menuitem"
                  >
                    {child.label}
                    <ChevronRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  </div>

                  {flyout && (
                    <div
                      role="menu"
                      className="absolute left-full top-0 z-50 ml-1 w-52 animate-scale-in origin-left rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop"
                    >
                      {child.children.map((nested) => (
                        <Link
                          key={nested.to}
                          to={nested.to}
                          onClick={() => {
                            setOpen(false)
                            setFlyout(false)
                          }}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm transition-colors',
                            location.pathname === nested.to
                              ? 'bg-brand-50 font-medium text-brand-700'
                              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                          )}
                          role="menuitem"
                        >
                          {nested.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={child.to}
                to={child.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  location.pathname === child.to
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
                role="menuitem"
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
