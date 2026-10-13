import { api, request, isMockMode } from './api'
import * as pdf from '@/tools/engine/pdf.js'
import * as convert from '@/tools/engine/convert.js'
import { ToolError } from '@/tools/engine/errors.js'
import * as tools from './toolsService'

/**
 * Document tools service — the seam between the UI and file processing.
 *
 * Live contract (Spring Boot, multipart in / binary or base64 out):
 *   POST /api/tools/documents/merge      files[]            -> { base64, pageCount }
 *   POST /api/tools/documents/split      file, spec         -> { parts: [{ label, base64 }] }
 *   POST /api/tools/documents/extract    file, pages        -> { base64, pageNumbers }
 *   POST /api/tools/documents/rotate     file, angle, pages -> { base64, rotatedPages }
 *   POST /api/tools/documents/compress   file, level        -> { base64, originalSize, compressedSize }
 *   POST /api/tools/documents/pdf-word   file               -> { base64, fileName, text }
 *   POST /api/tools/documents/word-pdf   file               -> { base64, fileName }
 *   POST /api/tools/documents/pdf-images file, options      -> { zipBase64, pageCount }
 *   POST /api/tools/documents/images-pdf files, options     -> { base64, pageCount }
 *
 * With VITE_API_MODE=mock the local engines run instead — same return shape,
 * so no component ever cares which one answered.
 */
export const DOCUMENT_ENDPOINTS = {
  merge: '/api/tools/documents/merge',
  split: '/api/tools/documents/split',
  extract: '/api/tools/documents/extract',
  rotate: '/api/tools/documents/rotate',
  compress: '/api/tools/documents/compress',
  pdfToWord: '/api/tools/documents/pdf-word',
  wordToPdf: '/api/tools/documents/word-pdf',
  pdfToImages: '/api/tools/documents/pdf-images',
  imagesToPdf: '/api/tools/documents/images-pdf',
}

const toU8 = (value) => {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (value?.base64) return base64ToBytes(value.base64)
  return value
}

export function base64ToBytes(base64) {
  const binary = typeof atob === 'function'
    ? atob(base64)
    : globalThis.Buffer.from(base64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function bytesToBase64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (typeof btoa === 'function') {
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < u8.length; i += chunk) {
      binary += String.fromCharCode(...u8.subarray(i, i + chunk))
    }
    return btoa(binary)
  }
  return globalThis.Buffer.from(u8).toString('base64')
}

function fileBlob(file) {
  return new Blob([file.bytes], { type: file.mime ?? 'application/pdf' })
}

function postFiles(endpoint, files, extra = {}) {
  const form = new FormData()
  files.forEach((file, index) => {
    form.append('files', fileBlob(file), file.name ?? `file-${index + 1}.pdf`)
  })
  Object.entries(extra).forEach(([key, value]) => {
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  })
  return api.post(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'arraybuffer',
    timeout: 60_000,
  })
}

function postJson(endpoint, payload) {
  return api.post(endpoint, payload, { timeout: 60_000 })
}

/**
 * Free-run check, called BEFORE any processing so an exhausted user gets a
 * clear upgrade message instead of a half-finished file.
 */
const guard = () => tools.checkUsage('pdfConversion')

/** Consumes one run + writes the history entry once the work succeeded. */
function finish({ toolId, tool, fileName, summary, meta = {} }) {
  tools.consumeUsage('pdfConversion')
  return tools.recordHistory({
    toolId,
    tool,
    fileName,
    summary,
    status: 'Completed',
    ...meta,
  })
}

const fileInput = async (file) => ({
  name: file.name,
  mime: file.type || 'application/pdf',
  bytes: new Uint8Array(await file.arrayBuffer()),
})

/* --------------------------------- reads --------------------------------- */

/** Page count / metadata for the file preview card. */
export async function readPdfInfo(file) {
  const input = await fileInput(file)
  return request(
    () => postJson('/api/tools/documents/info', { fileName: input.name }),
    () => pdf.readPdfMeta(input.bytes),
  )
}

export async function extractText(file) {
  const input = await fileInput(file)
  return convert.extractResumeText(input.bytes, input.name)
}

/* --------------------------------- writes -------------------------------- */

