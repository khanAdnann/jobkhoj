import { useState } from 'react'
import { Check, Copy, Download, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/common'
import { useToast } from '@/hooks/useToast'

/**
 * The row every tool result ends with: copy, download, save, start over.
 *
 * All handlers are optional — a tool only gets the buttons it can honour
 * (nothing renders a download that would produce an empty file).
 *
 * @param {string} copyText  Plain text for the clipboard.
 * @param {() => void} onDownload
 * @param {() => void} onSave
 * @param {() => void} onReset
 * @param {string} note  Honesty line under the buttons (engine / mode).
 */
export default function ResultActions({
  copyText,
  onDownload,
  onSave,
  onReset,
  note,
  primaryLabel,
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText)
      } else {
        const area = document.createElement('textarea')
        area.value = copyText
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        area.remove()
      }
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the text manually.')
    }
  }

  const hasAny = Boolean(copyText || onDownload || onSave || onReset)
  if (!hasAny) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
      {onDownload && (
        <Button onClick={onDownload}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {primaryLabel ?? 'Download'}
        </Button>
      )}

      {copyText && (
        <Button variant="outline" onClick={copy}>
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      )}

      {onSave && (
        <Button variant="outline" onClick={onSave}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Save result
        </Button>
      )}

      {onReset && (
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Start over
        </Button>
      )}

      {note && <p className="w-full text-xs text-ink-400">{note}</p>}
    </div>
  )
}
