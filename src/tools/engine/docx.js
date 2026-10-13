import JSZip from 'jszip'

/**
 * Minimal, spec-correct DOCX writer.
 *
 * A .docx file is a ZIP of OOXML parts; writing the four required parts
 * directly avoids a large dependency and keeps the output fully testable
 * (the smoke suite opens the produced ZIP and asserts on its XML).
 *
 * Formatting is intentionally conservative: headings, bold runs and bullet
 * lines — which is what survives a "PDF/DOCX → Word" conversion honestly.
 */

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr>
    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>
    <w:sz w:val="22"/><w:szCs w:val="22"/>
  </w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>
    <w:qFormat/><w:pPr><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F2937"/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>
    <w:qFormat/><w:pPr><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="374151"/><w:sz w:val="26"/></w:rPr></w:style>
</w:styles>`

/**
 * @typedef {{type:'heading'|'subheading'|'paragraph'|'bullet'|'spacer', text?:string, bold?:boolean}} Block
 */

function runXml(text, { bold = false, italic = false } = {}) {
  const props = bold || italic ? `<w:rPr>${bold ? '<w:b/>' : ''}${italic ? '<w:i/>' : ''}</w:rPr>` : ''
  return `<w:r>${props}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`
}

function paragraphXml(block) {
  const text = String(block.text ?? '')
  switch (block.type) {
    case 'heading':
      return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>${runXml(text)}</w:p>`
    case 'subheading':
      return `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>${runXml(text)}</w:p>`
    case 'bullet':
      return `<w:p><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr>${runXml(`•  ${text}`)}</w:p>`
    case 'spacer':
      return '<w:p/>'
    case 'paragraph':
    default:
      return `<w:p>${runXml(text, { bold: block.bold })}</w:p>`
  }
}

/**
 * @param {{title?:string, blocks:Block[]}} payload
 * @returns {Promise<Uint8Array>} a real .docx package
 */
export async function buildDocx({ title = '', blocks = [] }) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${blocks.map(paragraphXml).join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', CONTENT_TYPES)
  zip.folder('_rels').file('.rels', ROOT_RELS)
  const word = zip.folder('word')
  word.file('document.xml', documentXml)
  word.file('styles.xml', STYLES)
  word.folder('_rels').file('document.xml.rels', DOC_RELS)

  if (title) {
    zip.folder('docProps').file(
      'core.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>JobKhoj Career Tools</dc:creator>
</cp:coreProperties>`,
    )
  }

  const blob = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  return blob
}

/**
 * Turns plain resume/conversion text into document blocks. Section headings
 * are recognised by shape (short + title/upper case), bullets by prefix.
 */
export function textToBlocks(text = '') {
  const blocks = []
  String(text)
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const line = rawLine.trim()
      if (!line) {
        if (blocks[blocks.length - 1]?.type !== 'spacer') blocks.push({ type: 'spacer' })
        return
      }
      if (/^([-•*▪●]|\d+[.)])\s+/.test(line)) {
        blocks.push({ type: 'bullet', text: line.replace(/^([-•*▪●]|\d+[.)])\s+/, '') })
        return
      }
      const words = line.split(/\s+/)
      const looksLikeHeading =
        line.length <= 40 &&
        words.length <= 5 &&
        (line === line.toUpperCase() ||
          (words.every((word) => /^[A-Z]/.test(word)) && words.length <= 4)) &&
        !/[.,;:]$/.test(line)
      if (looksLikeHeading) {
        blocks.push({ type: blocks.length ? 'subheading' : 'heading', text: line })
        return
      }
      blocks.push({ type: 'paragraph', text: line })
    })
  return blocks
}

/** Convenience: plain text → .docx bytes in one call. */
export async function textToDocx(title, text) {
  return buildDocx({ title, blocks: textToBlocks(text) })
}

export default buildDocx
