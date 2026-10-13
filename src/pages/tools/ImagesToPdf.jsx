import { useState } from 'react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { FileReady } from '@/components/tools/DocumentResult'
import { Select } from '@/components/common'
import { imagesToPdfFile } from '@/services/documentService'

const PAGE_SIZES = [
  { id: 'a4', label: 'A4' },
  { id: 'letter', label: 'Letter' },
]

const ORIENTATIONS = [
  { id: 'auto', label: 'Auto' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'landscape', label: 'Landscape' },
]

const PER_PAGE = [
  { id: '1', label: '1 image per page' },
  { id: '2', label: '2 images per page' },
  { id: '4', label: '4 images per page' },
]

export default function ImagesToPdf() {
  const [pageSize, setPageSize] = useState('a4')
  const [orientation, setOrientation] = useState('auto')
  const [perPage, setPerPage] = useState('1')

  const options = (
    <div className="grid gap-4 sm:grid-cols-3">
      <Select
        label="Page size"
        options={PAGE_SIZES.map((item) => ({ value: item.id, label: item.label }))}
        value={pageSize}
        onChange={(event) => setPageSize(event.target.value)}
      />
      <Select
        label="Orientation"
        options={ORIENTATIONS.map((item) => ({ value: item.id, label: item.label }))}
        value={orientation}
        onChange={(event) => setOrientation(event.target.value)}
      />
      <Select
        label="Layout"
        options={PER_PAGE.map((item) => ({ value: item.id, label: item.label }))}
        value={perPage}
        onChange={(event) => setPerPage(event.target.value)}
      />
    </div>
  )

  return (
    <DocumentToolPage
      toolId="images-to-pdf"
      title="Images to PDF"
      blurb="Drop JPG, PNG or WEBP images and combine them into a single PDF — order follows the list."
      icon="FileImage"
      accept=".jpg,.jpeg,.png,.webp"
      multiple
      minFiles={1}
      fileLabel="Images"
      dropHint="JPG, PNG or WEBP — up to 20 MB each"
      options={options}
      runLabel="Create PDF"
      run={async (files) =>
        imagesToPdfFile(files, { pageSize, orientation, perPage: Number(perPage) })
      }
      renderResult={(result, { reset, files }) => (
        <FileReady
          result={result}
          mime="application/pdf"
          meta={[
            { label: 'Pages', value: result.pageCount },
            { label: 'Images', value: files.length },
          ]}
          onReset={reset}
          note="Images are re-embedded into a fresh PDF in your browser — nothing is uploaded."
        />
      )}
    />
  )
}