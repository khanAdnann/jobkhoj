/**
 * Tests for Ollama Service with an emulated live Ollama server.
 */

const { EventEmitter } = require('events')
const ollamaService = require('../services/ollamaService')

async function runMockOllamaTests() {
  console.log('\n=== RUNNING MOCK OLLAMA PROVIDER TESTS ===\n')

  let passed = 0
  let failed = 0

  async function test(name, fn) {
    process.stdout.write(`- Testing: ${name}... `)
    try {
      await fn()
      console.log('✓ PASSED')
      passed++
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`)
      failed++
    }
  }

  // Test 1: Fallback generation when Ollama is offline
  await test('Graceful fallback preserves user experience when offline', async () => {
    const res = await ollamaService.chatCompletion({
      messages: [{ role: 'user', content: 'What are the main Java 21 features?' }],
    })
    if (!res.success) throw new Error('Expected success: true')
    if (!res.content.includes('Java')) throw new Error('Expected Java guidance in response')
    if (!res.fallback) throw new Error('Expected fallback flag to be true')
  })

  // Test 2: Input sanitization strips control chars
  await test('Input sanitizer removes null bytes and control chars', () => {
    const { sanitizeInput } = require('../middleware/security')
    const dirty = 'Hello\x00World\x08Test'
    const cleaned = sanitizeInput(dirty)
    if (cleaned !== 'HelloWorldTest') throw new Error(`Expected clean string, got ${cleaned}`)
  })

  // Test 3: PII Redaction
  await test('PII Redactor masks emails and phone numbers', () => {
    const { redactPii } = require('../middleware/security')
    const text = 'Contact john.doe@example.com or call +91 9876543210 for details.'
    const redacted = redactPii(text)
    if (redacted.includes('john.doe@example.com')) throw new Error('Email was not redacted')
    if (redacted.includes('9876543210')) throw new Error('Phone was not redacted')
    if (!redacted.includes('[EMAIL REDACTED]')) throw new Error('Missing email placeholder')
  })

  // Test 4: SSRF protection
  await test('SSRF validator rejects unlisted or arbitrary domains', () => {
    const { validateTargetUrl } = require('../middleware/security')
    try {
      validateTargetUrl('http://malicious-external-site.com/steal-data')
      throw new Error('Should have thrown an SSRF security error')
    } catch (err) {
      if (!err.message.includes('trusted host whitelist')) {
        throw new Error(`Unexpected error message: ${err.message}`)
      }
    }
  })

  // Test 5: SSRF validator accepts allowed localhost
  await test('SSRF validator accepts configured localhost target', () => {
    const { validateTargetUrl } = require('../middleware/security')
    const valid = validateTargetUrl('http://localhost:11434/api/chat')
    if (!valid.startsWith('http://localhost:11434')) {
      throw new Error('Expected localhost to be accepted')
    }
  })

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`)
  process.exit(failed > 0 ? 1 : 0)
}

runMockOllamaTests().catch((err) => {
  console.error(err)
  process.exit(1)
})

