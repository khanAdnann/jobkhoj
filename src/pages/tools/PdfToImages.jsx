import { useState } from 'react'
import { Download } from 'lucide-react'
import DocumentToolPage from '@/components/tools/DocumentToolPage'
import { Select } from '@/components/common'
import { pdfToImages } from '@/services/documentService'
import { downloadBlob } from '@/utils/download'

export default function PdfToImages() {
  const [format, setFormat] = useState('jpeg')

  const options = (
    <Select
      label="Image format"
      options={[
        { value: 'jpeg', label: 'JPG (smaller)' },
        { value: 'png', label: 'PNG (crisper)' },
      ]}
      value={format}
      onChange={(event) => setFormat(event.target.value)}
    />
  )

  return (
    <DocumentToolPage
      toolId="pdf-to-images"
      title="PDF to Images"
      blurb="Render every page as a JPG or PNG — preview each page and download them individually."
      icon="Images"
      accept=".pdf"
      fileLabel="PDF file"
      dropHint="PDF, up to 20 MB"
      options={options}
      runLabel="Render pages"
      run={async (files) => pdfToImages(files[0], { format })}
      renderResult={(result, { reset }) => (
        <div>
          <p className="mb-4 text-sm font-semibold text-ink-900">
            {result.images.length} page{result.images.length > 1 ? 's' : ''} rendered as{' '}
            {format.toUpperCase()}
          </p>

          <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3">
            {result.images.map((image) => (
              <figure key={image.pageNumber} className="overflow-hidden rounded-lg border border-ink-200">
                <img
                  src={image.url}
                  alt={`Page ${image.pageNumber}`}
                  loading="lazy"
                  className="h-40 w-full bg-ink-100 object-contain"
                />
                <figcaption className="flex items-center justify-between gap-2 border-t border-ink-200 px-3 py-2">
                  <span className="text-xs font-medium text-ink-600">Page {image.pageNumber}</span>
                  <button
                    type="button"
                    onClick={() => downloadBlob(image.blob, `${result.fileName}-page-${image.pageNumber}.${format === 'jpeg' ? 'jpg' : 'png'}`)}
                    aria-label={`Download page ${image.pageNumber}`}
                    className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() =>
                result.images.forEach((image) =>
                  downloadBlob(image.blob, `${result.fileName}-page-${image.pageNumber}.${format === 'jpeg' ? 'jpg' : 'png'}`),
                )
              }
              className="text-sm font-semibold text-brand-600 underline-offset-2 hover:underline"
            >
              Download all {result.images.length} pages
            </button>
            <span className="mx-3 text-ink-300">·</span>
            <button
              type="button"
              onClick={reset}
              className="text-sm font-semibold text-ink-500 underline-offset-2 hover:underline"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    />
  )
}