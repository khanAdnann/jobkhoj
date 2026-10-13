import { useState } from 'react'
import ToolShell from './ToolShell'
import FileDropzone from './FileDropzone'
import ToolErrorNotice from './ToolErrorNotice'
import { Button, Card } from '@/components/common'

/**
 * Shared scaffold for the file-conversion tools (merge, split, compress,
 * PDF↔Word, images…).
 *
 * Owns the whole flow — pick files, optional options, run, show the result —
 * so each tool page is only its config: which files it accepts, what it runs
 * and how it renders the outcome.
 *
 * @param {string} bucket       FREE_LIMITS bucket ('pdfConversion').
 * @param {(files:File[]) => Promise<any>} run
 * @param {(result:any, api:{reset:() => void}) => React.ReactNode} renderResult
 * @param {React.ReactNode} options  Controls rendered above the run button.
 * @param {React.ReactNode} tips     Right-hand "how it works" column.
 */
export default function DocumentToolPage({
  toolId,
  title,
  blurb,
  icon,
  badge,
  bucket = 'pdfConversion',
  related,
  accept = '.pdf',
  multiple = false,
  minFiles = 1,
  fileLabel = 'File',
  dropHint,
  maxSizeMb = 20,
  options = null,
  tips = null,
  runLabel = 'Run',
  canRun = true,
  run,
  renderResult,
  wide = false,
}) {
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const ready = files.length >= minFiles && canRun && !busy

  async function onRun() {
    setBusy(true)
    setError(null)
    try {
      setResult(await run(files))
    } catch (caught) {
      setError(caught)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setFiles([])
    setResult(null)
    setError(null)
  }

  const body = (
    <>
      <Card>
        <FileDropzone
          label={fileLabel}
          accept={accept}
          multiple={multiple}
          minFiles={minFiles}
          files={files}
          onChange={(next) => {
            setFiles(next)
            setResult(null)
            setError(null)
          }}
          hint={dropHint}
          maxSizeMb={maxSizeMb}
          disabled={busy}
        />

        {options && <div className="mt-4">{options}</div>}

        <div className="mt-4">
          <Button onClick={onRun} loading={busy} disabled={!ready} fullWidth>
            {runLabel}
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          {renderResult(result, { reset, files })}
        </Card>
      )}
    </>
  )

  return (
    <ToolShell
      toolId={toolId}
      title={title}
      blurb={blurb}
      icon={icon}
      badge={badge}
      bucket={bucket}
      related={related}
      wide={wide}
    >
      {tips ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">{body}</div>
          <aside className="lg:pt-1">{tips}</aside>
        </div>
      ) : (
        <div className="max-w-3xl">{body}</div>
      )}
    </ToolShell>
  )
}
