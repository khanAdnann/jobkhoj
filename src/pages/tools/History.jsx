import { useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { Copy, History as HistoryIcon, RefreshCcw, Trash2, XCircle } from 'lucide-react'
import { Card, Button } from '@/components/common'
import { Breadcrumb, Badge } from '@/components/common'
import { getToolIcon } from '@/components/tools/toolIcons'
import {
  listHistory,
  clearHistory,
  removeHistoryEntry,
  FREE_LIMITS,
  usageFor,
  resetUsage,
  listSaved,
  deleteSaved,
} from '@/services/toolsService'
import { findTool } from '@/tools/registry'
import { timeAgo } from '@/utils/format'
import { PATHS } from '@/routes/paths'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'usage', label: 'Free usage' },
  { id: 'saved', label: 'Saved results' },
]

function toolBadge(toolId) {
  const tool = findTool(toolId)
  return {
    icon: getToolIcon(tool?.icon),
    label: tool?.title ?? toolId,
  }
}

export default function ToolsHistory() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const active = TABS.some((tab) => tab.id === params.get('tab')) ? params.get('tab') : 'activity'
  const [_refresh, setRefresh] = useState(0)
  const bump = () => setRefresh((value) => value + 1)

  const history = listHistory()
  const saved = listSaved()

  function confirmWith(then) {
    if (typeof window === 'undefined' || window.confirm('This cannot be undone. Continue?')) then()
  }

  function handleClearHistory() {
    confirmWith(() => {
      clearHistory()
      bump()
      toast.success('Activity cleared')
    })
  }

  function handleResetUsage() {
    confirmWith(() => {
      resetUsage()
      bump()
      toast.success('Free usage counters reset')
    })
  }

  function handleDeleteSaved(id, title) {
    confirmWith(() => {
      deleteSaved(id)
      bump()
      toast.success(`Removed "${title}"`)
    })
  }

  function setTab(tab) {
    if (tab === 'activity') setParams({})
    else setParams({ tab })
  }

  const Icon = getToolIcon('History')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb items={[{ label: 'Career Tools', to: PATHS.tools.root }, { label: 'History' }]} />

      <header className="mt-4 mb-6 flex items-start gap-3">
        <span className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Tool History</h1>
          <p className="mt-1 text-sm text-ink-500">
            Everything you ran, how much free usage you have left, and the results you saved.
          </p>
        </div>
      </header>

      <nav className="mb-5 flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              active === tab.id
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-ink-500 hover:text-ink-800',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {active === 'activity' && (
        <ToolCard
          title="Activity"
          action={
            history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                <XCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                Clear all
              </Button>
            )
          }
        >
          {history.length === 0 ? (
            <EmptyState
              title="No activity yet"
              text="Run any tool — ATS check, a merge, a cover letter — and it shows up here."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {history.map((entry) => {
                const tool = toolBadge(entry.toolId)
                const ToolIcon = tool.icon
                return (
                  <li key={entry.id} className="flex items-center gap-3 py-3">
                    <span className="rounded-lg bg-ink-100 p-2 text-ink-500">
                      <ToolIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{tool.label}</p>
                      <p className="truncate text-xs text-ink-500">
                        {[entry.fileName, entry.summary].filter(Boolean).join(' · ') || 'No details'}
                      </p>
                    </div>
                    {entry.href ? (
                      <NavLink
                        to={entry.href}
                        className="shrink-0 text-xs font-semibold text-brand-600 underline-offset-2 hover:underline"
                      >
                        Open
                      </NavLink>
                    ) : (
                      entry.status && <Badge tone="success">{entry.status}</Badge>
                    )}
                    <span className="shrink-0 text-xs text-ink-400">{timeAgo(entry.date)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove entry"
                      onClick={() => {
                        removeHistoryEntry(entry.id)
                        bump()
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </ToolCard>
      )}

      {active === 'usage' && (
        <ToolCard
          title="Free usage"
action={
              <Button variant="ghost" size="sm" onClick={handleResetUsage}>
                <RefreshCcw className="mr-1 h-4 w-4" aria-hidden="true" />
                Reset counters
              </Button>
            }
        >
          <ul className="space-y-4">
            {Object.keys(FREE_LIMITS).map((bucket) => {
              const usage = usageFor(bucket)
              const pct = usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0
              return (
                <li key={bucket}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink-800">{bucketLabel(bucket)}</span>
                    <span className="text-xs text-ink-500">
                      {usage.remaining}/{usage.limit} runs left
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pct >= 100 ? 'bg-danger-500' : pct >= 75 ? 'bg-warning-500' : 'bg-brand-500',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-ink-500">
            Counters are stored in your browser. Subscribing goes through the free
            tier first, then switches to backend-tracked credits automatically.
          </p>
        </ToolCard>
      )}

      {active === 'saved' && (
        <ToolCard title="Saved results">
          {saved.length === 0 ? (
            <EmptyState
              title="Nothing saved yet"
              text="Use the Save result button on any tool to pin a copy here."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {saved.map((item) => {
                const tool = toolBadge(item.toolId)
                const ToolIcon = tool.icon
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className="rounded-lg bg-ink-100 p-2 text-ink-500">
                      <ToolIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{item.title}</p>
                      <p className="truncate text-xs text-ink-500">{toolBadge(item.toolId).label}</p>
                    </div>
<button
                  type="button"
                  aria-label="Copy saved result"
                  className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600"
                  onClick={() => {
                    navigator.clipboard?.writeText(item.content ?? '').then(
                      () => toast.success('Copied to clipboard'),
                      () => toast.error('Could not copy'),
                    )
                  }}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete saved result"
                      onClick={() => handleDeleteSaved(item.id, item.title)}
                    >
                      <Trash2 className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </ToolCard>
      )}

      <p className="mt-6 text-center text-xs text-ink-400">
        <HistoryIcon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        History is local to this browser. Export or download results to keep them long-term.
      </p>
    </div>
  )
}

function ToolCard({ title, action, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 bg-ink-50/60 px-5 py-3">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-3">{children}</div>
    </Card>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-xs text-ink-500">{text}</p>
    </div>
  )
}

function bucketLabel(bucket) {
  const labels = {
    atsCheck: 'ATS Checker',
    pdfConversion: 'Document conversions',
    coverLetter: 'Cover letters',
    interviewSet: 'Interview question sets',
    aiAnalysis: 'AI analysis',
  }
  return labels[bucket] ?? bucket
}