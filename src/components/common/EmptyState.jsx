import {
  SearchX,
  Inbox,
  FileQuestion,
  Users,
  Briefcase,
  BarChart3,
  Building2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const ICONS = {
  search: SearchX,
  inbox: Inbox,
  file: FileQuestion,
  users: Users,
  briefcase: Briefcase,
  chart: BarChart3,
  company: Building2,
  alert: AlertTriangle,
  check: CheckCircle2,
}

/**
 * Zero-data placeholder used by every list/table in the app.
 *
 * @param {'search'|'inbox'|'file'|'users'|'briefcase'|'chart'|'company'|'alert'|'check'|React.ComponentType} icon
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  description,
  action,
  className,
  compact = false,
}) {
  // An unknown string would otherwise render as a bogus <chart> DOM element.
  const Icon = typeof icon === 'string' ? (ICONS[icon] ?? Inbox) : (icon ?? Inbox)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50/60 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-400 ring-1 ring-ink-200">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>

      <h3 className="text-base font-semibold text-ink-900">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
