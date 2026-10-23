/**
 * Safe JSON request body parser with payload size enforcement.
 */

const config = require('../config')
const { safeErrorResponse } = require('./security')

function parseJsonBody(req, res) {
  return new Promise((resolve) => {
    let rawData = ''
    let totalBytes = 0
    const maxBytes = config.security.maxPayloadBytes

    req.on('data', (chunk) => {
      totalBytes += chunk.length
      if (totalBytes > maxBytes) {
        req.destroy()
        safeErrorResponse(
          res,
          413,
          `Payload too large. Maximum allowed size is ${Math.round(maxBytes / 1024 / 1024)}MB.`,
        )
        resolve(null)
        return
      }
      rawData += chunk
    })

    req.on('end', () => {
      if (!rawData) {
        resolve({})
        return
      }

      try {
        const parsed = JSON.parse(rawData)
        resolve(parsed)
      } catch (err) {
        safeErrorResponse(res, 400, 'Invalid JSON body format.')
        resolve(null)
      }
    })

    req.on('error', (err) => {
      safeErrorResponse(res, 400, `Request error: ${err.message}`)
      resolve(null)
    })
  })
}

module.exports = {
  parseJsonBody,
}

