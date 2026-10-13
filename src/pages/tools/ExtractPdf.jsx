import { useState } from 'react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { Input } from '@/components/common'
import { extractPdfPages } from '@/services/documentService'

export default function ExtractPdf() {
  const [pages, setPages] = useState('1')

  const options = (
    <Input
      label="Pages to extract"
      value={pages}
      onChange={(event) => setPages(event.target.value)}
      hint="e.g. 1-3, 5 — 1-based page numbers"
      placeholder="1-3, 5"
    />
  )

  return (
    <DocumentToolPage
      toolId="extract-pdf"
      title="Extract PDF Pages"
      blurb="Pick the exact pages you need and export them as a new PDF."
      icon="ListFilter"
      accept=".pdf"
      fileLabel="PDF file"
      dropHint="PDF, up to 20 MB"
      options={options}
      runLabel="Extract pages"
      run={async (files) => extractPdfPages(files[0], pages)}
      renderResult={(result, { reset }) => (
        <FileReady
          result={result}
          mime="application/pdf"
          meta={[{ label: 'Pages', value: result.pageNumbers.join(', ') }]}
          onReset={reset}
          note="Only the selected pages are copied into the new document."
        />
      )}
    />
  )
}