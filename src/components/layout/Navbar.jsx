import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Plus, User } from 'lucide-react'
import Logo from './Logo'
import NavDropdown from './NavDropdown'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useToast } from '@/hooks/useToast'
import { PATHS, PUBLIC_NAV } from '@/routes/paths'
import { ROLE_LABELS } from '@/utils/constants'
import { Avatar } from '@/components/common'
import { cn } from '@/utils/cn'

/**
 * Public site header (PRD section 4).
 *
 * Renders unauthenticated CTAs (Login / Register / Post a Job) or, once signed
 * in, an avatar menu pointing at the correct role dashboard.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout, homeRoute, hasRole } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useClickOutside(() => setMenuOpen(false), menuOpen)

  async function handleLogout() {
    try {
      await logout()
      toast.success('You have been signed out.')
      navigate(PATHS.home)
    } catch {
      toast.error('Could not sign out. Please try again.')
    } finally {
      setMenuOpen(false)
      setMobileOpen(false)
    }
  }

  const isActive = (to) =>
    to === PATHS.home ? location.pathname === PATHS.home : location.pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop navigation */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {PUBLIC_NAV.map((item) =>
            item.menu ? (
              <NavDropdown key={item.label} item={item} isActive={isActive} />
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.to)
                    ? 'text-brand-600'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <NotificationBell />

              {hasRole('RECRUITER') && (
                <Link
                  to={PATHS.recruiter.createJob}
                  className="hidden items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 sm:inline-flex"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Post a Job
                </Link>
              )}

              {/* Avatar menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 rounded-lg p-1 pr-2 transition-colors hover:bg-ink-100"
                >
                  <Avatar name={user?.name} size="sm" />
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-ink-400 transition-transform',
                      menuOpen && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                  <span className="sr-only">Open account menu</span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-60 animate-scale-in overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop"
                  >
                    <div className="flex items-center gap-3 border-b border-ink-200 px-4 py-3">
                      <Avatar name={user?.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {user?.name}
                        </p>
                        <p className="truncate text-xs text-ink-500">{user?.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          {ROLE_LABELS[user?.role] ?? 'Member'}
                        </span>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <Link
                        to={homeRoute}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-100"
                        role="menuitem"
                      >
                        <User className="h-4 w-4 text-ink-400" aria-hidden="true" />
                        Dashboard
                      </Link>

                      {hasRole('RECRUITER') && (
                        <Link
                          to={PATHS.recruiter.createJob}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-100"
                          role="menuitem"
                        >
                          <Plus className="h-4 w-4 text-ink-400" aria-hidden="true" />
                          Post a Job
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-ink-200 p-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger-600 transition-colors hover:bg-danger-50"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to={PATHS.login}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
              >
                Login
              </Link>

              <Link
                to={PATHS.register}
                className="rounded-lg border border-ink-300 px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-400 hover:bg-ink-50"
              >
                Register
              </Link>

              <Link
                to={PATHS.register}
                className="hidden items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 sm:inline-flex"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Post a Job
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink-950/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] animate-slide-in-right flex-col bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-4">
              <Logo compact />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg px-2 py-1 text-sm font-medium text-ink-500 hover:bg-ink-100"
              >
                Close
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile">
              <ul className="space-y-1">
                <li>
                  <ThemeToggle withLabel />
                </li>
                {PUBLIC_NAV.map((item) =>
                  item.menu ? (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => setToolsOpen((prev) => !prev)}
                        aria-expanded={toolsOpen}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          toolsOpen
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-ink-700 hover:bg-ink-100',
                        )}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-ink-400 transition-transform',
                            toolsOpen && 'rotate-180',
                          )}
                          aria-hidden="true"
                        />
                      </button>

                      {toolsOpen && (
                        <ul className="mt-1 space-y-0.5 border-l-2 border-ink-200 pl-2">
                          <li>
                            <Link
                              to={item.to}
                              onClick={() => setMobileOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                            >
                              All Career Tools
                            </Link>
                          </li>

                          {item.menu.map((child, index) =>
                            child.children ? (
                              <li key={`${child.label}-${index}`}>
                                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                  {child.label}
                                </p>
                                <ul className="pl-2">
                                  {child.children.map((nested) => (
                                    <li key={nested.to}>
                                      <Link
                                        to={nested.to}
                                        onClick={() => setMobileOpen(false)}
                                        className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
                                      >
                                        {nested.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ) : (
                              <li key={child.to}>
                                <Link
                                  to={child.to}
                                  onClick={() => setMobileOpen(false)}
                                  className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </li>
                  ) : (
                    <li key={item.label}>
                      <NavLink
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive: active }) =>
                          cn(
                            'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            active
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-ink-700 hover:bg-ink-100',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>

              {isAuthenticated ? (
                <div className="mt-4 space-y-1 border-t border-ink-200 pt-4">
                  <Link
                    to={homeRoute}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={PATHS.notifications}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
                  >
                    Notifications
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger-600 hover:bg-danger-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-2 border-t border-ink-200 pt-4">
                  <Link
                    to={PATHS.login}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg border border-ink-300 px-3 py-2.5 text-center text-sm font-medium text-ink-700"
                  >
                    Login
                  </Link>
                  <Link
                    to={PATHS.register}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Register
                  </Link>
                  <Link
                    to={PATHS.register}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg bg-ink-900 px-3 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Post a Job
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
