/**
 * Main HTTP Application Dispatcher
 *
 * Coordinates CORS, Rate Limiting, Security Headers, Body Parsing, and Routing.
 */

const { URL } = require('url')
const { handleCors } = require('./middleware/cors')
const { checkRateLimit } = require('./middleware/rateLimiter')
const { parseJsonBody } = require('./middleware/bodyParser')
const { safeErrorResponse } = require('./middleware/security')
const { handleAiRoutes } = require('./routes/aiRoutes')

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

async function handleRequest(req, res) {
  setSecurityHeaders(res)

  // Handle CORS preflight
  if (handleCors(req, res)) {
    return
  }

  // Rate Limiter
  if (!checkRateLimit(req, res)) {
    return
  }

  let parsedUrl
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  } catch (err) {
    return safeErrorResponse(res, 400, 'Malformed request URL.')
  }

  const pathname = parsedUrl.pathname

  // Root or health ping
  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        name: 'JobKhoj Backend API',
        status: 'online',
        aiEndpoints: '/api/ai/*',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
    )
    return
  }

  // AI API routes
  if (pathname.startsWith('/api/ai/')) {
    let body = {}
    if (req.method === 'POST' || req.method === 'PUT') {
      body = await parseJsonBody(req, res)
      if (body === null) return // Response already sent by body parser
    }

    try {
      await handleAiRoutes(req, res, pathname, body)
    } catch (err) {
      console.error('[App] Unhandled error during AI route handling:', err)
      safeErrorResponse(res, 500, 'Internal server error processing AI request.')
    }
    return
  }

  // Unhandled route
  safeErrorResponse(res, 404, `Route not found: ${req.method} ${pathname}`)
}

module.exports = {
  handleRequest,
}

