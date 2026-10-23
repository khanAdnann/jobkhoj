/**
 * Server Configuration
 *
 * Centralizes all configuration loaded from environment variables.
 * Never hardcodes secrets, remote endpoints, or model names.
 */

const path = require('path')
const fs = require('fs')

// Lightweight .env loader if dotenv is not installed
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8')
      const lines = content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (process.env[key] === undefined) {
            process.env[key] = val
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

loadEnv()

module.exports = {
  // Server HTTP port
  port: parseInt(process.env.PORT || process.env.API_PORT || '8080', 10),

  // CORS allowed origins (comma-separated or wildcard for local dev)
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],

  // Ollama provider configuration
  ollama: {
    baseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),
    model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10),
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
    maxTokens: process.env.OLLAMA_MAX_TOKENS ? parseInt(process.env.OLLAMA_MAX_TOKENS, 10) : 2048,
    // Optional Bearer token or custom auth header for remote secured Ollama instances
    authToken: process.env.OLLAMA_AUTH_TOKEN || null,
    // List of allowed host patterns to prevent SSRF
    allowedHosts: process.env.OLLAMA_ALLOWED_HOSTS
      ? process.env.OLLAMA_ALLOWED_HOSTS.split(',').map((s) => s.trim().toLowerCase())
      : ['localhost', '127.0.0.1', '::1', 'host.docker.internal'],
  },

  // Security & Rate Limiting
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequestsPerWindow: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10), // 60 req/min
    maxPayloadBytes: parseInt(process.env.MAX_PAYLOAD_BYTES || '10485760', 10), // 10MB (for resume uploads)
    maxChatHistory: parseInt(process.env.MAX_CHAT_HISTORY || '20', 10), // max messages in conversation memory
    enablePiiRedaction: process.env.ENABLE_PII_REDACTION !== 'false',
  },

  // Supabase (optional backend client if service credentials configured)
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    publishableKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
}

