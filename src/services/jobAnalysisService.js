import { api, request } from './api'
import {
  analyzeJobDescription,
  matchResumeToJd,
  skillGap,
  parseJobDescription,
} from '@/tools/engine/jd.js'
import { extractStructuredKeywords } from '@/tools/engine/text.js'

/**
 * Job analysis service — feeds three tools from one parser:
 *   Job Description Analyzer · Resume Optimizer · Skill Gap Analyzer
 *
 * Live contract:
 *   POST /api/tools/jd/analyze   { text }             -> parsed JD
 *   POST /api/tools/jd/match     { resume, jd }       -> match report
 *   POST /api/tools/jd/skill-gap { resume, jd }       -> gap report
 */
export const JD_ENDPOINTS = {
  analyze: '/api/tools/jd/analyze',
  match: '/api/tools/jd/match',
  skillGap: '/api/tools/jd/skill-gap',
}

export function analyzeJd(text = '') {
  if (!text.trim()) {
    const error = new Error('Paste a job description to analyze.')
    error.code = 'EMPTY'
    return Promise.reject(error)
  }
  return request(
    () => api.post(JD_ENDPOINTS.analyze, { text }),
    async () => analyzeJobDescription(text),
  )
}

export function matchResume(resumeText = '', jdText = '') {
  return request(
    () => api.post(JD_ENDPOINTS.match, { resume: resumeText, jd: jdText }),
    async () => matchResumeToJd(resumeText, jdText),
  )
}

export function analyzeSkillGap(resumeText = '', jdText = '') {
  return request(
    () => api.post(JD_ENDPOINTS.skillGap, { resume: resumeText, jd: jdText }),
    async () => skillGap(resumeText, jdText),
  )
}

/** Lightweight keyword-only view used by the analyzer's side panel. */
export function extractKeywords(text = '') {
  return extractStructuredKeywords(text)
}

export function parseOnly(text = '') {
  return parseJobDescription(text)
}

export default { analyzeJd, matchResume, analyzeSkillGap }
