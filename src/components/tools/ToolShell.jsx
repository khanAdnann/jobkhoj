import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { getToolIcon } from './toolIcons'
import UsageMeter from './UsageMeter'
import { Badge, Breadcrumb } from '@/components/common'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

/**
 * Chrome shared by every tool page: breadcrumb, icon + title + blurb, the
 * free-run meter, and a "more tools" strip at the bottom so tools cross-link
 * without each page hand-rolling it.
 *
 * @param {string} toolId  Registry id (used by the usage meter + history).
 * @param {string} bucket  FREE_LIMITS bucket to meter, or null for unlimited.
 * @param {React.ReactNode} actions  Buttons rendered beside the title.
 * @param {Array<{to:string,label:string}>} related  Cross-links under the tool.
 */
export default function ToolShell({
  toolId,
  title,
  blurb,
  icon,
  badge,
  bucket = null,
  wide = false,
  actions,
  related = [],
  children,
}) {
  const Icon = getToolIcon(icon)

  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8', wide ? 'max-w-7xl' : 'max-w-5xl')}>
      <Breadcrumb
        items={[
          { label: 'Home', to: PATHS.home },
          { label: 'Career Tools', to: PATHS.tools.root },
          { label: title },
        ]}
        className="mb-4"
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
              {badge && <Badge variant="subtle">{badge}</Badge>}
            </div>
            {blurb && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">{blurb}</p>}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {bucket && <UsageMeter bucket={bucket} toolId={toolId} />}
          {actions}
        </div>
      </div>

      {children}

      {(
        related.length
          ? related
          : [
              { to: PATHS.tools.atsChecker, label: 'ATS Resume Checker' },
              { to: PATHS.tools.resumeBuilder, label: 'Resume Builder' },
              { to: PATHS.tools.root, label: 'All tools' },
            ]
      ).length > 0 && (
        <div className="mt-10 rounded-xl border border-ink-200 bg-ink-50/60 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink-800">More career tools</h2>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(related.length
              ? related
              : [
                  { to: PATHS.tools.atsChecker, label: 'ATS Resume Checker' },
                  { to: PATHS.tools.resumeBuilder, label: 'Resume Builder' },
                  { to: PATHS.tools.root, label: 'All tools' },
                ]
            ).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {item.label}
                <ArrowRight
                  className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
