import { SKILL_VOCABULARY, RESUME_KEYWORD_BANK, DEGREE_PATTERNS } from '../data/skillBank.js'
import {
  countWords,
  extractActionVerbs,
  extractStructuredKeywords,
  findSections,
  missingSkills,
  uniq,
} from './text.js'

/**
 * Deterministic ATS scoring engine.
 *
 * Recruiters screen resumes through an Applicant Tracking System before a
 * human ever sees them, so this mirrors what those parsers reward: parseable
 * contact details, standard section headings, keyword coverage, quantified
 * impact and clean formatting. Every number here is reproducible from the
 * input text — no hidden state, no network.
 *
 * When an AI provider is connected later, `buildAnalysisPayload()` describes
 * exactly what to send; the scoring below stays as the offline fallback.
 */

export const ATS_CATEGORIES = [
  { key: 'contact', label: 'Contact Information', weight: 8 },
  { key: 'summary', label: 'Professional Summary', weight: 9 },
  { key: 'skills', label: 'Skills', weight: 14 },
  { key: 'experience', label: 'Work Experience', weight: 16 },
  { key: 'education', label: 'Education', weight: 7 },
  { key: 'projects', label: 'Projects', weight: 6 },
  { key: 'certifications', label: 'Certifications', weight: 4 },
  { key: 'keywords', label: 'Keywords', weight: 12 },
  { key: 'formatting', label: 'Formatting', weight: 8 },
  { key: 'structure', label: 'Resume Structure', weight: 8 },
  { key: 'achievements', label: 'Achievements', weight: 8 },
]

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))

export function scoreBand(score) {
  if (score >= 85) return { label: 'Excellent', tone: 'success' }
  if (score >= 70) return { label: 'Good', tone: 'success' }
  if (score >= 50) return { label: 'Needs work', tone: 'warning' }
  return { label: 'Weak', tone: 'danger' }
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/
const PHONE = /(\+?\d{1,3}[\s-]?)?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/
const LINK = /(linkedin\.com|github\.com|behance\.net|dribbble\.com|https?:\/\/)/i
const DATE_RANGE =
  /\b(19|20)\d{2}\b\s*[-–to]+\s*((19|20)\d{2}|present|current|now)/i
const BULLET = /^\s*([•●▪‣\-*–]|\d+[.)])\s+/
const QUANTIFIED = /(\d+(\.\d+)?\s*%|\+\d+|\b\d+x\b|₹\s?\d|[$€£]\s?\d|\b\d{2,}\b)/

function detectBulletCount(text) {
  return String(text)
    .split(/\r?\n/)
    .filter((line) => BULLET.test(line)).length
}

function longestLine(text) {
  return String(text).split(/\r?\n/).reduce((max, line) => Math.max(max, line.trim().length), 0)
}

function allCapsRatio(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3)
  if (!lines.length) return 0
  const shouty = lines.filter((line) => line === line.toUpperCase() && /[A-Z]/.test(line))
  return shouty.length / lines.length
}

/* --------------------------- individual checks --------------------------- */

function scoreContact(text, sections) {
  const findings = []
  let score = 0

  if (EMAIL.test(text)) score += 30
  else findings.push('No email address found — an ATS cannot route your application without one.')

  if (PHONE.test(text)) score += 25
  else findings.push('No phone number found.')

  if (LINK.test(text)) score += 25
  else findings.push('Add a LinkedIn, GitHub or portfolio link.')

  const hasLocation =
    /\b(city|road|street|nagar|puram|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|chennai|india|remote)\b/i.test(
      text,
    )
  if (hasLocation) score += 20
  else findings.push('No location line found — recruiters filter on city before anything else.')

  if (!sections.summary && !findings.length) {
    findings.push('Contact block looks complete.')
  }

  return { score: clamp(score), findings }
}

function scoreSummary(sections) {
  const body = sections.summary?.body ?? ''
  const words = countWords(body)
  const findings = []

  if (!body) {
    return {
      score: 0,
      findings: ['Missing a Professional Summary. Add 3–5 lines that state your role, years of experience and strongest domain.'],
    }
  }

  let score = 45
  if (words >= 25 && words <= 90) score += 35
  else if (words > 90) findings.push(`Summary is ${words} words — trim it to 25–90 so the first screen stays skimmable.`)
  else findings.push(`Summary is only ${words} words — aim for 25–90.`)

  const skillHits = extractStructuredKeywords(body).all.length
  if (skillHits >= 3) score += 20
  else findings.push('Name 2–3 core skills in the summary so keyword filters pick them up.')

  return { score: clamp(score), findings }
}

function scoreSkills(text, sections) {
  const body = sections.skills?.body ?? text
  const found = extractStructuredKeywords(body).all
  const groups = uniq(
    SKILL_VOCABULARY.filter((skill) => found.includes(skill.name)).map((skill) => skill.group),
  )
  const findings = []

  if (!sections.skills) {
    return { score: 0, findings: ['No dedicated Skills section. ATS parsers expect one with a clear heading.'] }
  }

  let score = 25
  score += Math.min(40, found.length * 3)
  score += Math.min(35, groups.length * 9)

  if (found.length < 8) findings.push(`Only ${found.length} recognised skills found — list 8–15 concrete ones.`)
  if (groups.length < 3) findings.push('Skills span fewer than 3 areas (languages, frameworks, tools, databases).')

  return { score: clamp(score), findings }
}

