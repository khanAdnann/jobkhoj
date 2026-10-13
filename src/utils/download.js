/**
 * File downloads without a framework — used by every tool result.
 *
 * Creates an object URL, clicks a synthetic anchor, then revokes the URL so
 * the blob is released after the download starts.
 */
export function downloadBlob(bytes, fileName, mime = 'application/octet-stream') {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}

export function downloadText(text, fileName, mime = 'text/plain;charset=utf-8') {
  return downloadBlob([text], fileName, mime)
}

export default downloadBlob
