import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatBytes } from '@/utils/format'

/**
 * Drag-and-drop file input used for resume uploads.
 *
 * On change it hands the raw `File` to `onChange(file)`. In mock mode the
 * application layer only keeps file name/size, so the object never has to
 * round-trip a real backend.
 */
export default function FileUpload({
  label = 'Resume',
  accept = '.pdf,.doc,.docx',
  maxSizeMb = 5,
  file,
  onChange,
  onRemove,
  hint,
  error,
  disabled = false,
  className,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState(null)

  function validate(candidate) {
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      return `File is larger than ${maxSizeMb} MB.`
    }
    return null
  }

  function acceptFile(candidate) {
    if (!candidate || disabled) return
    const message = validate(candidate)
    if (message) {
      setLocalError(message)
      onChange?.(null)
      return
    }
    setLocalError(null)
    onChange?.(candidate)
  }

  function onDrop(event) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files?.[0])
  }

  const shownError = localError ?? error

  /* ------------------------------ has file ------------------------------ */

  if (file) {
    return (
      <div className={cn('w-full', className)}>
        {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}

        <div className="flex items-center gap-3 rounded-lg border border-success-500/30 bg-success-50 p-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-success-600">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
            <p className="text-xs text-ink-500">{formatBytes(file.size)}</p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove file"
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-danger-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {shownError && (
          <p className="mt-1.5 text-xs font-medium text-danger-600" role="alert">
            {shownError}
          </p>
        )}
      </div>
    )
  }

  /* ------------------------------ empty --------------------------------- */

  return (
    <div className={cn('w-full', className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-lg border-2 border-dashed px-5 py-7 text-center transition-colors',
          disabled ? 'cursor-not-allowed border-ink-200 bg-ink-50' : 'hover:border-brand-400 hover:bg-brand-50/40',
          dragging && 'border-brand-500 bg-brand-50',
          shownError ? 'border-danger-400' : 'border-ink-300',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
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
            Click to upload
          </button>{' '}
          or drag and drop
        </p>

        <p className="mt-1 text-xs text-ink-400">
          {hint ?? `PDF or DOC up to ${maxSizeMb} MB`}
        </p>

        {shownError && (
          <p className="mt-2 text-xs font-medium text-danger-600" role="alert">
            {shownError}
          </p>
        )}
      </div>
    </div>
  )
}
