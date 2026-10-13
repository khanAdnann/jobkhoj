import {
  SKILL_VOCABULARY,
  ACTION_VERBS,
  CERTIFICATION_VOCABULARY,
  JOB_TITLE_VOCABULARY,
  vocabularyIndex,
} from '../data/skillBank.js'

/** Lowercase + collapse whitespace so matching never depends on formatting. */
export function normalize(text = '') {
  return String(text).toLowerCase().replace(/\s+/g, ' ').trim()
}

export function countWords(text = '') {
  const trimmed = String(text).trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export function uniq(list) {
  return [...new Set(list)]
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Word-boundary matcher. Short tokens (R, C#, Go) would match inside other
 * words with a plain indexOf, so every needle is wrapped in boundaries.
 */
export function containsTerm(haystack, term) {
  const needle = String(term).trim()
  if (!needle) return false
  const pattern = escapeRegex(needle).replace(/\s+/g, '\\s+')
  return new RegExp(`(^|[^a-z0-9+#.])${pattern}([^a-z0-9+#.]|$)`, 'i').test(haystack)
}

/** @param {string} text @param {string[]} terms @returns {string[]} terms present in `text` */
export function matchTerms(text, terms = []) {
  const source = String(text)
  return terms.filter((term) => containsTerm(source, term))
}

/** Finds vocabulary entries whose name or alias appears in the text. */
export function findSkills(text) {
  const source = String(text)
  return vocabularyIndex()
    .filter((entry) => entry.needles.some((needle) => containsTerm(source, needle)))
    .map((entry) => ({ name: entry.name, group: entry.group }))
}

/** Skills from the vocabulary that are NOT present in the text. */
export function missingSkills(text, candidates = SKILL_VOCABULARY) {
  const present = new Set(findSkills(text).map((skill) => skill.name))
  return candidates
    .map((skill) => skill.name)
    .filter((name) => !present.has(name))
}

export function extractActionVerbs(text) {
  const source = normalize(text)
  return ACTION_VERBS.filter((verb) => new RegExp(`(^|\\s)${verb}(\\s|$)`, 'i').test(source))
}

export function extractCertifications(text) {
  const source = String(text)
  return CERTIFICATION_VOCABULARY.filter((name) => containsTerm(source, name))
}

export function extractJobTitles(text) {
  const source = String(text)
  return JOB_TITLE_VOCABULARY.filter((title) => containsTerm(source, title))
}

/**
 * Categorised keyword tags for the Keyword Extractor tool.
 * Groups follow the vocabulary so the UI can colour them consistently.
 */
export function extractStructuredKeywords(text) {
  const found = findSkills(text)
  const byGroup = (group) => found.filter((skill) => skill.group === group).map((s) => s.name)

  return {
    languages: uniq(byGroup('language')),
    frameworks: uniq(byGroup('framework')),
    tools: uniq([...byGroup('devops'), ...byGroup('tool')]),
    databases: uniq(byGroup('database')),
    cloud: uniq(byGroup('cloud')),
    data: uniq(byGroup('data')),
    frontend: uniq(byGroup('frontend')),
    practices: uniq(byGroup('practice')),
    softSkills: uniq(byGroup('soft')),
    certifications: extractCertifications(text),
    jobTitles: extractJobTitles(text),
    actionVerbs: extractActionVerbs(text),
    /** Flat list used by match/ATS scoring. */
    all: found.map((skill) => skill.name),
  }
}

/** Section headings a resume is expected to expose, with detection patterns. */
export const RESUME_SECTIONS = {
  summary: [/professional summary/i, /summary/i, /profile/i, /objective/i, /about me/i],
  skills: [/skills/i, /technical skills/i, /core competencies/i, /technologies/i],
  experience: [/work experience/i, /experience/i, /employment/i, /professional experience/i],
  education: [/education/i, /academic/i, /qualifications/i],
  projects: [/projects/i, /personal projects/i, /key projects/i],
  certifications: [/certifications/i, /certificates/i, /courses/i],
  achievements: [/achievements/i, /awards/i, /honors/i, /accomplishments/i],
  languages: [/languages/i],
  interests: [/interests/i, /hobbies/i],
}

/**
 * Heuristic: a line is a section heading when it is short, matches a known
 * section pattern and reads like a label rather than a sentence. Resumes use
 * both "EXPERIENCE" and "Work Experience", so title case is accepted too —
 * what is rejected are sentence-shaped lines such as "Experience with Java".
 */
function isHeading(line) {
  const trimmed = String(line).trim()
  if (!trimmed || trimmed.length > 40) return false
  if (/[,.;:!?]$/.test(trimmed)) return false
  const words = trimmed.split(/\s+/)
  if (words.length > 5) return false
  const upper = trimmed === trimmed.toUpperCase()
  const titleCase = words.every((word) => /^[A-Z]/.test(word))
  if (!upper && !titleCase) return false
  return Object.values(RESUME_SECTIONS).some((patterns) =>
    patterns.some((pattern) => pattern.test(trimmed)),
  )
}

/**
 * Finds section blocks in a resume.
 * @returns {Record<string,{heading:string,body:string,line:number}>}
 */
export function findSections(text = '') {
  const lines = String(text).split(/\r?\n/)
  const found = {}

  lines.forEach((line, index) => {
    if (!isHeading(line)) return

    const heading = line.trim()
    const key = Object.entries(RESUME_SECTIONS).find(([, patterns]) =>
      patterns.some((pattern) => pattern.test(heading)),
    )?.[0]
    if (!key || found[key]) return

    const body = []
    for (let i = index + 1; i < lines.length; i += 1) {
      if (isHeading(lines[i])) break
      body.push(lines[i])
    }

    found[key] = { heading, body: body.join('\n'), line: index }
  })

  return found
}

/** Detects weak section bodies (present but empty or tiny). */
export function sectionLength(text = '') {
  return countWords(text)
}

export default {
  normalize,
  countWords,
  uniq,
  containsTerm,
  matchTerms,
  findSkills,
  missingSkills,
  extractActionVerbs,
  extractCertifications,
  extractJobTitles,
  extractStructuredKeywords,
  findSections,
}
