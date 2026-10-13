import { useRef, useState } from 'react'
import { FileText, Plus, UploadCloud, X } from 'lucide-react'
import { formatBytes } from '@/utils/format'
import { cn } from '@/utils/cn'

function matchesAccept(file, accept) {
  if (!accept) return true
  const name = (file.name ?? '').toLowerCase()
  const type = (file.type ?? '').toLowerCase()

  return accept.split(',').some((raw) => {
    const pattern = raw.trim().toLowerCase()
    if (!pattern) return true
    if (pattern.startsWith('.')) return name.endsWith(pattern)
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1))
    return type === pattern
  })
}

/**
 * Multi-file drag-and-drop zone used by the document tools.
 *
 * Keeps the selected `File` objects (they are read as bytes at run time), so
 * nothing is uploaded until the user presses the action button.
 *
 * @param {string} accept   '.pdf,.docx' style filter.
 * @param {boolean} multiple
 * @param {number} minFiles  Minimum needed before the run button enables.
 */
export default function FileDropzone({
  accept = '.pdf',
  multiple = false,
  files = [],
  onChange,
  hint,
  label = 'Files',
  minFiles = 1,
  maxSizeMb = 20,
  disabled = false,
  className,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)

  function add(incoming) {
    if (disabled) return

    const list = multiple ? [...files, ...incoming] : incoming.slice(0, 1)
    const accepted = []
    let failure = null

    for (const file of list) {
      if (!matchesAccept(file, accept)) {
        failure = `"${file.name}" does not match ${accept}`
        continue
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        failure = `"${file.name}" is larger than ${maxSizeMb} MB`
        continue
      }
      if (multiple && accepted.some((existing) => existing.name === file.name && existing.size === file.size)) {
        continue
      }
      accepted.push(file)
    }

    setError(failure)
    if (accepted.length) onChange?.(multiple ? accepted : accepted.slice(0, 1))
  }

  function remove(index) {
    onChange?.(files.filter((_, i) => i !== index))
  }

  const ready = files.length >= minFiles

  return (
    <div className={cn('w-full', className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          add([...(event.dataTransfer.files ?? [])])
        }}
        className={cn(
          'rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors',
          dragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-ink-300 bg-ink-50/50 hover:border-brand-400 hover:bg-brand-50/40',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            add([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />

        <UploadCloud
          className={cn('mx-auto h-8 w-8', dragging ? 'text-brand-600' : 'text-ink-400')}
          aria-hidden="true"
        />

        <p className="mt-2.5 text-sm text-ink-600">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="font-semibold text-brand-600 underline-offset-2 hover:underline disabled:text-ink-400"
          >
            {multiple && files.length ? 'Add more files' : 'Click to upload'}
          </button>{' '}
          or drag and drop
        </p>

        <p className="mt-1 text-xs text-ink-400">{hint ?? accept}</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
                <p className="text-xs text-ink-500">{formatBytes(file.size)}</p>
              </div>

              <span
                className={cn(
                  'hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline',
                  ready ? 'bg-success-50 text-success-700' : 'bg-ink-100 text-ink-500',
                )}
              >
                {index + 1} / {files.length}
              </span>

              <button
                type="button"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-danger-600"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}

          {multiple && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-300 py-2 text-xs font-medium text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-600"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add another file
              </button>
            </li>
          )}
        </ul>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
