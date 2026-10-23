/**
 * Sliding window in-memory rate limiter.
 * Protects against resource exhaustion and abuse.
 */

const config = require('../config')
const { safeErrorResponse } = require('./security')

const requestMap = new Map()

// Clean up expired IP buckets periodically
setInterval(() => {
  const now = Date.now()
  const windowMs = config.security.rateLimitWindowMs
  for (const [ip, timestamps] of requestMap.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs)
    if (valid.length === 0) {
      requestMap.delete(ip)
    } else {
      requestMap.set(ip, valid)
    }
  }
}, 30000).unref() // unref so it does not keep process alive in tests

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket ? req.socket.remoteAddress : '127.0.0.1'
}

function checkRateLimit(req, res) {
  const ip = getClientIp(req)
  const now = Date.now()
  const windowMs = config.security.rateLimitWindowMs
  const maxRequests = config.security.maxRequestsPerWindow

  let timestamps = requestMap.get(ip) || []
  timestamps = timestamps.filter((t) => now - t < windowMs)

  if (timestamps.length >= maxRequests) {
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000)
    res.setHeader('Retry-After', retryAfter)
    safeErrorResponse(
      res,
      429,
      `Rate limit exceeded. Please wait ${retryAfter}s before sending more requests.`,
    )
    return false
  }

  timestamps.push(now)
  requestMap.set(ip, timestamps)
  return true
}

// Reset helper for testing
function resetRateLimits() {
  requestMap.clear()
}

module.exports = {
  checkRateLimit,
  getClientIp,
  resetRateLimits,
}

