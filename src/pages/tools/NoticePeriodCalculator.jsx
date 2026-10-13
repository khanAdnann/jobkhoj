import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ResultActions from '@/components/tools/ResultActions'
import { saveResult } from '@/services/toolsService'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/useToast'

const DAYS_FOR = { days: 1, weeks: 7, months: 30 }

function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function todayISO() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const UNITS = [
  { id: 'days', label: 'Days' },
  { id: 'weeks', label: 'Weeks' },
  { id: 'months', label: 'Months (≈30 days)' },
]

export default function NoticePeriodCalculator() {
  const toast = useToast()
  const [start, setStart] = useState(todayISO())
  const [length, setLength] = useState('90')
  const [unit, setUnit] = useState('days')

  const totalDays = Math.round(Number(length) * (DAYS_FOR[unit] ?? 1))
  const endDate = addDays(new Date(`${start}T00:00:00`), totalDays)
  const endLabel = formatDate(endDate)

  function onSave() {
    saveResult({
      toolId: 'notice-period-calculator',
      title: `Notice calculation — ${length} ${unit}`,
      content: [
        `Notice started: ${start ? formatDate(new Date(`${start}T00:00:00`)) : ''}`,
        `Notice period: ${length} ${unit} (${totalDays} calendar days)`,
        `Earliest joining date: ${endLabel}`,
        '(excludes weekends only if the company counts working days)',
      ].join('\n'),
    })
    toast.success('Calculation saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="notice-period-calculator"
      title="Notice Period Calculator"
      blurb="Figure out your earliest possible joining date from your notice period — no spreadsheets needed."
      icon="Clock"
      badge="Free"
    >
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Notice starts"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            hint="Day you hand in your resignation."
          />
          <Input
            label="Notice period"
            type="number"
            min="1"
            value={length}
            onChange={(event) => setLength(event.target.value)}
          />
          <Select
            label="Unit"
            options={UNITS.map((item) => ({ value: item.id, label: item.label }))}
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setStart(todayISO())
              setLength('90')
              setUnit('days')
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Calculation</h2>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-ink-50 px-4 py-3">
            <dt className="text-xs font-medium text-ink-500">Notice starts</dt>
            <dd className="mt-1 text-sm font-semibold text-ink-900">
              {start ? formatDate(new Date(`${start}T00:00:00`)) : '—'}
            </dd>
          </div>
          <div className="rounded-lg bg-ink-50 px-4 py-3">
            <dt className="text-xs font-medium text-ink-500">Notice span</dt>
            <dd className="mt-1 text-sm font-semibold text-ink-900">
              {totalDays} calendar days
            </dd>
          </div>
          <div className="rounded-lg bg-brand-50 px-4 py-3">
            <dt className="text-xs font-medium text-brand-600">Earliest joining date</dt>
            <dd className="mt-1 text-sm font-semibold text-brand-800">{endLabel}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-ink-500">
          Most companies count calendar days, but some start counting from the next
          working day or include the date of resignation. If your offer date crosses
          a weekend or a public holiday, confirm the exact last working day with HR.
        </p>

        <div className="mt-4">
          <ResultActions
            copyText={[
              `Notice starts: ${start ? formatDate(new Date(`${start}T00:00:00`)) : ''}`,
              `Notice period: ${length} ${unit} (${totalDays} calendar days)`,
              `Earliest joining date: ${endLabel}`,
            ].join('\n')}
            onSave={onSave}
            onReset={() => {
              setStart(todayISO())
              setLength('90')
              setUnit('days')
            }}
          />
        </div>
      </Card>
    </ToolShell>
  )
}