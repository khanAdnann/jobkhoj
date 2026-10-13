import Breadcrumb from './Breadcrumb'
import { cn } from '@/utils/cn'

/**
 * Standard page title block for dashboard + admin screens.
 *
 * @param {Array}  breadcrumb  Passed straight to <Breadcrumb />.
 * @param {ReactNode} actions  Buttons rendered on the right (wraps on mobile).
 */
export default function PageHeader({ title, subtitle, breadcrumb, actions, className, children }) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} className="mb-2" />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
          {children}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
