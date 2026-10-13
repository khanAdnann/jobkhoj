import { useState } from 'react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { Select } from '@/components/common'
import { compressPdfFile } from '@/services/documentService'
import { formatBytes } from '@/utils/format'

const LEVELS = [
  { id: 'low', label: 'Light (fast)' },
  { id: 'medium', label: 'Balanced' },
  { id: 'high', label: 'Maximum' },
]

export default function CompressPdf() {
  const [level, setLevel] = useState('medium')

  const options = (
    <Select
      label="Compression level"
      options={LEVELS.map((item) => ({ value: item.id, label: item.label }))}
      value={level}
      onChange={(event) => setLevel(event.target.value)}
      hint="Higher levels re-encode structure more aggressively."
    />
  )

  return (
    <DocumentToolPage
      toolId="compress-pdf"
      title="Compress PDF"
      blurb="Reduce file size by re-encoding the document structure — see the real savings, not a promise."
      icon="Minimize2"
      accept=".pdf"
      fileLabel="PDF file"
      dropHint="PDF, up to 20 MB"
      options={options}
      runLabel="Compress PDF"
      run={async (files) => compressPdfFile(files[0], level)}
      renderResult={(result, { reset }) => (
        <FileReady
          result={result}
          mime="application/pdf"
          meta={[
            { label: 'Before', value: formatBytes(result.originalSize) },
            { label: 'After', value: formatBytes(result.compressedSize) },
            { label: 'Saved', value: `${result.reduction}%` },
          ]}
          onReset={reset}
          note={
            result.needsBackend
              ? 'Structural compression only — image-heavy PDFs would need a rendering backend for bigger savings.'
              : 'Compressed in your browser from the original bytes.'
          }
        />
      )}
    />
  )
}