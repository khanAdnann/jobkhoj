import { backendRequired, invalidFile } from './errors.js'
import { textToDocx } from './docx.js'
import { textToPdf } from './pdf.js'

/**
 * Async conversion layer — the only place that touches pdfjs and mammoth.
 *
 * Both libraries are loaded with dynamic `import()` so their weight lands in
 * its own chunk and never in the initial bundle. Everything is browser-first;
 * when a job genuinely needs a server (legacy .doc parsing, raster-level
 * compression) the functions below throw ToolError('BACKEND_REQUIRED') with
 * the endpoint that will serve it, so the UI can say so honestly.
 */

const PDFJS_WORKER = '/pdfjs/pdf.worker.min.mjs'
const PDFJS_FONTS = '/pdfjs/standard_fonts/'

let pdfjsPromise = null

export async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then((mod) => {
      if (typeof document !== 'undefined' && !mod.GlobalWorkerOptions.workerSrc) {
        mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
      }
      return mod
    })
  }
  return pdfjsPromise
}

const toBytes = (input) =>
  input instanceof Uint8Array ? new Uint8Array(input) : new Uint8Array(input)

async function loadDocument(pdfjs, bytes) {
  const params = { data: toBytes(bytes) }
  if (typeof document !== 'undefined') params.standardFontDataUrl = PDFJS_FONTS
  const task = pdfjs.getDocument(params)
  task.onProgress = undefined
  return task.promise
}

/**
 * Text extraction with line reconstruction: pdfjs returns positioned items,
 * so anything sitting on the same baseline is re-joined into one line. This
 * is what makes section-heading detection work on real PDF resumes.
 * @returns {Promise<{text:string, pageCount:number}>}
 */
export async function extractPdfText(bytes, { onProgress } = {}) {
  const pdfjs = await getPdfjs()
  const doc = await loadDocument(pdfjs, bytes)
  const pageLines = []

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber)
      const content = await page.getTextContent()
      const rows = new Map()

      content.items.forEach((item) => {
        if (typeof item.str !== 'string') return
        const y = Math.round(item.transform?.[5] ?? 0)
        if (!rows.has(y)) rows.set(y, [])
        rows.get(y).push(item.str)
      })

      ;[...rows.keys()]
        .sort((a, b) => b - a)
        .forEach((y) => pageLines.push(rows.get(y).join(' ').replace(/\s+/g, ' ').trim()))
      pageLines.push('')

      onProgress?.({ stage: 'extract', progress: pageNumber / doc.numPages, pageNumber })
    }
  } finally {
    if (typeof doc.destroy === 'function') await doc.destroy()
  }

  return { text: pageLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(), pageCount: doc.numPages }
}

export async function extractDocxText(bytes) {
  const mammoth = await import('mammoth')
  const api = mammoth.default ?? mammoth
  const buffer = toBytes(bytes).buffer
  // Node's unzip.js wants `buffer`, the browser build wants `arrayBuffer`.
  // Sending both means the same call works whichever entry Vite/esbuild picks.
  const result = await api.extractRawText({ arrayBuffer: buffer, buffer })
  return String(result?.value ?? '')
}

/** Dispatches by file extension — shared by ATS, keyword and optimizer tools. */
export async function extractResumeText(bytes, fileName = '') {
  const name = String(fileName).toLowerCase()
  const input = toBytes(bytes)

  if (name.endsWith('.pdf') || input[0] === 0x25) {
    const { text } = await extractPdfText(input)
    if (!text.trim()) {
      throw invalidFile(
        'No selectable text in this PDF. If it is a scan, paste the text instead or upload a DOCX.',
      )
    }
    return text
  }

  if (name.endsWith('.docx')) {
    const text = await extractDocxText(input)
    if (!text.trim()) throw invalidFile('This DOCX contains no readable text.')
    return text
  }

  if (name.endsWith('.txt')) {
    return new TextDecoder().decode(input)
  }

  if (name.endsWith('.doc')) {
    throw backendRequired(
      'Legacy .doc files use a binary format that browsers cannot parse. Convert it to .docx, paste the text, or connect the document backend.',
      'POST /api/tools/convert/doc-to-text',
      'LibreOffice-backed conversion runs server-side.',
    )
  }

  throw invalidFile('Unsupported file type. Upload PDF, DOCX or TXT.')
}

