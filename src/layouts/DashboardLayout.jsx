import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, LogOut, Menu, X } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import NotificationBell from '@/components/layout/NotificationBell'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { getNavIcon } from '@/components/layout/icons'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Avatar } from '@/components/common'
import { ROLE_LABELS } from '@/utils/constants'
import { cn } from '@/utils/cn'

/**
 * Shared shell for the job-seeker, recruiter and admin areas.
 *
 * Sidebar behaviour (PRD section 25):
 *  - desktop: collapsible to an icon rail
 *  - mobile:  off-canvas drawer with a backdrop
 *
 * @param {Array}  nav     Items from SEEKER_NAV / RECRUITER_NAV / ADMIN_NAV.
 * @param {string} accent  Label shown above the nav, e.g. "Recruiter".
 */
export default function DashboardLayout({ nav = [], accent = 'Dashboard' }) {
  const { user, logout, homeRoute } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
      toast.success('You have been signed out.')
      navigate('/')
    } catch {
      toast.error('Could not sign out. Please try again.')
    }
  }

  // Close the mobile drawer whenever the route changes.
  const currentPath = location.pathname
  const sidebarContent = (
    <>
      <div className={cn('flex h-16 items-center border-b border-ink-200', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Logo to={homeRoute} compact={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label={`${accent} navigation`}>
        {!collapsed && (
          <p className="px-3 pt-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
            {accent}
          </p>
        )}

        <ul className="space-y-1">
          {nav.map((item) => {
            const Icon = getNavIcon(item.icon)
            const isActive =
              item.to === homeRoute
                ? currentPath === item.to
                : currentPath.startsWith(item.to)

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && <span className="sr-only">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-ink-200 p-2">
        {/* Collapse control is desktop-only; mobile uses the drawer close button. */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            'hidden w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 lg:flex',
            collapsed ? 'justify-center px-2' : 'px-3',
          )}
        >
          <ChevronLeft
            className={cn('h-5 w-5 shrink-0 transition-transform', collapsed && 'rotate-180')}
            aria-hidden="true"
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50',
            collapsed ? 'justify-center px-2' : 'px-3',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ----------------------------- desktop ----------------------------- */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ink-200 bg-white transition-[width] duration-200 lg:flex',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* ------------------------------ mobile ----------------------------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink-950/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-in-left flex-col bg-white shadow-pop">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ------------------------------ content ---------------------------- */}
      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link to={homeRoute} className="lg:hidden">
              <Logo compact />
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />

              <Link
                to="/jobs"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:block"
              >
                Browse Jobs
              </Link>

              <div className="flex items-center gap-2 border-l border-ink-200 pl-2">
                <Avatar name={user?.name} size="sm" />
                <div className="hidden leading-tight sm:block">
                  <p className="max-w-[9rem] truncate text-sm font-semibold text-ink-900">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-ink-500">{ROLE_LABELS[user?.role] ?? 'Member'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
