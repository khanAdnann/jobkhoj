import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, Button, Input, Checkbox } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ResultActions from '@/components/tools/ResultActions'
import { totalExperience } from '@/tools/engine/timeline'
import { saveResult } from '@/services/toolsService'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const EMPTY = { company: '', title: '', start: '', end: '', current: false }

const BLOCK_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-info-100 text-info-700',
  'bg-warning-100 text-warning-700',
  'bg-success-100 text-success-700',
]

export default function ExperienceCalculator() {
  const toast = useToast()
  const [periods, setPeriods] = useState([{ ...EMPTY }])

  const summary = totalExperience(
    periods
      .filter((item) => !item.current && item.end)
      .map((item) => ({
        start: item.start,
        end: item.end,
        label: item.company || item.title,
      })),
  )

  function update(index, key, value) {
    setPeriods(
      periods.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )
  }

  function remove(index) {
    setPeriods(periods.filter((_, i) => i !== index))
  }

  function add() {
    setPeriods([...periods, { ...EMPTY }])
  }

  function onSave() {
    const text = periods
      .map(
        (item, index) =>
          `${index + 1}. ${item.title || 'Role'} at ${item.company || 'Company'} — ${
            item.start
          } to ${item.end || 'Present'}`,
      )
      .join('\n')
    if (!text) {
      toast.error('Add at least one role first')
      return
    }
    saveResult({
      toolId: 'experience-calculator',
      title: `Experience timeline — ${summary.label}`,
      content: text,
    })
    toast.success('Timeline saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="experience-calculator"
      title="Experience Calculator"
      blurb="Add your roles and let overlapping months be merged into a true total — no double-counting."
      icon="CalendarRange"
      badge="Free"
    >
      <Card>
        <div className="space-y-4">
          {periods.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-ink-200 bg-ink-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">
                  Role {index + 1}
                </p>
                {periods.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="mr-1 h-4 w-4 text-danger-500" aria-hidden="true" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Role / title"
                  value={item.title}
                  onChange={(event) => update(index, 'title', event.target.value)}
                  placeholder="Senior Backend Engineer"
                />
                <Input
                  label="Company"
                  value={item.company}
                  onChange={(event) => update(index, 'company', event.target.value)}
                  placeholder="Acme Technologies"
                />
                <Input
                  label="Start"
                  type="month"
                  value={item.start}
                  onChange={(event) => update(index, 'start', event.target.value)}
                />
                <Input
                  label={item.current ? 'Current' : 'End'}
                  type={item.current ? 'text' : 'month'}
                  value={item.current ? 'Present' : item.end}
                  disabled={item.current}
                  onChange={(event) => update(index, 'end', event.target.value)}
                  placeholder={item.current ? 'Present' : 'YYY-YMM'}
                />
              </div>

              <div className="mt-3">
                <Checkbox
                  checked={item.current}
                  onChange={(event) => update(index, 'current', event.target.checked)}
                  label="I still work here"
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={add}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              Add another role
            </Button>

            <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              {summary.label}
              {summary.overlaps > 0 && (
                <span className="ml-2 text-[11px] font-medium text-brand-500">
                  {summary.overlaps} overlap{summary.overlaps > 1 ? 's' : ''} merged
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {summary.months > 0 && (
        <Card className="mt-4">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Coverage timeline</h2>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
            {summary.blocks.map((block, index) => (
              <span
                key={index}
                className={cn('h-full', BLOCK_COLORS[index % BLOCK_COLORS.length])}
                style={{ width: `${(block.months / (summary.months || 1)) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {summary.blocks.map((block, index) => (
              <li key={index} className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-sm text-ink-700">
                  <span className={cn('h-2.5 w-2.5 rounded-full', BLOCK_COLORS[index % BLOCK_COLORS.length])} />
                  {formatBlock(block.start, block.end)}
                </span>
                <span className="text-xs font-medium text-ink-500">
                  {block.months} mo
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <ResultActions
              copyText={periods
                .map(
                  (item, index) =>
                    `${index + 1}. ${item.title || 'Role'} at ${item.company || 'Company'} — ${
                      item.start || '?'
                    } to ${item.end || 'Present'}`,
                )
                .join('\n')}
              onSave={onSave}
              onReset={() => setPeriods([{ ...EMPTY }])}
              note="Totals merge overlapping roles so the final number reflects real calendar months."
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}

function formatBlock(start, end) {
  const s = start.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  const e = end.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  return `${s} – ${e}`
}