export async function pdfToDocx(bytes, title = 'Converted document') {
  const { text } = await extractPdfText(bytes)
  if (!text.trim()) {
    throw invalidFile('This PDF has no extractable text layer — it may be a scan.')
  }
  return { bytes: await textToDocx(title, text), fileName: safeName(title) + '.docx', text }
}

export async function docxToPdf(bytes, title = 'Converted document') {
  const text = await extractDocxText(bytes)
  if (!text.trim()) throw invalidFile('This document has no readable text.')
  return {
    bytes: await textToPdf(title, text.split(/\r?\n/)),
    fileName: safeName(title) + '.pdf',
    text,
  }
}

export async function pdfToPlainText(bytes) {
  const { text } = await extractPdfText(bytes)
  return text
}

/**
 * Renders pages to images (browser only — needs a canvas).
 * @returns {Promise<Array<{pageNumber:number, blob:Blob, url:string}>>}
 */
export async function renderPdfToImages(bytes, options = {}) {
  if (typeof document === 'undefined') {
    throw backendRequired(
      'Page rendering needs a browser or the document backend.',
      'POST /api/tools/pdf/render',
    )
  }

  const { format = 'jpeg', quality = 0.92, scale = 2, pages = null, onProgress } = options
  const pdfjs = await getPdfjs()
  const doc = await loadDocument(pdfjs, bytes)
  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  const results = []

  try {
    const targets = pages?.length ? pages : Array.from({ length: doc.numPages }, (_, i) => i + 1)

    for (const [index, pageNumber] of targets.entries()) {
      if (pageNumber < 1 || pageNumber > doc.numPages) continue
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({ canvasContext: context, viewport }).promise
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
      results.push({ pageNumber, blob, url: URL.createObjectURL(blob) })

      onProgress?.({ stage: 'render', progress: (index + 1) / targets.length, pageNumber })
      canvas.width = 0
      canvas.height = 0
    }
  } finally {
    if (typeof doc.destroy === 'function') await doc.destroy()
  }

  return results
}

/** WEBP/HEIC-safe normalisation: anything that is not JPEG/PNG becomes PNG. */
export async function normaliseImage(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = file.type || ''

  if (mime === 'image/jpeg' || mime === 'image/png') {
    return { bytes, mime: mime === 'image/jpeg' ? 'image/jpeg' : 'image/png', width: 0, height: 0 }
  }

  if (typeof document === 'undefined') {
    throw backendRequired(
      `${mime || 'This image'} needs server-side conversion.`,
      'POST /api/tools/images/convert',
    )
  }

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    mime: 'image/png',
    width: bitmap.width,
    height: bitmap.height,
  }
}

/** Reads image dimensions without decoding pixels when headers allow it. */
export function imageSize(bytes, mime) {
  try {
    if (mime === 'image/png' && bytes[0] === 0x89) {
      return { width: readU32(bytes, 16), height: readU32(bytes, 20) }
    }
    if (mime === 'image/jpeg') {
      let offset = 2
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) break
        const marker = bytes[offset + 1]
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: (bytes[offset + 5] << 8) | bytes[offset + 6], width: (bytes[offset + 7] << 8) | bytes[offset + 8] }
        }
        offset += 2 + length
      }
    }
  } catch {
    /* fall through */
  }
  return { width: 0, height: 0 }
}

function readU32(bytes, offset) {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  )
}

function safeName(value) {
  return (
    String(value)
      .replace(/\.pdf$/i, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'document'
  )
}

export default {
  extractPdfText,
  extractDocxText,
  extractResumeText,
  pdfToDocx,
  docxToPdf,
  pdfToPlainText,
  renderPdfToImages,
  normaliseImage,
}
