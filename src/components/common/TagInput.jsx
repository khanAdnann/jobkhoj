import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Chip input for keyword lists — job-alert keywords, profile skills, admin
 * report tags.
 *
 * Enter or comma commits the current text; Backspace on an empty input removes
 * the last chip. Duplicates are rejected case-insensitively.
 */
export default function TagInput({
  id,
  value = [],
  onChange,
  placeholder = 'Add and press Enter',
  max = 10,
  disabled = false,
  suggestions = [],
  className,
}) {
  const [draft, setDraft] = useState('')

  const chips = Array.isArray(value) ? value : []
  const atLimit = chips.length >= max

  function commit(raw) {
    const text = raw.trim().replace(/,+$/, '').trim()
    if (!text || disabled || atLimit) return

    const exists = chips.some((chip) => chip.toLowerCase() === text.toLowerCase())
    if (exists) {
      setDraft('')
      return
    }

    onChange?.([...chips, text])
    setDraft('')
  }

  function remove(index) {
    onChange?.(chips.filter((_, i) => i !== index))
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
      return
    }

    if (event.key === 'Backspace' && !draft && chips.length) {
      remove(chips.length - 1)
    }
  }

  /** Picked from the suggestion list. */
  function addSuggestion(item) {
    const text = typeof item === 'string' ? item : item?.value
    if (!text) return

    const exists = chips.some((chip) => chip.toLowerCase() === String(text).toLowerCase())
    if (exists || atLimit) return

    onChange?.([...chips, String(text)])
  }

  const remainingSuggestions = suggestions
    .filter((item) => {
      const text = typeof item === 'string' ? item : item?.value
      return (
        text && !chips.some((chip) => chip.toLowerCase() === String(text).toLowerCase())
      )
    })
    .slice(0, 8)

  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={() => document.getElementById(id)?.focus()}
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 transition-colors',
          disabled
            ? 'cursor-not-allowed border-ink-200 bg-ink-50'
            : 'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
          chips.length ? 'border-ink-300' : 'border-ink-300',
        )}
      >
        {chips.map((chip, index) => (
          <span
            key={`${chip}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pr-1 pl-2 text-xs font-medium text-brand-700"
          >
            {chip}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove ${chip}`}
                className="rounded-full p-0.5 text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-800"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </span>
        ))}

        {!atLimit && (
          <input
            id={id}
            type="text"
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => commit(draft)}
            placeholder={chips.length ? '' : placeholder}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-0.5 text-sm text-ink-800 outline-none placeholder:text-ink-400"
          />
        )}
      </div>

      <p className="mt-1.5 text-xs text-ink-500">
        {atLimit ? `Maximum ${max} items reached.` : `${chips.length}/${max} added — press Enter to add.`}
      </p>

      {!disabled && remainingSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remainingSuggestions.map((item) => {
            const text = typeof item === 'string' ? item : item?.value
            const label = typeof item === 'string' ? item : item?.label ?? item?.value

            return (
              <button
                key={text}
                type="button"
                onClick={() => addSuggestion(item)}
                className="rounded-full border border-ink-300 px-2 py-0.5 text-xs text-ink-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
              >
                + {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}