import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const LABELS = {
  location: 'Location',
  experience: 'Experience',
  department: 'Department',
  skills: 'Skill',
  jobType: 'Job type',
  workMode: 'Work mode',
  company: 'Company',
}

const DATE_LABELS = {
  '24h': 'Past 24 hours',
  '3d': 'Past 3 days',
  '7d': 'Past week',
  '30d': 'Past month',
}

/**
 * Removable summary of everything currently narrowing the result set.
 * Without it, a 40-result list filtered to 3 gives no clue why.
 */
export default function ActiveFilterChips({ filters = {}, onChange, onReset, className }) {
  const chips = []

  Object.keys(LABELS).forEach((key) => {
    const values = filters[key]
    const list = Array.isArray(values) ? values : values ? [values] : []

    list.forEach((value) => {
      chips.push({
        key,
        value,
        label: value,
        prefix: LABELS[key],
      })
    })
  })

  if (filters.postedDate && filters.postedDate !== 'any') {
    chips.push({
      key: 'postedDate',
      value: filters.postedDate,
      label: DATE_LABELS[filters.postedDate] ?? filters.postedDate,
      prefix: 'Posted',
    })
  }

  if (filters.salaryMin) {
    chips.push({ key: 'salaryMin', value: 'salaryMin', label: `From ₹${filters.salaryMin}L`, prefix: '' })
  }

  if (filters.salaryMax) {
    chips.push({ key: 'salaryMax', value: 'salaryMax', label: `Up to ₹${filters.salaryMax}L`, prefix: '' })
  }

  if (chips.length === 0) return null

  function remove(chip) {
    if (chip.key === 'postedDate') {
      onChange({ ...filters, postedDate: 'any' })
      return
    }

    if (chip.key === 'salaryMin' || chip.key === 'salaryMax') {
      onChange({ ...filters, [chip.key]: '' })
      return
    }

    const current = filters[chip.key]
    const list = Array.isArray(current) ? current : [current]
    onChange({ ...filters, [chip.key]: list.filter((item) => item !== chip.value) })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white py-1 pr-1.5 pl-2.5 text-xs text-ink-700"
        >
          {chip.prefix && (
            <span className="font-medium text-ink-500">{chip.prefix}:</span>
          )}
          <span className="font-medium">{chip.label}</span>
          <button
            type="button"
            onClick={() => remove(chip)}
            aria-label={`Remove ${chip.prefix ? `${chip.prefix} ` : ''}${chip.label} filter`}
            className="rounded-full p-0.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}

      {chips.length > 1 && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-ink-500 underline transition-colors hover:text-danger-600"
        >
          Clear all
        </button>
      )}
    </div>
  )
}