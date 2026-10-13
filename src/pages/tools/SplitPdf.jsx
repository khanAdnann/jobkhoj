import { useState } from 'react'
import { Download } from 'lucide-react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { Select, Input, Button } from '@/components/common'
import { splitPdfFile } from '@/services/documentService'
import { downloadBlob } from '@/utils/download'

export default function SplitPdf() {
  const [mode, setMode] = useState('every')
  const [ranges, setRanges] = useState('1-3, 4-6')

  function buildSpec() {
    if (mode === 'every') return 'all'
    return ranges || 'all'
  }

  const options = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label="Split into"
        options={[
          { value: 'every', label: 'Every page (one file each)' },
          { value: 'ranges', label: 'Page ranges' },
        ]}
        value={mode}
        onChange={(event) => setMode(event.target.value)}
      />
      {mode === 'ranges' && (
        <Input
          label="Ranges"
          value={ranges}
          onChange={(event) => setRanges(event.target.value)}
          hint="e.g. 1-3, 4-6 — one file per group"
          placeholder="1-3, 4-6"
        />
      )}
    </div>
  )

  return (
    <DocumentToolPage
      toolId="split-pdf"
      title="Split PDF"
      blurb="Extract a page range, or split every page into its own small file."
      icon="Scissors"
      accept=".pdf"
      fileLabel="PDF file"
      dropHint="PDF, up to 20 MB"
      options={options}
      runLabel="Split PDF"
      run={async (files) => splitPdfFile(files[0], buildSpec())}
      renderResult={(result, { reset }) => (
        <div>
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">
                {result.parts.length} file{result.parts.length > 1 ? 's' : ''} created
              </p>
              <ul className="mt-3 space-y-2">
                {result.parts.map((part) => {
                  const name = `${result.fileName.replace(/\.pdf$/i, '')}-${part.label}.pdf`
                  return (
                    <li key={name} className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-3.5 py-2.5">
                      <span className="text-sm text-ink-700">
                        {name}
                        <span className="ml-2 text-xs text-ink-400">
                          page{part.pageNumbers.length > 1 ? 's' : ''} {part.pageNumbers.join(', ')}
                        </span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBlob(part.bytes, name, 'application/pdf')}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Save
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="ghost" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>
      )}
    />
  )
}