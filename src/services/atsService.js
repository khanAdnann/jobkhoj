import { api, request } from './api'
import { scoreResume, buildAnalysisPayload, ANALYSIS_MODE, ATS_CATEGORIES } from '@/tools/engine/ats.js'
import { extractResumeText } from '@/tools/engine/convert.js'
import * as tools from './toolsService'

/**
 * ATS Resume Checker service.
 *
 * Live contract (when Spring Boot is connected):
 *   POST /api/tools/ats/extract     multipart file  -> { text }
 *   POST /api/tools/ats/analyze     { text, targetRole } -> full report
 *   POST /api/tools/ats/ai-review   { text }        -> AI deep review
 *
 * Until then every report is produced by the deterministic engine in
 * src/tools/engine/ats.js — the same payload shape either way, so the UI
 * never branches on where the numbers came from.
 */
export const ATS_ENDPOINTS = {
  extract: '/api/tools/ats/extract',
  analyze: '/api/tools/ats/analyze',
  aiReview: '/api/tools/ats/ai-review',
}

export { ANALYSIS_MODE, ATS_CATEGORIES }

/** Text-first scoring — also used by the builder and optimizer. */
export function scoreResumeText(text, meta = {}) {
  return scoreResume(text, meta)
}

/**
 * Extracts text from an uploaded resume, then scores it.
 * @param {{file?:File, text?:string, onProgress?:Function, targetRole?:string}} input
 */
export async function analyzeResume({ file, text, onProgress, targetRole = null } = {}) {
  let resumeText = text ?? ''

  if (file) {
    onProgress?.({ stage: 'reading', progress: 0.1 })
    const bytes = new Uint8Array(await file.arrayBuffer())
    resumeText = await extractResumeText(bytes, file.name)
    onProgress?.({ stage: 'extracted', progress: 0.5 })
  }

  if (!resumeText.trim()) {
    const error = new Error('Upload a resume or paste its text to run the check.')
    error.code = 'EMPTY'
    throw error
  }

  // Usage gate — free tier, counted per completed analysis.
  tools.consumeUsage('atsCheck')

  const report = await request(
    () => api.post('/tools/ats/analyze', { text: resumeText, targetRole }),
    async () => scoreResume(resumeText, { fileName: file?.name ?? null, targetRole }),
  )

  onProgress?.({ stage: 'scored', progress: 1 })

  tools.recordHistory({
    toolId: 'ats-checker',
    tool: 'ATS Resume Checker',
    fileName: file?.name ?? 'Pasted text',
    summary: `ATS score ${report.overall}/100 — ${report.band.label}`,
  })

  return report
}

/** Everything a future AI endpoint needs to do a deeper, contextual review. */
export function buildAiRequest(text, context = {}) {
  return { endpoint: ATS_ENDPOINTS.aiReview, payload: buildAnalysisPayload(text, context) }
}

export default analyzeResume
