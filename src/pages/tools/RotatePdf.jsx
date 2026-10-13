import { useState } from 'react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { Select } from '@/components/common'
import { rotatePdfFile } from '@/services/documentService'

const ANGLES = [
  { id: '90', label: '90° clockwise' },
  { id: '180', label: '180°' },
  { id: '270', label: '90° counter-clockwise' },
]

export default function RotatePdf() {
  const [angle, setAngle] = useState('90')

  const options = (
    <Select
      label="Rotation"
      options={ANGLES.map((item) => ({ value: item.id, label: item.label }))}
      value={angle}
      onChange={(event) => setAngle(event.target.value)}
    />
  )

  return (
    <DocumentToolPage
      toolId="rotate-pdf"
      title="Rotate PDF"
      blurb="Rotate every page of a PDF by 90° or 180° to fix scans and sideways exports."
      icon="RotateCw"
      accept=".pdf"
      fileLabel="PDF file"
      dropHint="PDF, up to 20 MB"
      options={options}
      runLabel="Rotate PDF"
      run={async (files) => rotatePdfFile(files[0], Number(angle))}
      renderResult={(result, { reset }) => (
        <FileReady
          result={result}
          mime="application/pdf"
          meta={[
            { label: 'Angle', value: `${angle}°` },
            { label: 'Pages rotated', value: result.rotatedPages },
          ]}
          onReset={reset}
          note="Rotation metadata is written back into the same pages — re-download the result."
        />
      )}
    />
  )
}