export async function mergePdfs(files = []) {
  if (files.length < 2) throw new ToolError('Select at least two PDF files to merge.', { code: 'INVALID_FILE' })
  guard()
  const inputs = await Promise.all(files.map(fileInput))

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.merge, inputs),
    () => pdf.mergePdfs(inputs.map((input) => input.bytes)),
  )
  const bytes = toU8(result)

  finish({
    toolId: 'merge-pdf',
    tool: 'Merge PDF',
    fileName: inputs.map((input) => input.name).join(', '),
    summary: `Combined ${inputs.length} files`,
  })

  return { bytes, fileName: 'merged.pdf', pageCount: (await pdf.readPdfMeta(bytes)).pageCount }
}

export async function splitPdfFile(file, spec) {
  guard()
  const input = await fileInput(file)

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.split, [input], { spec }),
    () => pdf.splitPdf(input.bytes, spec),
  )

  const parts = Array.isArray(result) ? result : []
  const mapped = parts.map((part) => ({ ...part, bytes: toU8(part.bytes) }))
  if (!mapped.length) throw new ToolError('No valid pages matched that range.', { code: 'INVALID_FILE' })

  finish({
    toolId: 'split-pdf',
    tool: 'Split PDF',
    fileName: input.name,
    summary: `Split into ${mapped.length} file${mapped.length > 1 ? 's' : ''}`,
  })

  return { parts: mapped, fileName: input.name }
}

export async function extractPdfPages(file, spec) {
  guard()
  const input = await fileInput(file)

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.extract, [input], { spec }),
    () => pdf.extractPages(input.bytes, spec),
  )

  const bytes = toU8(result.bytes ?? result)
  const pageNumbers = result.pageNumbers ?? []
  const base = input.name.replace(/\.pdf$/i, '')

  finish({
    toolId: 'extract-pdf',
    tool: 'Extract PDF Pages',
    fileName: input.name,
    summary: `Extracted page${pageNumbers.length > 1 ? 's' : ''} ${pageNumbers.join(', ')}`,
  })

  return { bytes, pageNumbers, fileName: `${base}-pages.pdf` }
}

export async function rotatePdfFile(file, angle, pageNumbers = null) {
  guard()
  const input = await fileInput(file)

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.rotate, [input], { angle, pages: pageNumbers ?? [] }),
    () => pdf.rotatePdf(input.bytes, angle, pageNumbers),
  )

  const bytes = toU8(result.bytes ?? result)
  const base = input.name.replace(/\.pdf$/i, '')

  finish({
    toolId: 'rotate-pdf',
    tool: 'Rotate PDF',
    fileName: input.name,
    summary: `Rotated ${result.rotatedPages ?? 'all'} page(s) by ${angle}°`,
  })

  return { bytes, fileName: `${base}-rotated.pdf`, rotatedPages: result.rotatedPages }
}

export async function compressPdfFile(file, level = 'medium') {
  guard()
  const input = await fileInput(file)

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.compress, [input], { level }),
    () => pdf.compressPdf(input.bytes, level),
  )

  const bytes = toU8(result.bytes ?? result)
  const base = input.name.replace(/\.pdf$/i, '')

  finish({
    toolId: 'compress-pdf',
    tool: 'Compress PDF',
    fileName: input.name,
    summary: `${result.originalSize} → ${result.compressedSize} bytes (${result.reduction}%)`,
  })

  return {
    bytes,
    fileName: `${base}-compressed.pdf`,
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    reduction: result.reduction,
    needsBackend: result.needsBackend ?? false,
    pageCount: result.pageCount,
  }
}

export async function convertPdfToWord(file) {
  guard()
  const input = await fileInput(file)

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.pdfToWord, [input]),
    () => convert.pdfToDocx(input.bytes, input.name.replace(/\.pdf$/i, '')),
  )

  const bytes = toU8(result.bytes ?? result)

  finish({
    toolId: 'pdf-to-word',
    tool: 'PDF to Word',
    fileName: input.name,
    summary: `Created ${result.fileName ?? 'document.docx'}`,
  })

  return { bytes, fileName: result.fileName ?? 'document.docx', text: result.text ?? null }
}

