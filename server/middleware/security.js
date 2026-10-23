/**
 * Security utilities: SSRF prevention, PII redaction, safe errors, input sanitation.
 */

const { URL } = require('url')
const config = require('../config')

/**
 * Validates that a target URL is strictly within the allowed hosts.
 * Prevents Server-Side Request Forgery (SSRF).
 */
function validateTargetUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl)
    const hostname = parsed.hostname.toLowerCase()

    // Host must match allowed list or be configured
    const isAllowed = config.ollama.allowedHosts.some((allowed) => {
      if (allowed === '*' && process.env.NODE_ENV !== 'production') return true
      if (allowed.startsWith('*.')) {
        return hostname.endsWith(allowed.slice(1))
      }
      return hostname === allowed
    })

    if (!isAllowed) {
      throw new Error(`Target host "${hostname}" is not in the trusted host whitelist.`)
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`)
    }

    return parsed.href
  } catch (err) {
    throw new Error(`Security validation failed for URL: ${err.message}`)
  }
}

/**
 * Redacts email addresses and phone numbers from text for safe logging.
 */
function redactPii(text) {
  if (!text || typeof text !== 'string') return text
  // Redact emails
  let sanitized = text.replace(
    /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g,
    '[EMAIL REDACTED]',
  )
  // Redact phone numbers (international or standard 10-12 digits)
  sanitized = sanitized.replace(
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
    '[PHONE REDACTED]',
  )
  return sanitized
}

/**
 * Sanitizes user input string: strips null bytes and control chars.
 */
function sanitizeInput(str, maxLength = 8000) {
  if (typeof str !== 'string') return ''
  // Strip null bytes and control chars except newlines and tabs
  let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
  }
  return cleaned.trim()
}

/**
 * Creates a client-safe error object without stack traces or internal paths.
 */
function safeErrorResponse(res, statusCode, message, details = null) {
  const safeMessage = typeof message === 'string' ? message : 'An unexpected error occurred.'
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      error: true,
      message: safeMessage,
      details: process.env.NODE_ENV === 'development' && details ? String(details) : undefined,
      timestamp: new Date().toISOString(),
    }),
  )
}

module.exports = {
  validateTargetUrl,
  redactPii,
  sanitizeInput,
  safeErrorResponse,
}

