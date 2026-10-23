/**
 * AI Career Assistance Service (Frontend Client)
 *
 * Communicates with the configurable Ollama backend API (/api/ai/*).
 * Provides graceful fallbacks and offline detection so the UI never blocks.
 */

import { api } from './api'

/**
 * Safely handles both raw response payloads and Axios { data } envelopes.
 */
function unwrap(res) {
  if (!res) return null
  if (res.data !== undefined && typeof res.data === 'object' && res.data !== null) {
    return res.data
  }
  return res
}

/**
 * Checks provider health, configured model, and availability status.
 */
export async function checkAiHealth() {
  try {
    const res = await api.get('/ai/health', { timeout: 8000 })
    return unwrap(res)
  } catch (err) {
    return {
      status: 'unavailable',
      provider: 'ollama',
      configuredModel: 'qwen2.5-coder:7b',
      modelAvailable: false,
      availableModels: [],
      error: err.response?.data?.message || err.message,
      message: 'AI backend server is currently unreachable. Make sure the backend is running.',
    }
  }
}

/**
 * Lists installed models on the Ollama host.
 */
export async function listAiModels() {
  try {
    const res = await api.get('/ai/models', { timeout: 6000 })
    const data = unwrap(res)
    return data?.models || []
  } catch (err) {
    return []
  }
}

/**
 * Sends a conversation message to the AI career assistant.
 */
export async function sendAiChat({ messages = [], message = '', userSkills = [], systemPrompt = null }) {
  try {
    const payload = {
      messages,
      message,
      userSkills,
      systemPrompt,
    }
    const res = await api.post('/ai/chat', payload, { timeout: 90000 })
    const data = unwrap(res)
    if (!data || typeof data !== 'object') {
      throw new Error('Received an invalid or empty response from AI service.')
    }
    return data
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Unable to connect to the AI service. Please verify your Ollama server is running.'
    throw new Error(msg)
  }
}

/**
 * Analyzes resume content using AI and deterministic extraction.
 */
export async function analyzeResumeWithAi({ text = '', fileBase64 = null, fileType = null, targetJob = null }) {
  try {
    const res = await api.post(
      '/ai/resume/analyze',
      { text, fileBase64, fileType, targetJob },
      { timeout: 90000 },
    )
    return unwrap(res)
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Resume analysis failed.')
  }
}

/**
 * Matches candidate profile against verified JobKhoj database listings.
 */
export async function matchJobsWithAi({
  candidateProfile = null,
  query = '',
  skills = [],
  yearsOfExperience = 0,
  location = '',
  limit = 5,
}) {
  try {
    const res = await api.post(
      '/ai/jobs/match',
      {
        candidateProfile,
        query,
        skills,
        yearsOfExperience,
        location,
        limit,
      },
      { timeout: 45000 },
    )
    return unwrap(res)
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Job matching failed.')
  }
}

/**
 * Starts an isolated AI mock interview session.
 */
export async function startMockInterview({ role = 'Java Developer', level = 'Mid', topic = '' }) {
  try {
    const res = await api.post('/ai/interview/start', { role, level, topic }, { timeout: 30000 })
    return unwrap(res)
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to start interview.')
  }
}

/**
 * Submits candidate answer for AI technical evaluation.
 */
export async function submitInterviewAnswer({ sessionId, answer }) {
  try {
    const res = await api.post('/ai/interview/answer', { sessionId, answer }, { timeout: 60000 })
    return unwrap(res)
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to evaluate answer.')
  }
}

/**
 * Generates a tailored cover letter based on user profile and target job.
 */
export async function generateCoverLetterWithAi({
  candidateName = '',
  skills = [],
  experienceYears = 0,
  currentTitle = '',
  highlights = '',
  jobTitle = '',
  companyName = '',
  jobDescription = '',
  tone = 'professional',
}) {
  try {
    const res = await api.post(
      '/ai/cover-letter',
      {
        candidateName,
        skills,
        experienceYears,
        currentTitle,
        highlights,
        jobTitle,
        companyName,
        jobDescription,
        tone,
      },
      { timeout: 60000 },
    )
    return unwrap(res)
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Cover letter generation failed.')
  }
}