export async function convertWordToPdf(file) {
  guard()
  const input = await fileInput(file)
  const isLegacyDoc = /\.doc$/i.test(input.name)

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.wordToPdf, [input]),
    async () => {
      if (isLegacyDoc) {
        throw new ToolError(
          'Legacy .doc uses a binary format browsers cannot read. Save it as .docx first, or connect the document backend.',
          { code: 'BACKEND_REQUIRED', endpoint: DOCUMENT_ENDPOINTS.wordToPdf },
        )
      }
      return convert.docxToPdf(input.bytes, input.name.replace(/\.docx$/i, ''))
    },
  )

  const bytes = toU8(result.bytes ?? result)

  finish({
    toolId: 'word-to-pdf',
    tool: 'Word to PDF',
    fileName: input.name,
    summary: `Created ${result.fileName ?? 'document.pdf'}`,
  })

  return { bytes, fileName: result.fileName ?? 'document.pdf', text: result.text ?? null }
}

/**
 * Renders pages to JPG/PNG in the browser (canvas), or a ZIP from the
 * backend in live mode.
 * @returns {Promise<{images:Array<{pageNumber:number,blob:Blob,url:string}>, pageCount:number, fileName:string}>}
 */
export async function pdfToImages(file, options = {}) {
  guard()
  const input = await fileInput(file)

  const images = await convert.renderPdfToImages(input.bytes, options)

  finish({
    toolId: 'pdf-to-images',
    tool: 'PDF to Images',
    fileName: input.name,
    summary: `Rendered ${images.length} page${images.length > 1 ? 's' : ''} as ${(options.format ?? 'jpeg').toUpperCase()}`,
  })

  return {
    images,
    pageCount: images.length,
    fileName: input.name.replace(/\.pdf$/i, ''),
  }
}

export async function imagesToPdfFile(files = [], options = {}) {
  guard()
  const inputs = await Promise.all(
    files.map(async (file) => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      return { ...file, bytes }
    }),
  )

  const result = await request(
    () => postFiles(DOCUMENT_ENDPOINTS.imagesToPdf, inputs, options),
    async () => {
      const normalised = await Promise.all(
        inputs.map(async (item) => {
          const converted = await convert.normaliseImage(item)
          const size = convert.imageSize(converted.bytes, converted.mime)
          return { bytes: converted.bytes, mime: converted.mime, ...size }
        }),
      )
      return pdf.imagesToPdf(normalised, options)
    },
  )

  const bytes = toU8(result)

  finish({
    toolId: 'images-to-pdf',
    tool: 'Images to PDF',
    fileName: inputs.map((item) => item.name).join(', '),
    summary: `Combined ${inputs.length} image${inputs.length > 1 ? 's' : ''} into a PDF`,
  })

  return { bytes, fileName: 'images.pdf', pageCount: (await pdf.readPdfMeta(bytes)).pageCount }
}

/** Resume-format conversion hub (PDF→DOCX, DOCX→PDF, →plain text). */
export async function convertResumeFormat(file, target) {
  guard()
  const input = await fileInput(file)

  if (target === 'text') {
    const text = await convert.extractResumeText(input.bytes, input.name)
    finish({
      toolId: 'resume-format-converter',
      tool: 'Resume Format Converter',
      fileName: input.name,
      summary: 'Converted to plain text',
    })
    return { text, fileName: input.name.replace(/\.[^.]+$/, '') + '.txt', bytes: null }
  }

  if (target === 'docx') {
    const result = await convert.pdfToDocx(input.bytes, input.name.replace(/\.pdf$/i, ''))
    finish({
      toolId: 'resume-format-converter',
      tool: 'Resume Format Converter',
      fileName: input.name,
      summary: 'Converted to DOCX',
    })
    return { ...result, bytes: toU8(result.bytes) }
  }

  const result = await convertWordToPdf(file)
  return { ...result, from: 'docx' }
}

/** Whether file bytes are currently handled locally or sent to Spring Boot. */
export function describeProcessingMode() {
  return isMockMode()
    ? {
        mode: 'local',
        note: 'Files are processed in your browser — nothing is uploaded.',
      }
    : { mode: 'backend', note: `Files are processed by ${api.defaults.baseURL}.` }
}

export default {
  readPdfInfo,
  mergePdfs,
  splitPdfFile,
  extractPdfPages,
  rotatePdfFile,
  compressPdfFile,
  convertPdfToWord,
  convertWordToPdf,
  pdfToImages,
  imagesToPdfFile,
  convertResumeFormat,
}
