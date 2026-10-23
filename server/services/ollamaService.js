/**
 * Ollama AI Client Service
 *
 * Integrates directly with the locally running or securely configured remote
 * Ollama instance. Handles model availability checks, chat completion,
 * health status, and fallback mechanisms.
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')
const config = require('../config')
const { validateTargetUrl, redactPii } = require('../middleware/security')

/**
 * Low-level HTTP request helper with strict timeout and security validation.
 */
function requestOllama(path, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const fullUrl = `${config.ollama.baseUrl}${path}`
      validateTargetUrl(fullUrl)

      const parsed = new URL(fullUrl)
      const isHttps = parsed.protocol === 'https:'
      const client = isHttps ? https : http

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }

      if (config.ollama.authToken) {
        headers['Authorization'] = `Bearer ${config.ollama.authToken}`
      }

      const reqOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + (parsed.search || ''),
        method: options.method || 'GET',
        headers,
        timeout: options.timeout || config.ollama.timeoutMs,
      }

      const req = client.request(reqOptions, (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          try {
            const data = body ? JSON.parse(body) : {}
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ statusCode: res.statusCode, data })
            } else {
              const err = new Error(
                data.error || `Ollama responded with HTTP ${res.statusCode}: ${body.slice(0, 300)}`,
              )
              err.statusCode = res.statusCode
              err.data = data
              reject(err)
            }
          } catch (e) {
            reject(new Error(`Failed to parse Ollama response: ${body.slice(0, 200)}`))
          }
        })
      })

      req.on('timeout', () => {
        req.destroy()
        const err = new Error(
          `Ollama request timed out after ${reqOptions.timeout / 1000}s. The model may be loading into memory or the prompt is too long.`,
        )
        err.code = 'ETIMEDOUT'
        reject(err)
      })

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          const helpfulErr = new Error(
            `Unable to connect to Ollama at ${config.ollama.baseUrl}. Make sure Ollama is installed and running ('ollama serve').`,
          )
          helpfulErr.code = 'ECONNREFUSED'
          reject(helpfulErr)
        } else {
          reject(err)
        }
      })

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      }
      req.end()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Health check: tests connectivity, lists installed models, verifies requested model.
 */
async function checkHealth() {
  const start = Date.now()
  try {
    const res = await requestOllama('/api/tags', { method: 'GET', timeout: 5000 })
    const latencyMs = Date.now() - start
    const models = Array.isArray(res.data?.models)
      ? res.data.models.map((m) => m.name || m.model)
      : []

    const configuredModel = config.ollama.model
    const modelFound = models.some(
      (m) => m === configuredModel || m.startsWith(`${configuredModel}:`),
    )

    return {
      status: modelFound ? 'ok' : 'degraded',
      provider: 'ollama',
      configuredModel,
      modelAvailable: modelFound,
      availableModels: models,
      baseUrl: config.ollama.baseUrl,
      latencyMs,
      message: modelFound
        ? `Connected to Ollama. Model "${configuredModel}" is ready.`
        : `Connected to Ollama, but model "${configuredModel}" is not pulled. Run: ollama pull ${configuredModel}`,
    }
  } catch (err) {
    return {
      status: 'unavailable',
      provider: 'ollama',
      configuredModel: config.ollama.model,
      modelAvailable: false,
      availableModels: [],
      baseUrl: config.ollama.baseUrl,
      latencyMs: Date.now() - start,
      error: err.message,
      errorCode: err.code || 'CONNECTION_ERROR',
      message:
        err.code === 'ECONNREFUSED'
          ? `Ollama server is not running on ${config.ollama.baseUrl}. Start it with: ollama serve`
          : `Failed to connect to Ollama: ${err.message}`,
    }
  }
}

/**
 * Lists all models installed in the Ollama instance.
 */
async function listModels() {
  try {
    const res = await requestOllama('/api/tags', { method: 'GET', timeout: 5000 })
    return {
      success: true,
      models: res.data?.models || [],
    }
  } catch (err) {
    return {
      success: false,
      models: [],
      error: err.message,
    }
  }
}

/**
 * Calls Ollama chat API (/api/chat) with system and user messages.
 */
