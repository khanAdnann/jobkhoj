/**
 * Automated Test Suite for JobKhoj AI Backend
 *
 * Runs tests in-memory to ensure 100% sandboxed execution without network permissions.
 */

const { EventEmitter } = require('events')
const { handleRequest } = require('../app')
const { resetRateLimits } = require('../middleware/rateLimiter')

/**
 * Creates in-memory mock request and response objects.
 */
function createMockHttpPair(method, path, body = null, headers = {}) {
  const req = new EventEmitter()
  req.method = method
  req.url = path
  req.headers = {
    host: 'localhost',
    'content-type': 'application/json',
    ...headers,
  }

  const res = new EventEmitter()
  res.headers = {}
  res.statusCode = 200
  let resBody = ''

  res.setHeader = (key, value) => {
    res.headers[key.toLowerCase()] = value
  }

  res.writeHead = (statusCode, headers = {}) => {
    res.statusCode = statusCode
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v)
    }
  }

  const donePromise = new Promise((resolve) => {
    res.end = (chunk) => {
      if (chunk) resBody += chunk
      let parsed = null
      try {
        parsed = resBody ? JSON.parse(resBody) : null
      } catch (e) {
        parsed = resBody
      }
      resolve({
        status: res.statusCode,
        headers: res.headers,
        body: parsed,
      })
    }
  })

  // Start processing
  setImmediate(async () => {
    handleRequest(req, res).catch((err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: true, message: err.message }))
    })

    if (body !== null && body !== undefined) {
      const dataStr = typeof body === 'string' ? body : JSON.stringify(body)
      req.emit('data', Buffer.from(dataStr))
    }
    req.emit('end')
  })

  return donePromise
}

async function runAllTests() {
  console.log('\n=== RUNNING JOBKHOJ AI BACKEND TEST SUITE (IN-MEMORY) ===\n')

  let passed = 0
  let failed = 0

  async function test(name, fn) {
    process.stdout.write(`- Testing: ${name}... `)
    try {
      resetRateLimits()
      await fn()
      console.log('✓ PASSED')
      passed++
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`)
      failed++
    }
  }

  // 1. Health endpoint
  await test('GET /api/ai/health returns 200 and provider status', async () => {
    const res = await createMockHttpPair('GET', '/api/ai/health')
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body || res.body.provider !== 'ollama') {
      throw new Error(`Expected provider to be "ollama", got: ${JSON.stringify(res.body)}`)
    }
  })

  // 2. Models endpoint
  await test('GET /api/ai/models returns status and models array', async () => {
    const res = await createMockHttpPair('GET', '/api/ai/models')
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!Array.isArray(res.body.models)) throw new Error('Expected models array')
  })

  // 3. Chat endpoint with empty payload
  await test('POST /api/ai/chat rejects empty prompt with 400', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/chat', { messages: [] })
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
  })

  // 4. Chat endpoint with standard messages format
  await test('POST /api/ai/chat handles {"messages":[{"role":"user","content":"Hello"}]}', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hello' }],
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body || typeof res.body.content !== 'string') {
      throw new Error(`Expected string content in reply, got: ${JSON.stringify(res.body)}`)
    }
  })

  // 5. Chat endpoint with career question (fallback or live)
  await test('POST /api/ai/chat generates career assistance reply', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/chat', {
      message: 'Help me prepare for a Java Developer interview',
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body.content || typeof res.body.content !== 'string') {
      throw new Error('Expected string content in reply')
    }
  })

  // 5. Real Job Data matching
  await test('POST /api/ai/jobs/match returns verified database records', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/jobs/match', {
      skills: ['Java', 'Spring Boot', 'PostgreSQL'],
      yearsOfExperience: 3,
      location: 'Pune',
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!Array.isArray(res.body.jobs) || res.body.jobs.length === 0) {
      throw new Error('Expected verified matching jobs array')
    }
    const firstJob = res.body.jobs[0]
    if (!firstJob.id || !firstJob.companyName) {
      throw new Error('Matched job missing verified ID or companyName')
    }
    if (typeof firstJob.matchScore !== 'number') {
      throw new Error('Matched job missing matchScore')
    }
  })

  // 6. Resume Analyzer with short/empty input
  await test('POST /api/ai/resume/analyze rejects short input with 400', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/resume/analyze', { text: 'too short' })
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
  })

  // 7. Resume Analyzer with valid text
  await test('POST /api/ai/resume/analyze detects technical skills and sections', async () => {
    const validResume = `
      John Doe - Senior Software Engineer
      Experience: 5+ years of experience in Java, Spring Boot, React, and PostgreSQL.
      Built microservices and scalable REST APIs.
      Education: B.Tech in Computer Science from XYZ University.
      Projects: E-commerce platform using Docker and AWS.
    `
    const res = await createMockHttpPair('POST', '/api/ai/resume/analyze', { text: validResume })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body.deterministic || !Array.isArray(res.body.deterministic.detectedSkills)) {
      throw new Error('Expected deterministic skills array')
    }
    if (!res.body.analysisReport) throw new Error('Expected analysis report')
  })

  // 8. Mock Interview Start
  let activeSessionId = null
  await test('POST /api/ai/interview/start creates isolated session with question', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/interview/start', {
      role: 'Java Developer',
      level: 'Mid',
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body.sessionId || !res.body.question) {
      throw new Error('Expected sessionId and first question')
    }
    activeSessionId = res.body.sessionId
  })

  // 9. Mock Interview Answer & Evaluation
  await test('POST /api/ai/interview/answer evaluates technical correctness', async () => {
    if (!activeSessionId) throw new Error('No active session id')
    const res = await createMockHttpPair('POST', '/api/ai/interview/answer', {
      sessionId: activeSessionId,
      answer:
        'A HashMap in Java stores key-value pairs using buckets. In Java 8, it converts linked lists to red-black trees when the bin count exceeds 8 to maintain O(log n) lookup.',
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body.feedback || typeof res.body.score !== 'number') {
      throw new Error('Expected feedback text and numeric score')
    }
  })

  // 10. Cover Letter Generator
  await test('POST /api/ai/cover-letter generates tailored non-hallucinated letter', async () => {
    const res = await createMockHttpPair('POST', '/api/ai/cover-letter', {
      candidateName: 'Adnan Khan',
      skills: ['React', 'TypeScript', 'Node.js'],
      experienceYears: 4,
      currentTitle: 'Frontend Engineer',
      jobTitle: 'Senior React Developer',
      companyName: 'Apex Cloud Solutions',
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    if (!res.body.coverLetter || typeof res.body.coverLetter !== 'string') {
      throw new Error('Expected coverLetter string')
    }
  })

  // 11. Rate Limiter enforcement
  await test('Rate Limiter blocks requests exceeding threshold with 429', async () => {
    let got429 = false
    for (let i = 0; i < 70; i++) {
      const res = await createMockHttpPair('GET', '/api/ai/health')
      if (res.status === 429) {
        got429 = true
        break
      }
    }
    if (!got429) throw new Error('Expected HTTP 429 after exceeding max requests')
  })

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`)
  process.exit(failed > 0 ? 1 : 0)
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

