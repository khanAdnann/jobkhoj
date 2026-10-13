import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib'

/**
 * Client-side PDF operations.
 *
 * Everything here runs on pdf-lib in the browser (or Node, for tests) — no
 * upload, no server. Each function takes and returns raw bytes so the same
 * code can be swapped for a REST call later without touching a component.
 */

export const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
}

const clampPages = (value, total) => Math.min(Math.max(1, value), total)

export async function loadPdf(bytes) {
  return PDFDocument.load(bytes, { updateMetadata: false })
}

export async function readPdfMeta(bytes) {
  const doc = await loadPdf(bytes)
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle() ?? null,
    author: doc.getAuthor() ?? null,
    producer: doc.getProducer() ?? null,
  }
}

export async function mergePdfs(pdfList = []) {
  if (pdfList.length < 2) throw new Error('Select at least two PDF files to merge.')
  const merged = await PDFDocument.create()

  for (const bytes of pdfList) {
    const source = await loadPdf(bytes)
    const pages = await merged.copyPages(source, source.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
  }

  const output = await merged.save({ useObjectStreams: true })
  return new Uint8Array(output)
}

/**
 * Parses a page specification such as "1-3, 5, 8-10".
 * @returns {number[]} 1-based page numbers, order preserved, duplicates dropped
 */
export function parsePageRanges(spec, pageCount) {
  const raw = String(spec ?? '').trim()
  if (!raw || /^(all|full|entire)$/i.test(raw)) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const results = []
  for (const chunk of raw.split(',')) {
    const part = chunk.trim()
    if (!part) continue

    const range = part.match(/^(\d+)\s*(?:-|–|to|through|thru)\s*(\d+)$/i)
    if (range) {
      let from = Number(range[1])
      let to = Number(range[2])
      if (from > to) [from, to] = [to, from]
      for (let page = from; page <= to; page += 1) {
        if (page >= 1 && page <= pageCount) results.push(page)
      }
      continue
    }

    const single = Number(part)
    if (Number.isInteger(single) && single >= 1 && single <= pageCount) results.push(single)
  }

  return [...new Set(results)]
}

async function copySelected(sourceDoc, targetDoc, pageNumbers) {
  const selected = pageNumbers.map((page) => clampPages(page, sourceDoc.getPageCount()) - 1)
  const copies = await targetDoc.copyPages(sourceDoc, selected)
  copies.forEach((page) => targetDoc.addPage(page))
}

/** Splits a PDF according to a spec: "1-3, 4-6" → one file per comma group. */
export async function splitPdf(bytes, spec) {
  const source = await loadPdf(bytes)
  const pageCount = source.getPageCount()
  const rawGroups = String(spec ?? '')
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean)

  // A pure range spec ("1-3, 5-7") splits per group; a flat list groups
  // every number into its own file.
  const hasRange = rawGroups.some((group) => /\d\s*(?:-|–|to)\s*\d/i.test(group))

  const groups = hasRange
    ? rawGroups
    : parsePageRanges(spec, pageCount).map((page) => String(page))

  const parts = []
  for (const [index, group] of groups.entries()) {
    const pageNumbers = parsePageRanges(group, pageCount)
    if (!pageNumbers.length) continue

    const target = await PDFDocument.create()
    await copySelected(source, target, pageNumbers)
    const output = await target.save({ useObjectStreams: true })

    parts.push({
      label: hasRange ? `pages-${group.replace(/\s+/g, '')}` : `page-${pageNumbers[0]}`,
      pageNumbers,
      bytes: new Uint8Array(output),
      index,
    })
  }

  if (!parts.length) throw new Error('No valid pages matched that range.')
  return parts
}

export async function extractPages(bytes, spec) {
  const source = await loadPdf(bytes)
  const pageNumbers = parsePageRanges(spec, source.getPageCount())
  if (!pageNumbers.length) throw new Error('No valid pages selected.')

  const target = await PDFDocument.create()
  await copySelected(source, target, pageNumbers)
  const output = await target.save({ useObjectStreams: true })
  return { bytes: new Uint8Array(output), pageNumbers }
}

/** Rotates every page, or only the 1-based `pageNumbers` given. */
export async function rotatePdf(bytes, angle, pageNumbers = null) {
  const doc = await loadPdf(bytes)
  const total = doc.getPageCount()
  const targets = pageNumbers?.length
    ? pageNumbers.map((page) => clampPages(page, total) - 1)
    : doc.getPageIndices()

  const normalised = ((Number(angle) % 360) + 360) % 360
  targets.forEach((index) => {
    const page = doc.getPage(index)
    page.setRotation(degrees((page.getRotation().angle + normalised) % 360))
  })

  const output = await doc.save({ useObjectStreams: true })
  return { bytes: new Uint8Array(output), rotatedPages: targets.length }
}

/**
 * Structural re-save: object streams, stripped document metadata and no
 * gratuitous producer stamp. Real, measured savings — the UI must show the
 * actual numbers rather than a promised percentage, because image-level
 * recompression needs a rendering pipeline on the backend.
 */
