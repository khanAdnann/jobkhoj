import { CheckCircle2 } from 'lucide-react'
import ResultActions from './ResultActions'
import { formatBytes } from '@/utils/format'
import { downloadBlob, downloadText } from '@/utils/download'

/**
 * Shared result panel for the file tools.
 *
 * `FileReady` shows a single produced file with a download button; `TextReady`
 * previews extracted plain text for the resume-format converter.
 */
export function FileReady({
  result,
  fileName,
  mime = 'application/pdf',
  meta = [],
  onReset,
  note,
  primaryLabel,
}) {
  const name = fileName ?? result?.fileName ?? 'document'
  const bytes = result?.bytes
  const size = bytes ? formatBytes(bytes.length ?? bytes.byteLength ?? 0) : null

  return (
    <div>
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">{name} is ready</p>
          {size && <p className="mt-0.5 text-xs text-ink-500">{size}</p>}
          {meta.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {meta.map((item) => (
                <li
                  key={item.label}
                  className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600"
                >
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ResultActions
          onDownload={bytes ? () => downloadBlob(bytes, name, mime) : undefined}
          onReset={onReset}
          note={note}
          primaryLabel={primaryLabel ?? `Download ${name}`}
        />
      </div>
    </div>
  )
}

export function TextReady({ text, fileName, onReset, note }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink-900">Plain text is ready to copy or download</p>
      </div>

      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-ink-200 bg-ink-50 p-4 text-xs leading-relaxed text-ink-700">
        {text}
      </pre>

      <div className="mt-4">
        <ResultActions
          copyText={text}
          onDownload={text ? () => downloadText(text, fileName ?? 'document.txt') : undefined}
          onReset={onReset}
          note={note}
        />
      </div>
    </div>
  )
}

export default FileReady