function scoreExperience(text, sections) {
  const body = sections.experience?.body ?? ''
  const findings = []

  if (!sections.experience) {
    return { score: 0, findings: ['No Work Experience section found.'] }
  }

  const roles = (body.match(DATE_RANGE) ?? []).length
  const bullets = detectBulletCount(body)
  const verbs = extractActionVerbs(body).length
  let score = 25

  score += Math.min(30, roles * 15)
  score += Math.min(25, Math.round((bullets / 8) * 25))
  score += Math.min(20, verbs * 5)

  if (!roles) findings.push('No "2021 – Present"-style date ranges detected — add them to every role.')
  if (bullets < 6) findings.push(`${bullets} bullet points found; use at least 6 across your roles.`)
  if (verbs < 4) findings.push('Open each bullet with a strong action verb (built, led, reduced, migrated).')

  const share = countWords(body) / Math.max(1, countWords(text))
  if (share > 0.75) findings.push('Experience dominates the document — rebalance skills and summary.')
  if (share < 0.2 && countWords(text) > 120) findings.push('Experience section is thin relative to the rest of the resume.')

  return { score: clamp(score), findings }
}

function scoreEducation(sections) {
  const body = sections.education?.body ?? ''
  if (!sections.education) {
    return { score: 0, findings: ['No Education section found.'] }
  }

  const findings = []
  let score = 55
  if (DEGREE_PATTERNS.some((pattern) => pattern.test(body))) score += 30
  else findings.push('Degree name not detected (B.Tech / B.E / Bachelor / MBA …).')
  if (/\b(19|20)\d{2}\b/.test(body)) score += 15
  else findings.push('Add your passing year.')

  return { score: clamp(score), findings }
}

function scoreProjects(sections) {
  if (!sections.projects) {
    return {
      score: 0,
      findings: ['No Projects section. Even 1–2 projects signal hands-on ability, especially under 5 years of experience.'],
    }
  }
  const body = sections.projects.body
  const findings = []
  const count = (body.match(DATE_RANGE) ?? []).length + (body.match(BULLET) ?? []).length
  let score = 55
  score += Math.min(30, count * 8)
  if (LINK.test(body)) score += 15
  else findings.push('Link each project to its repository or live demo.')

  return { score: clamp(score), findings }
}

function scoreCertifications(sections) {
  if (!sections.certifications) {
    return { score: 0, findings: ['No Certifications section — add one if you hold any credential.'] }
  }
  const body = sections.certifications.body
  const entries = body.split(/\r?\n/).filter((line) => line.trim().length > 3)
  return {
    score: clamp(60 + Math.min(40, entries.length * 20)),
    findings: entries.length ? [] : ['Certifications section is empty.'],
  }
}

function scoreKeywords(text) {
  const structured = extractStructuredKeywords(text)
  const hits = structured.all.length
  const verbs = structured.actionVerbs.length
  const score = clamp((Math.min(18, hits) / 18) * 65 + (Math.min(8, verbs) / 8) * 35)

  const findings = []
  if (hits < 8) findings.push(`Only ${hits} recognised keywords present — target 15+ for your target role.`)
  if (verbs < 4) findings.push('Add more action verbs; keyword filters weight them heavily.')

  const missing = missingSkills(
    text,
    SKILL_VOCABULARY.filter((skill) => ['language', 'framework', 'devops', 'cloud', 'database'].includes(skill.group)),
  ).slice(0, 12)

  return { score, findings, missing }
}

function scoreFormatting(text) {
  const findings = []
  let score = 100

  const words = countWords(text)
  const longest = longestLine(text)
  const caps = allCapsRatio(text)

  if (words > 900) {
    score -= 25
    findings.push(`${words} words — most ATS templates expect under 700–800.`)
  }
  if (words < 180) {
    score -= 25
    findings.push(`Only ${words} words — the document looks under-filled.`)
  }
  if (longest > 160) {
    score -= 20
    findings.push(`A line runs to ${longest} characters; break long paragraphs into bullets.`)
  }
  if (caps > 0.35) {
    score -= 20
    findings.push(`${Math.round(caps * 100)}% of lines are ALL CAPS — reserve caps for headings only.`)
  }
  const hasDecorative = Array.from(text).some((ch) => {
    const code = ch.codePointAt(0)
    const ALLOWED = '\u00A0₹€£•●▪'
    if (code < 32 || code === 127) return true
    if (code > 0x024f && !ALLOWED.includes(ch)) return true
    return false
  })
  if (hasDecorative) {
    score -= 10
    findings.push('Decorative characters detected; stick to plain text so parsers keep the order.')
  }
  if (/\s{4,}/.test(text)) {
    score -= 10
    findings.push('Runs of 4+ spaces found — usually manual alignment, which ATS parsers scramble.')
  }
  if (/[\t]/.test(text) && detectBulletCount(text) === 0) {
    score -= 10
    findings.push('Tab-separated layout without bullets; use real bullet points instead.')
  }
  if (!findings.length) findings.push('No structural formatting problems detected.')

  return { score: clamp(score), findings }
}

