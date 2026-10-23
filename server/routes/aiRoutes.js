/**
 * AI Routes & Controllers
 *
 * Exposes all REST endpoints for AI Career Assistance.
 * Performs input validation, sanitization, and dispatches to domain services.
 */

const { safeErrorResponse, sanitizeInput } = require('../middleware/security')
const ollamaService = require('../services/ollamaService')
const jobSearchService = require('../services/jobSearchService')
const resumeService = require('../services/resumeService')
const interviewService = require('../services/interviewService')

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function handleAiRoutes(req, res, pathname, body) {
  // 1. GET /api/ai/health
  if (req.method === 'GET' && pathname === '/api/ai/health') {
    const health = await ollamaService.checkHealth()
    return sendJson(res, 200, health)
  }

  // 2. GET /api/ai/models
  if (req.method === 'GET' && pathname === '/api/ai/models') {
    const models = await ollamaService.listModels()
    return sendJson(res, 200, models)
  }

  // 3. POST /api/ai/chat
  if (req.method === 'POST' && pathname === '/api/ai/chat') {
    let rawMessages = []
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      rawMessages = body.messages
    } else if (body.message) {
      rawMessages = [{ role: 'user', content: String(body.message) }]
    }

    const messages = []
    for (const m of rawMessages) {
      if (!m) continue
      if (typeof m === 'string' && m.trim()) {
        messages.push({ role: 'user', content: m.trim() })
      } else if (typeof m === 'object') {
        const textContent = m.content || m.text || m.prompt || ''
        if (typeof textContent === 'string' && textContent.trim()) {
          messages.push({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: textContent.trim(),
          })
        }
      }
    }

    if (messages.length === 0) {
      return safeErrorResponse(res, 400, 'Request body must contain at least one valid message with text content.')
    }

    const lastMsgObj = messages[messages.length - 1]
    const lastMsg = lastMsgObj && typeof lastMsgObj.content === 'string' ? lastMsgObj.content : ''
    const lower = lastMsg.toLowerCase()

    // Detect if user is asking for job recommendations
    if (
      (lower.includes('job') || lower.includes('opening') || lower.includes('hiring') || lower.includes('recommend')) &&
      (lower.includes('for me') || lower.includes('find') || lower.includes('suggest') || lower.includes('available'))
    ) {
      // Extract skills / keywords
      const matched = jobSearchService.matchJobs({
        query: lastMsg,
        skills: body.userSkills || [],
        limit: 4,
      })

      const explanation = await jobSearchService.explainJobMatches(lastMsg, matched)
      return sendJson(res, 200, {
        success: true,
        role: 'assistant',
        content: explanation.aiExplanation,
        recommendedJobs: explanation.jobs,
        isJobRecommendation: true,
      })
    }

    const systemPrompt =
      body.systemPrompt ||
      `You are JobKhoj AI, a professional, supportive, and knowledgeable career coach on the JobKhoj recruitment platform.
Your expertise spans:
- Technical interview preparation (Java, Spring Boot, React, SQL, Full Stack, Microservices)
- Resume improvement, Google STAR/XYZ bullet rewrites, and keyword targeting
- Career guidance, learning roadmaps, and salary negotiation strategies
- Explaining complex job requirements simply and objectively

CRITICAL INSTRUCTIONS:
- Be concise, direct, and actionable.
- Never invent fictitious JobKhoj job postings, recruiters, application statuses, or guaranteed hiring outcomes.
- If the user asks for available jobs on the platform, refer them to JobKhoj Job Search (/jobs) or mention that you can search verified listings for them.`

    try {
      const response = await ollamaService.chatCompletion({
        messages,
        systemPrompt,
        temperature: body.temperature,
      })
      return sendJson(res, 200, response)
    } catch (err) {
      return safeErrorResponse(res, 500, `Chat completion failed: ${err.message}`)
    }
  }

  // 4. POST /api/ai/resume/analyze
  if (req.method === 'POST' && pathname === '/api/ai/resume/analyze') {
    const { text, fileBase64, fileType, targetJob } = body

    if (!text && !fileBase64) {
      return safeErrorResponse(res, 400, 'Provide either resume "text" or "fileBase64" document data.')
    }

    try {
      const report = await resumeService.analyzeResume({
        text,
        fileBase64,
        fileType,
        targetJob,
      })
      return sendJson(res, 200, report)
    } catch (err) {
      return safeErrorResponse(res, 400, err.message)
    }
  }

  // 5. POST /api/ai/jobs/match
  if (req.method === 'POST' && pathname === '/api/ai/jobs/match') {
    const { candidateProfile, resumeText, query, skills, yearsOfExperience, location, limit } = body

    const userSkills = skills || candidateProfile?.skills || []
    const userExp = yearsOfExperience ?? candidateProfile?.yearsOfExperience ?? 0
    const userLoc = location || candidateProfile?.location || ''
    const userQuery = query || candidateProfile?.headline || candidateProfile?.name || ''

    const matched = jobSearchService.matchJobs({
      query: userQuery,
      skills: userSkills,
      yearsOfExperience: userExp,
      location: userLoc,
      limit: limit || 5,
    })

    const summary = `Candidate with skills: [${userSkills.join(', ')}], Experience: ${userExp} years, Preferred Location: ${userLoc || 'Any'}`
    const result = await jobSearchService.explainJobMatches(summary, matched)
    return sendJson(res, 200, result)
  }

  // 6. POST /api/ai/interview/start
  if (req.method === 'POST' && pathname === '/api/ai/interview/start') {
    const { role, level, topic } = body
    if (!role) {
      return safeErrorResponse(res, 400, 'Missing required field "role" (e.g., "Java Developer", "Spring Boot Developer", "React Developer").')
    }

    try {
      const session = await interviewService.startInterview({ role, level, topic })
      return sendJson(res, 200, session)
    } catch (err) {
      return safeErrorResponse(res, 500, err.message)
    }
  }

  // 7. POST /api/ai/interview/answer
  if (req.method === 'POST' && pathname === '/api/ai/interview/answer') {
    const { sessionId, answer } = body
    if (!sessionId || !answer) {
      return safeErrorResponse(res, 400, 'Both "sessionId" and "answer" are required.')
    }

    try {
      const result = await interviewService.submitAnswer({ sessionId, answer })
      return sendJson(res, 200, result)
    } catch (err) {
      return safeErrorResponse(res, 400, err.message)
    }
  }

  // 8. POST /api/ai/cover-letter
  if (req.method === 'POST' && pathname === '/api/ai/cover-letter') {
    const {
      candidateName,
      skills,
      experienceYears,
      currentTitle,
      highlights,
      jobTitle,
      companyName,
      jobDescription,
      tone,
    } = body

    if (!jobTitle) {
      return safeErrorResponse(res, 400, 'Field "jobTitle" is required to tailor the cover letter.')
    }

    try {
      const letterResult = await resumeService.generateCoverLetter({
        candidateName,
        skills: skills || [],
        experienceYears,
        currentTitle,
        highlights,
        jobTitle,
        companyName,
        jobDescription,
        tone: tone || 'professional',
      })
      return sendJson(res, 200, letterResult)
    } catch (err) {
      return safeErrorResponse(res, 500, err.message)
    }
  }

  // 404 for unhandled AI routes
  return safeErrorResponse(res, 404, `AI API endpoint not found: ${req.method} ${pathname}`)
}

module.exports = {
  handleAiRoutes,
}

