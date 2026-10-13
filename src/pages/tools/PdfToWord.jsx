import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { convertPdfToWord } from '@/services/documentService'

export default function PdfToWord() {
  return (
    <DocumentToolPage
      toolId="pdf-to-word"
      title="PDF to Word"
      blurb="Convert a PDF into an editable DOCX document — text stays clean, paragraphs stay paragraphs."
      icon="FileOutput"
      badge="AI-ready"
      accept=".pdf"
      fileLabel="PDF file"
      dropHint="PDF, up to 20 MB — parsed locally"
      runLabel="Convert to Word"
      run={async (files) => convertPdfToWord(files[0])}
      renderResult={(result, { reset }) => (
        <FileReady
          result={result}
          mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          meta={[{ label: 'Format', value: 'Editable DOCX' }]}
          onReset={reset}
          note={
            result.text
              ? 'Recovered from the PDF text layer in your browser — no upload involved.'
              : 'Text-only conversion — image-heavy PDFs need the document backend.'
          }
        />
      )}
    />
  )
}