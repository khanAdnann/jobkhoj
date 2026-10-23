/**
 * JobKhoj Backend Server Entry Point
 *
 * Runs the secure AI and portal backend server.
 */

const http = require('http')
const config = require('./config')
const { handleRequest } = require('./app')
const { checkHealth } = require('./services/ollamaService')

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('[Server Error]', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: true, message: 'Internal server failure.' }))
    }
  })
})

const PORT = config.port

server.listen(PORT, async () => {
  console.log(`====================================================`)
  console.log(` JobKhoj AI Backend Server running on port ${PORT}`)
  console.log(` Base URL: http://localhost:${PORT}`)
  console.log(` AI Endpoints: http://localhost:${PORT}/api/ai/*`)
  console.log(` Configured Ollama: ${config.ollama.baseUrl}`)
  console.log(` Configured Model:  ${config.ollama.model}`)
  console.log(` Timeout:           ${config.ollama.timeoutMs / 1000}s`)
  console.log(`====================================================`)

  // Non-blocking initial Ollama health ping
  try {
    const health = await checkHealth()
    if (health.status === 'ok') {
      console.log(` [Ollama Ready] Model "${config.ollama.model}" is available and ready for prompts.`)
    } else {
      console.log(` [Ollama Notice] ${health.message}`)
    }
  } catch (err) {
    console.log(` [Ollama Notice] Ollama is currently offline: ${err.message}`)
  }
})

// Graceful shutdown
function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down JobKhoj backend gracefully...`)
  server.close(() => {
    console.log('JobKhoj backend closed.')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Forcefully exiting after timeout.')
    process.exit(1)
  }, 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

module.exports = server

