import { Link } from 'react-router-dom'
import { ArrowRight, History, Sparkles, Wrench } from 'lucide-react'
import { getToolIcon } from '@/components/tools/toolIcons'
import { TOOLS, TOOL_CATEGORIES } from '@/tools/registry'
import { PATHS } from '@/routes/paths'
import { Badge, Breadcrumb } from '@/components/common'
import { cn } from '@/utils/cn'

/** Accent classes per category — mirrors the registry `accent` values. */
const ACCENT = {
  brand: {
    tile: 'bg-brand-50 text-brand-600 ring-brand-100',
    chip: 'bg-brand-50 text-brand-700',
    hoverRing: 'hover:border-brand-300',
  },
  info: {
    tile: 'bg-info-50 text-info-600 ring-info-100',
    chip: 'bg-info-50 text-info-700',
    hoverRing: 'hover:border-info-300',
  },
  success: {
    tile: 'bg-success-50 text-success-600 ring-success-100',
    chip: 'bg-success-50 text-success-700',
    hoverRing: 'hover:border-success-300',
  },
  warning: {
    tile: 'bg-warning-50 text-warning-600 ring-warning-100',
    chip: 'bg-warning-50 text-warning-700',
    hoverRing: 'hover:border-warning-300',
  },
}

export default function ToolsLanding() {
  const categories = Object.values(TOOL_CATEGORIES)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[{ label: 'Home', to: PATHS.home }, { label: 'Career Tools' }]}
        className="mb-6"
      />

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Career Tools</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              Score your resume, analyse job descriptions, build polished documents and plan your
              next move — every tool runs free and works entirely in your browser.
            </p>
          </div>
        </div>

        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: `${TOOLS.length}`, label: 'Free tools' },
            { value: `${categories.length}`, label: 'Categories' },
            { value: '0₹', label: 'Always free' },
            { value: '100%', label: 'Browser based' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <dt className="order-2 text-xs font-medium text-white/70">{stat.label}</dt>
              <dd className="text-xl font-bold">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Category sections */}
      <div className="mt-10 space-y-12">
        {categories.map((category) => {
          const accent = ACCENT[category.accent] ?? ACCENT.brand
          const tools = TOOLS.filter((tool) => tool.category === category.id)

          return (
            <section key={category.id} className="scroll-mt-20">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink-900">{category.label}</h2>
                  <p className="mt-0.5 text-sm text-ink-500">{category.description}</p>
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', accent.chip)}>
                  {tools.length} tools
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const Icon = getToolIcon(tool.icon)
                  return (
                    <Link
                      key={tool.id}
                      to={tool.to}
                      className={cn(
                        'group flex flex-col rounded-xl border border-ink-200 bg-white p-5 transition-all hover:shadow-md',
                        accent.hoverRing,
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
                            accent.tile,
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        {tool.badge && <Badge variant="subtle">{tool.badge}</Badge>}
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                        {tool.title}
                      </h3>
                      <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-500">{tool.blurb}</p>

                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                        Use tool
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* History CTA */}
      <div className="mt-12">
        <Link
          to={PATHS.tools.history}
          className="group flex flex-col items-start gap-4 rounded-xl border border-ink-200 bg-gradient-to-r from-ink-50 to-white p-6 transition-colors hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white">
              <History className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink-900">History, usage and saved results</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                Every report is recorded locally. Review past runs, watch your free allowance, and
                reopen saved results any time.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-brand-700">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Open history
          </span>
        </Link>
      </div>
    </div>
  )
}