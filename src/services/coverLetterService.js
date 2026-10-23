import { parseJobDescription } from '@/tools/engine/jd.js'
import { matchTerms, uniq } from '@/tools/engine/text.js'
import { generateCoverLetterWithAi } from './aiService'
import * as tools from './toolsService'

/**
 * Cover Letter Generator.
 *
 * A deterministic composer writes the letter today; the moment an LLM is
 * available the same payload goes to `COVER_ENDPOINT` and its draft is used
 * instead — see `aiRequest`. Tone and length are data, not hard-coded prose.
 */
export const COVER_ENDPOINT = '/api/tools/cover-letter/generate'

export const TONES = [
  { id: 'professional', label: 'Professional', hint: 'Measured, formal, recruiter-safe' },
  { id: 'confident', label: 'Confident', hint: 'Direct, ownership-led, assertive' },
  { id: 'friendly', label: 'Friendly', hint: 'Warm, conversational, human' },
  { id: 'concise', label: 'Concise', hint: 'Short sentences, no filler' },
]

export const LENGTHS = [
  { id: 'short', label: 'Short', hint: '~120 words · quick applications' },
  { id: 'medium', label: 'Medium', hint: '~220 words · most roles' },
  { id: 'detailed', label: 'Detailed', hint: '~350 words · senior / referred' },
]

const OPENINGS = {
  professional: [
    'I am writing to express my interest in the {jobTitle} position at {company}.',
    'Please accept this letter as my application for the {jobTitle} role at {company}.',
  ],
  confident: [
    'I am the {jobTitle} you are looking for at {company}.',
    'I would like to put my {experience} of {strength} to work as your next {jobTitle}.',
  ],
  friendly: [
    'I was excited to see the {jobTitle} opening at {company} — it lines up closely with what I have been building lately.',
    'When I spotted the {jobTitle} role at {company}, I knew I had to reach out.',
  ],
  concise: [
    'Re: {jobTitle} at {company}.',
    'I am applying for the {jobTitle} role at {company}.',
  ],
}

const MIDDLES = [
  'In my current work I use {skills} to deliver {responsibility}.',
  'Over {experience} I have focused on {skills}, including work on {responsibility}.',
  'The problems behind this role — {responsibility} — are ones I have handled using {skills}.',
]

const CLOSINGS = {
  professional: 'I would welcome the chance to discuss how my background fits {company}. Thank you for your time and consideration.',
  confident: 'I am ready to start delivering from week one. I look forward to the conversation.',
  friendly: 'I would love to talk more about the role and the team. Thanks for reading — hope to hear from you.',
  concise: 'Available to interview at your convenience.',
}

const fill = (template, values) =>
  template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)

function pick(list, seed) {
  return list[seed % list.length]
}

/**
 * @param {{candidateName:string,jobTitle:string,company:string,experience:string,
 *          skills:string,jobDescription:string,resumeText?:string,tone:string,length:string}} input
 */
export function generateCoverLetter(input = {}) {
  const {
    candidateName = '',
    jobTitle = '',
    company = '',
    experience = '',
    skills = '',
    jobDescription = '',
    resumeText = '',
    tone = 'professional',
    length = 'medium',
  } = input

  const jd = parseJobDescription(jobDescription || `${jobTitle} ${skills}`)
  const skillList = uniq([...(jd.skills.required.slice(0, 6)), ...skills.split(',').map((s) => s.trim())].filter(Boolean))
  const responsibility = jd.responsibilities[0] ?? jd.skills.required[0] ?? 'the core responsibilities of the role'
  const strength = skillList[0] ?? 'delivery-focused engineering'
  const seed = (candidateName + jobTitle + company).length

  const values = {
    jobTitle: jobTitle || 'the advertised role',
    company: company || 'your organisation',
    experience: experience || 'my career so far',
    skills: skillList.slice(0, 5).join(', ') || strength,
    responsibility,
    strength,
    candidateName,
  }

  const paragraphs = []
  paragraphs.push(fill(pick(OPENINGS[tone] ?? OPENINGS.professional, seed), values))

  const bodyCount = length === 'short' ? 1 : length === 'detailed' ? 3 : 2
  for (let index = 0; index < bodyCount; index += 1) {
    paragraphs.push(fill(MIDDLES[index % MIDDLES.length], values))
  }

  if (resumeText && length !== 'short') {
    const hits = matchTerms(resumeText, skillList).slice(0, 4)
    if (hits.length) {
      paragraphs.push(
        `My resume reflects hands-on work with ${hits.join(', ')}, which is why this particular role stands out to me.`,
      )
    }
  }

  paragraphs.push(fill(CLOSINGS[tone] ?? CLOSINGS.professional, values))
  if (candidateName) paragraphs.push(candidateName)

  const text = paragraphs.join('\n\n')
  const wordCount = text.split(/\s+/).filter(Boolean).length

  const result = {
    text,
    paragraphs,
    wordCount,
    tone,
    length,
    meta: {
      mode: 'mock',
      aiReady: true,
      endpoint: COVER_ENDPOINT,
      note: 'Drafted with the local composer. Connect an LLM endpoint for contextual rewrites.',
    },
  }

  tools.recordHistory({
    toolId: 'cover-letter',
    tool: 'Cover Letter Generator',
    fileName: company ? `${company} cover letter` : jobTitle || 'Cover letter',
    summary: `${TONES.find((item) => item.id === tone)?.label ?? tone} · ${wordCount} words`,
  })

  return result
}

/**
 * Asynchronous cover letter generator leveraging Ollama with automatic fallback.
 */
export async function generateCoverLetterAsync(input = {}) {
  try {
    const aiData = await generateCoverLetterWithAi({
      candidateName: input.candidateName,
      skills: (input.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
      experienceYears: parseInt(input.experience, 10) || 0,
      jobTitle: input.jobTitle,
      companyName: input.company,
      jobDescription: input.jobDescription,
      tone: input.tone,
    })

    if (aiData?.coverLetter) {
      const text = aiData.coverLetter
      const paragraphs = text.split('\n\n').filter(Boolean)
      const wordCount = text.split(/\s+/).filter(Boolean).length

      tools.recordHistory({
        toolId: 'cover-letter',
        tool: 'Cover Letter Generator',
        fileName: input.company ? `${input.company} cover letter` : input.jobTitle || 'Cover letter',
        summary: `${input.tone} · ${wordCount} words (AI Generated)`,
      })

      return {
        text,
        paragraphs,
        wordCount,
        tone: input.tone,
        length: input.length,
        meta: {
          mode: 'ai',
          aiReady: true,
          endpoint: '/api/ai/cover-letter',
          note: aiData.offlineNotice || 'Custom tailored by JobKhoj AI (Ollama).',
        },
      }
    }
  } catch (err) {
    console.warn('[CoverLetterService] AI generation fallback:', err.message)
  }

  // Graceful fallback to deterministic local composer
  return generateCoverLetter(input)
}

/** Payload contract for a future LLM call — mirrors generateCoverLetter input. */
export function aiRequest(input = {}) {
  return { endpoint: COVER_ENDPOINT, payload: { ...input, kind: 'cover-letter' } }
}

export default generateCoverLetter