function scoreStructure(sections) {
  const found = Object.keys(sections)
  const critical = ['contact', 'experience', 'education']
  const findings = []

  let score = Math.min(70, (found.length / 7) * 70)
  if (critical.every((key) => key === 'contact' || sections[key])) score += 30

  const missingCritical = ['summary', 'skills', 'experience', 'education'].filter(
    (key) => !sections[key],
  )
  if (missingCritical.length) {
    findings.push(`Missing standard sections: ${missingCritical
      .map((key) => ({ summary: 'Professional Summary', skills: 'Skills', experience: 'Work Experience', education: 'Education' })[key])
      .join(', ')}.`)
  } else {
    findings.push('All four standard sections are present and in a parser-friendly order.')
  }

  return { score: clamp(score), findings }
}

function scoreAchievements(text, sections) {
  const source = sections.experience?.body ?? text
  const quantified = source.split(/\r?\n/).filter((line) => BULLET.test(line) && QUANTIFIED.test(line))
  const findings = []
  let score = Math.min(55, quantified.length * 11)

  if (sections.achievements) score += 30
  if (/\b(award|winner|rank|top\s+\d|scholarship|certified)\b/i.test(text)) score += 15

  if (!quantified.length) {
    findings.push('No quantified results found — add numbers (%, ₹, "3× faster") to at least 3 bullets.')
  }
  if (!sections.achievements) {
    findings.push('Consider a separate Achievements section for awards and ranks.')
  }
  if (!findings.length) findings.push('Quantified impact is present across your bullets.')

  return { score: clamp(score), findings, quantified: quantified.length }
}

/* ------------------------------- main entry ------------------------------ */

/**
 * @param {string} text plain-text resume
 * @param {{fileName?:string}} meta
 */
export function scoreResume(text = '', meta = {}) {
  const source = String(text)
  const sections = findSections(source)
  const wordCount = countWords(source)

  const contact = scoreContact(source, sections)
  const summary = scoreSummary(sections)
  const skills = scoreSkills(source, sections)
  const experience = scoreExperience(source, sections)
  const education = scoreEducation(sections)
  const projects = scoreProjects(sections)
  const certifications = scoreCertifications(sections)
  const keywords = scoreKeywords(source)
  const formatting = scoreFormatting(source)
  const structure = scoreStructure(sections)
  const achievements = scoreAchievements(source, sections)

  const results = {
    contact,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    keywords,
    formatting,
    structure,
    achievements,
  }

  const categories = ATS_CATEGORIES.map((category) => {
    const result = results[category.key]
    return {
      ...category,
      score: result.score,
      findings: result.findings ?? [],
      band: scoreBand(result.score),
    }
  })

  const overall = clamp(
    categories.reduce((total, category) => total + (category.score * category.weight) / 100, 0),
  )

  const weakSections = categories
    .filter((category) => category.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((category) => ({
      key: category.key,
      label: category.label,
      score: category.score,
      advice: category.findings[0] ?? '',
    }))

  const missingKeywords = keywords.missing ?? []
  const formattingIssues = formatting.findings.filter((finding) => !finding.startsWith('No structural'))

  const improvements = [...categories]
    .sort(
      (a, b) =>
        (100 - a.score) * a.weight - (100 - b.score) * b.weight,
    )
    .slice(0, 6)
    .map((category) => ({
      category: category.label,
      score: category.score,
      weight: category.weight,
      action: category.findings[0] ?? `Strengthen the ${category.label} section.`,
    }))

  const suggestions = categories
    .filter((category) => category.score < 85)
    .flatMap((category) => category.findings.map((finding) => `${category.label}: ${finding}`))
    .slice(0, 10)

  return {
    overall,
    band: scoreBand(overall),
    categories,
    missingKeywords,
    weakSections,
    formattingIssues,
    suggestions,
    improvements,
    stats: {
      wordCount,
      sectionsFound: Object.keys(sections).length,
      bullets: detectBulletCount(source),
      quantifiedBullets: achievements.quantified ?? 0,
      recognizedSkills: extractStructuredKeywords(source).all.length,
      actionVerbs: extractActionVerbs(source).length,
      fileName: meta.fileName ?? null,
      engine: 'deterministic-v1',
    },
  }
}

/** Contract for a future LLM-backed deep analysis (kept out of components). */
export function buildAnalysisPayload(text = '', context = {}) {
  return {
    task: 'ats-resume-analysis',
    version: 1,
    resumeText: String(text),
    targetRole: context.targetRole ?? null,
    categories: ATS_CATEGORIES.map((category) => category.key),
  }
}

/** Offline fallback notice so the UI can label results honestly. */
export const ANALYSIS_MODE = {
  engine: 'deterministic-v1',
  aiReady: true,
  note: 'Scored locally with deterministic rules. Connect an AI provider for contextual feedback.',
}

export default scoreResume