async function chatCompletion({
  messages = [],
  model = config.ollama.model,
  temperature = config.ollama.temperature,
  maxTokens = config.ollama.maxTokens,
  systemPrompt = null,
}) {
  // Build message array
  const formattedMessages = []

  if (systemPrompt) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt,
    })
  }

  // Add conversation messages (trimmed to max history)
  const historyLimit = config.security.maxChatHistory
  const recentMessages = messages.slice(-historyLimit)

  for (const msg of recentMessages) {
    if (!msg || !msg.content) continue
    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).slice(0, 8000),
    })
  }

  if (formattedMessages.length === 0) {
    throw new Error('Chat request must include at least one message.')
  }

  const targetModel = model || config.ollama.model || 'qwen2.5-coder:7b'

  const payload = {
    model: targetModel,
    messages: formattedMessages,
    stream: false,
    options: {
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      num_predict: typeof maxTokens === 'number' ? maxTokens : 2048,
    },
  }

  try {
    const response = await requestOllama('/api/chat', {
      method: 'POST',
      body: payload,
    })

    const data = response?.data
    if (!data || typeof data !== 'object') {
      throw new Error('Received an invalid or empty response from Ollama.')
    }

    if (data.error) {
      const errDetail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      throw new Error(`Ollama error: ${errDetail}`)
    }

    // Explicitly validate data.message and data.message.content
    // Protects against "Cannot read properties of undefined (reading 'content')"
    if (!data.message || typeof data.message !== 'object' || typeof data.message.content !== 'string') {
      console.warn('[OllamaService] Missing or malformed data.message.content. Full response:', data)
      throw new Error('Ollama response did not contain valid message content.')
    }

    const content = data.message.content.trim()

    return {
      success: true,
      role: 'assistant',
      content,
      model: data.model || targetModel,
      totalDurationMs: data.total_duration
        ? Math.round(data.total_duration / 1000000)
        : undefined,
    }
  } catch (err) {
    // If Ollama is unavailable or network error, provide a graceful fallback response
    const networkErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'EACCES', 'ENOTFOUND', 'ECONNRESET', 'EHOSTUNREACH']
    if (networkErrorCodes.includes(err.code) || err.code?.startsWith('E')) {
      console.warn(`[OllamaService] ${err.code || 'Connection error'}: Using intelligent local assistant fallback.`)
      return generateLocalFallbackResponse(formattedMessages, err)
    }
    throw err
  }
}

/**
 * Rule-based fallback career response when Ollama is not active.
 * Ensures the user is never stranded with an unhelpful error screen.
 */
function generateLocalFallbackResponse(messages, originalError) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const lower = lastUserMsg.toLowerCase()

  let reply = ''

  if (lower.includes('java') || lower.includes('spring')) {
    reply = `### Java & Spring Boot Interview Guide\n\nHere are the top core concepts frequently tested for Java / Spring roles:\n\n1. **Core Java & JVM:** Memory management (Stack vs. Heap, Garbage Collection algorithms), JVM architecture, Java 8-21 features (Streams, Lambdas, Records, Virtual Threads).\n2. **Concurrency & Multithreading:** Thread synchronization, \`volatile\`, \`ConcurrentHashMap\`, \`CompletableFuture\`, and thread pools with \`ExecutorService\`.\n3. **Spring Framework Core:** Inversion of Control (IoC), Dependency Injection, Bean Lifecycles, and Spring Scopes.\n4. **Spring Boot & Microservices:** Auto-configuration, Actuator, Spring Data JPA (N+1 query problem, fetch strategies), RESTful API design, and distributed transactions.\n\n*Tip: Start Ollama (\`ollama run ${config.ollama.model}\`) to conduct an interactive live mock interview.*`
  } else if (lower.includes('resume') || lower.includes('cv')) {
    reply = `### Actionable Resume Enhancement Tips\n\n1. **Use Google's XYZ Formula:** Frame achievements as: *"Accomplished [X], as measured by [Y], by doing [Z]"*.\n2. **Target Technical Keywords:** Align your skills section with required skills from active job descriptions (e.g., React, TypeScript, PostgreSQL, Docker).\n3. **Quantify Impact:** Replace *"Worked on backend API"* with *"Developed high-throughput REST APIs handling 5,000+ daily requests, decreasing latency by 25%"*.\n4. **Keep it ATS-Friendly:** Avoid multi-column layouts, tables, or icons in your header so parsers extract your details accurately.`
  } else if (lower.includes('job') || lower.includes('recommend') || lower.includes('opening')) {
    reply = `To explore active job openings on JobKhoj, visit the [Job Search page](/jobs). You can filter listings by technical skills, experience range, location, and salary to find your ideal match.`
  } else {
    reply = `I am JobKhoj AI, your dedicated career assistant. I can help you with:\n- **Technical Interview Preparation** (Java, Spring Boot, React, SQL, Full Stack)\n- **Resume Review & Keyword Optimization**\n- **Personalized Job Recommendations**\n- **Custom Cover Letter Drafting**\n\n*(Note: Ollama is currently offline on ${config.ollama.baseUrl}. To unlock live generative responses, run: \`ollama serve\` and pull \`${config.ollama.model}\`)*`
  }

  return {
    success: true,
    role: 'assistant',
    content: reply,
    fallback: true,
    offlineNotice: `Ollama server offline (${originalError.message}). Showing built-in career guidance.`,
  }
}

module.exports = {
  checkHealth,
  listModels,
  chatCompletion,
  requestOllama,
}
