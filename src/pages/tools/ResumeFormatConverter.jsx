import { useState } from 'react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady, TextReady } from '@/components/tools/DocumentResult'
import { Select } from '@/components/common'
import { convertResumeFormat } from '@/services/documentService'

const TARGETS = [
  { id: 'text', label: 'Resume to plain text' },
  { id: 'docx', label: 'PDF to DOCX' },
  { id: 'pdf', label: 'DOCX to PDF' },
]

export default function ResumeFormatConverter() {
  const [target, setTarget] = useState('text')

  const options = (
    <Select
      label="Convert to"
      options={TARGETS.map((item) => ({ value: item.id, label: item.label }))}
      value={target}
      onChange={(event) => setTarget(event.target.value)}
    />
  )

  return (
    <DocumentToolPage
      toolId="resume-format-converter"
      title="Resume Format Converter"
      blurb="Switch your resume between PDF, Word and clean plain text — ideal before an ATS scan."
      icon="RefreshCcw"
      accept=".pdf,.docx,.doc"
      fileLabel="Resume file"
      dropHint="PDF, DOCX or DOC — up to 20 MB"
      options={options}
      runLabel="Convert resume"
      run={async (files) => convertResumeFormat(files[0], target)}
      renderResult={(result, { reset }) => {
        if (target === 'text') {
          return (
            <TextReady
              text={result.text}
              fileName={result.fileName}
              onReset={reset}
              note="Text extraction runs in your browser — privacy-safe for sensitive resumes."
            />
          )
        }
        return (
          <FileReady
            result={result}
            mime={
              target === 'docx'
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/pdf'
            }
            onReset={reset}
            note={
              target === 'docx'
                ? 'Text layer conversion — flows and tables need the document backend.'
                : 'Built from the Word text in your browser.'
            }
          />
        )
      }}
    />
  )
}