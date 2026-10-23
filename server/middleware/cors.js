/**
 * CORS handling for the backend server.
 */

const config = require('../config')

function handleCors(req, res) {
  const origin = req.headers.origin

  // If no origin, same-origin or server-to-server
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  } else if (
    config.corsOrigins.includes('*') ||
    config.corsOrigins.includes(origin) ||
    process.env.NODE_ENV !== 'production'
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Session-Id',
  )
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }

  return false
}

module.exports = {
  handleCors,
}