export async function compressPdf(bytes, level = 'medium') {
  const originalSize = bytes.byteLength ?? bytes.length

  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
  doc.setTitle('')
  doc.setAuthor('')
  doc.setSubject('')
  doc.setKeywords([])
  doc.setCreator('')
  doc.setProducer('')

  const output = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: level === 'low' ? 50 : 200,
  })

  const compressedSize = output.byteLength
  const reduction = originalSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  return {
    bytes: new Uint8Array(output),
    originalSize,
    compressedSize,
    reduction,
    level,
    /** True when further reduction needs server-side rendering. */
    needsBackend: reduction <= 2,
    pageCount: doc.getPageCount(),
  }
}

/**
 * Builds a PDF from images. WEBP is normalised to PNG by the caller (canvas),
 * because pdf-lib embeds JPEG/PNG natively.
 * @param {Array<{bytes:Uint8Array,mime:string,name?:string}>} images
 */
export async function imagesToPdf(images = [], options = {}) {
  if (!images.length) throw new Error('Add at least one image.')

  const pageSize = PAGE_SIZES[options.pageSize] ?? PAGE_SIZES.a4
  const perPage = Number(options.perPage) || 1
  const doc = await PDFDocument.create()

  for (let index = 0; index < images.length; index += perPage) {
    const slice = images.slice(index, index + perPage)
    const landscape =
      options.orientation === 'landscape' ||
      (options.orientation === 'auto' && slice.some((image) => image.width > image.height))
    const [width, height] = landscape ? [pageSize[1], pageSize[0]] : pageSize
    const page = doc.addPage([width, height])

    const margin = 24
    const gap = 12
    const columns = slice.length > 1 ? 2 : 1
    const rows = Math.ceil(slice.length / columns)
    const cellWidth = (width - margin * 2 - gap * (columns - 1)) / columns
    const cellHeight = (height - margin * 2 - gap * (rows - 1)) / rows

    for (const [cellIndex, image] of slice.entries()) {
      const embedded = image.mime === 'image/png'
        ? await doc.embedPng(image.bytes)
        : await doc.embedJpg(image.bytes)

      const scale = Math.min(cellWidth / embedded.width, cellHeight / embedded.height, 1)
      const drawWidth = embedded.width * scale
      const drawHeight = embedded.height * scale
      const column = cellIndex % columns
      const row = Math.floor(cellIndex / columns)

      const x = margin + column * (cellWidth + gap) + (cellWidth - drawWidth) / 2
      const y =
        height - margin - row * (cellHeight + gap) - (cellHeight - drawHeight) / 2 - drawHeight

      page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight })
    }
  }

  const output = await doc.save({ useObjectStreams: true })
  return new Uint8Array(output)
}

/**
 * Text → PDF, used by the Word→PDF and Resume→Text paths where only plain
 * text survived the conversion. Layout is deliberately simple and readable.
 */
export async function textToPdf(title, lines = [], options = {}) {
  const doc = await PDFDocument.create()
  const pageWidth = (PAGE_SIZES[options.pageSize] ?? PAGE_SIZES.a4)[0]
  const pageHeight = (PAGE_SIZES[options.pageSize] ?? PAGE_SIZES.a4)[1]
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const margin = 56
  const fontSize = 10.5
  const lineHeight = 14.5
  const maxWidth = pageWidth - margin * 2

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const wrap = (text, maxWidthPx) => {
    const words = String(text).split(/\s+/)
    const outLines = []
    let current = ''
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidthPx && current) {
        outLines.push(current)
        current = word
      } else {
        current = candidate
      }
    })
    if (current) outLines.push(current)
    return outLines.length ? outLines : ['']
  }

  const emit = (text, { bold: isBold = false, size = fontSize, gapAfter = 0 } = {}) => {
    const chosen = isBold ? bold : font
    wrap(text, maxWidth).forEach((line) => {
      if (y < margin + lineHeight) {
        page = doc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
      page.drawText(line, { x: margin, y, size, font: chosen, color: rgb(0.09, 0.11, 0.16) })
      y -= lineHeight
    })
    y -= gapAfter
  }

  if (title) {
    emit(title, { bold: true, size: 15, gapAfter: 8 })
  }

  lines.forEach((line) => {
    const trimmed = String(line ?? '')
    const isHeading = trimmed.length <= 40 && trimmed === trimmed.toUpperCase() && trimmed.trim()
    const isBullet = /^\s*([-•*])\s+/.test(trimmed)
    if (isHeading) emit(trimmed, { bold: true, size: 11.5, gapAfter: 4 })
    else if (isBullet) emit(`   ${trimmed.replace(/^\s*([-•*])\s*/, '• ')}`)
    else if (trimmed.trim() === '') y -= 6
    else emit(trimmed)
  })

  const output = await doc.save({ useObjectStreams: true })
  return new Uint8Array(output)
}

export default {
  readPdfMeta,
  mergePdfs,
  splitPdf,
  extractPages,
  rotatePdf,
  compressPdf,
  imagesToPdf,
  textToPdf,
}
