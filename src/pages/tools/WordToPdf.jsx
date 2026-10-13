import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { convertWordToPdf } from '@/services/documentService'

export default function WordToPdf() {
  return (
    <DocumentToolPage
      toolId="word-to-pdf"
      title="Word to PDF"
      blurb="Turn a DOCX file into a clean, shareable PDF that renders identically everywhere."
      icon="FileInput"
      accept=".doc,.docx"
      fileLabel="Word file"
      dropHint="DOCX recommended — legacy .doc needs the document backend"
      runLabel="Convert to PDF"
      run={async (files) => convertWordToPdf(files[0])}
      renderResult={(result, { reset }) => (
        <FileReady
          result={result}
          mime="application/pdf"
          meta={[{ label: 'Format', value: 'PDF' }]}
          onReset={reset}
          note="Built from the raw document text in your browser — nothing is uploaded."
        />
      )}
    />
  )
}