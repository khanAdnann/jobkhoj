import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { mergePdfs } from '@/services/documentService'

export default function MergePdf() {
  return (
    <DocumentToolPage
      toolId="merge-pdf"
      title="Merge PDF"
      blurb="Combine several PDFs into one file, in the order you drop them."
      icon="Combine"
      accept=".pdf"
      multiple
      minFiles={2}
      fileLabel="PDF files"
      dropHint="Add at least two PDFs — order matches the list"
      runLabel="Merge PDFs"
      run={async (files) => mergePdfs(files)}
      renderResult={(result, { reset, files }) => (
        <FileReady
          result={result}
          mime="application/pdf"
          meta={[
            { label: 'Pages', value: result.pageCount },
            { label: 'Source files', value: files.length },
          ]}
          onReset={reset}
          note="All pages are re-encoded into a single document locally."
        />
      )}
    />
  )
}