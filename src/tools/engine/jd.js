import { SKILL_VOCABULARY, SENIORITY_LEVELS, KNOWN_LOCATIONS, DEGREE_PATTERNS, JOB_TITLE_VOCABULARY } from '../data/skillBank'
import { containsTerm, extractStructuredKeywords, findSkills, normalize, uniq } from './text.js'
import { experienceFromText, yearsToMonths } from './timeline.js'

/**
 * Job-description parsing + resume↔JD comparison.
 *
 * Everything is derived from the text the user pastes: no stored profiles, no
 * network. The same parser feeds three tools — JD Analyzer, Resume Optimizer
 * and Skill Gap Analyzer — so their answers can never disagree.
 */

const HEADING_PATTERNS = {
  responsibilities: /^(responsibilities|what you.?ll do|role responsibilities|key responsibilities|about the role|duties)/i,
  requirements: /^(requirements|must have|mandatory|qualifications|what you need|skills required|required skills|minimum qualifications)/i,
  preferred: /(nice to have|preferred|plus point|bonus|good to have|desirable)/i,
  company: /^(about (the )?company|about us|company profile|who we are)/i,
}

const TECH_GROUPS = ['language', 'framework', 'cloud', 'devops', 'database', 'data', 'frontend']

function isHeadingLine(line) {
  const trimmed = String(line).trim()
  if (!trimmed || trimmed.length > 45) return false
  if (/[,.;]$/.test(trimmed)) return false
  if (trimmed.split(/\s+/).length > 6) return false
  return Object.values(HEADING_PATTERNS).some((pattern) => pattern.test(trimmed))
}

/** Splits a JD into the buckets a recruiter would recognise. */
export function splitSections(text = '') {
  const lines = String(text).split(/\r?\n/)
  const sections = { intro: [], responsibilities: [], requirements: [], preferred: [], company: [] }
  let current = 'intro'

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (isHeadingLine(trimmed)) {
      if (HEADING_PATTERNS.responsibilities.test(trimmed)) current = 'responsibilities'
      else if (HEADING_PATTERNS.preferred.test(trimmed)) current = 'preferred'
      else if (HEADING_PATTERNS.requirements.test(trimmed)) current = 'requirements'
      else if (HEADING_PATTERNS.company.test(trimmed)) current = 'company'
      return
    }
    sections[current].push(line)
  })

  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join('\n').trim()]),
  )
}

function extractTitle(text, lines) {
  const head = lines.slice(0, 6).join(' ')
  const known = JOB_TITLE_VOCABULARY.find((title) => containsTerm(head, title))
  if (known) return known

  const candidate = lines
    .map((line) => line.trim())
    .filter((line) => line && line.length <= 60 && !/@|http|\|/.test(line))
    .find((line) => {
      const words = line.split(/\s+/)
      return words.length <= 8 && words.some((word) => /[a-z]/i.test(word))
    })
  return candidate ?? ''
}

function extractExperienceRequirement(text) {
  const source = String(text)
  const range = source.match(/(\d+)\s*\+?\s*(?:-|–|to|and)\s*(\d+)\s*\+?\s*years?/i)
  if (range) return { minYears: Number(range[1]), maxYears: Number(range[2]), raw: range[0] }

  const single = source.match(/(\d+)\s*\+?\s*years?\s*(?:of)?\s*(?:experience|exp\.?)?/i)
  if (single) return { minYears: Number(single[1]), maxYears: Number(single[1]), raw: single[0] }

  if (/\bfresher|entry level|0\s*(?:-|–)\s*\d+\s*years/i.test(text)) {
    return { minYears: 0, maxYears: 0, raw: 'Fresher / entry level' }
  }
  return null
}

function extractSalary(text) {
  const source = String(text)
  const lpaRange = source.match(/(?:₹|rs\.?|inr)\s*([\d.,]+)\s*(?:-|–|to)\s*([\d.,]+)\s*(lpa|lakh|lakhs|k)?/i)
  if (lpaRange) {
    return { min: Number(lpaRange[1].replace(/,/g, '')), max: Number(lpaRange[2].replace(/,/g, '')), unit: 'LPA', raw: lpaRange[0] }
  }
  const plainRange = source.match(/([\d.,]+)\s*(?:-|–|to)\s*([\d.,]+)\s*(lpa|lakhs?|lpa)/i)
  if (plainRange) {
    return { min: Number(plainRange[1].replace(/,/g, '')), max: Number(plainRange[2].replace(/,/g, '')), unit: 'LPA', raw: plainRange[0] }
  }
  const single = source.match(/(?:₹|rs\.?|inr)\s*([\d.,]+)\s*(lpa|lakh|lakhs)?/i)
  if (single) {
    const amount = Number(single[1].replace(/,/g, ''))
    return { min: amount, max: amount, unit: single[2]?.toLowerCase().startsWith('l') ? 'LPA' : 'INR', raw: single[0] }
  }
  const usd = source.match(/\$\s*([\d,]+)\s*(?:-|–|to)\s*\$?\s*([\d,]+)/)
  if (usd) {
    return { min: Number(usd[1].replace(/,/g, '')), max: Number(usd[2].replace(/,/g, '')), unit: 'USD', raw: usd[0] }
  }
  return null
}

function extractSeniority(text) {
  const source = normalize(text)
  const match = SENIORITY_LEVELS.find((level) =>
    level.markers.some((marker) => source.includes(marker.toLowerCase())),
  )
  return match ? { key: match.key, label: match.label } : { key: 'unspecified', label: 'Not specified' }
}

function extractEducation(text) {
  const patterns = [
    [/ph\.?d/i, 'Ph.D.'],
    [/m\.?tech/i, 'M.Tech'],
    [/mba\b/i, 'MBA'],
    [/master/i, "Master's"],
    [/b\.?tech|b\.?e\b|bachelor/i, "Bachelor's"],
    [/diploma/i, 'Diploma'],
    [/graduate|b\.?sc|b\.?com|b\.?ca/i, 'Graduate'],
  ]
  const hit = patterns.find(([pattern]) => pattern.test(text))
  return hit ? hit[1] : null
}

function extractLocation(text) {
  const source = String(text)
  const hits = KNOWN_LOCATIONS.filter((place) => containsTerm(source, place))
  const unique = uniq(hits.map((place) => (['Bangalore'].includes(place) ? 'Bengaluru' : place)))
  return unique.slice(0, 3)
}

function bulletsFrom(block) {
  return String(block)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*▪●]?\s*/, ''))
    .filter((line) => line.length > 12)
    .slice(0, 8)
}

/**
 * @param {string} text raw job description
 */
export function parseJobDescription(text = '') {
  const source = String(text)
  const lines = source.split(/\r?\n/)
  const sections = splitSections(source)
  const requirementText = [sections.requirements, sections.intro].filter(Boolean).join('\n')
  const preferredSource = sections.preferred || ''

  const required = uniq(findSkills(requirementText).map((skill) => skill.name))
  const preferred = uniq(findSkills(preferredSource).map((skill) => skill.name)).filter(
    (skill) => !required.includes(skill),
  )
  const fallbackSkills = required.length ? required : uniq(findSkills(source).map((skill) => skill.name))

  const technologies = uniq(
    SKILL_VOCABULARY.filter(
      (skill) =>
        (required.includes(skill.name) || preferred.includes(skill.name)) &&
        TECH_GROUPS.includes(skill.group),
    ).map((skill) => skill.name),
  )
  const softSkills = uniq(
    findSkills(source).filter((skill) => skill.group === 'soft').map((skill) => skill.name),
  )

  const experience = extractExperienceRequirement(source)
  const title = extractTitle(source, lines)

  const keywords = uniq([
    ...fallbackSkills,
    ...extractStructuredKeywords(source).actionVerbs.slice(0, 4),
  ]).slice(0, 20)

  return {
    title,
    seniority: extractSeniority(`${title} ${source.slice(0, 800)}`),
    experience,
    education: extractEducation(source),
    locations: extractLocation(source),
    salary: extractSalary(source),
    skills: { required: fallbackSkills, preferred },
    technologies,
    softSkills,
    responsibilities: bulletsFrom(sections.responsibilities),
    companyBlurb: sections.company ? bulletsFrom(sections.company).slice(0, 2) : [],
    keywords,
    stats: {
      characters: source.length,
      words: source.split(/\s+/).filter(Boolean).length,
      detectedSkills: fallbackSkills.length + preferred.length,
    },
  }
}

/* -------------------------------- matching ------------------------------- */

function titleSimilarity(resumeText, jdTitle) {
  if (!jdTitle) return null
  const resumeTitleSet = extractStructuredKeywords(resumeText).jobTitles
  if (resumeTitleSet.some((title) => containsTerm(title, jdTitle) || containsTerm(jdTitle, title))) {
    return 100
  }

  const jdTokens = normalize(jdTitle)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !['the', 'and', 'for'].includes(token))
  const resumeTokens = normalize(resumeText.slice(0, 1500)).split(/\s+/)
  if (!jdTokens.length) return null
  const hit = jdTokens.filter((token) => resumeTokens.includes(token)).length
  return Math.round((hit / jdTokens.length) * 100)
}

function experienceScore(resumeText, requirement) {
  if (!requirement || requirement.minYears === 0) return { score: 100, note: null }
  const actual = experienceFromText(resumeText)
  if (!actual.months) return { score: 60, note: 'Could not detect your total experience from the resume text.' }

  const requiredMonths = yearsToMonths(requirement.minYears)
  const score = Math.round(Math.min(100, (actual.months / requiredMonths) * 100))
  return {
    score,
    note:
      score >= 100
        ? `You meet the ${requirement.minYears}+ year requirement.`
        : `You show ${actual.label.toLowerCase()} against a ${requirement.minYears}+ year requirement.`,
  }
}

/**
 * Resume ↔ job description fit.
 * @param {string} resumeText
 * @param {string} jdText
 */
export function matchResumeToJd(resumeText = '', jdText = '') {
  const jd = parseJobDescription(jdText)
  const resumeSkills = new Set(findSkills(resumeText).map((skill) => skill.name))

  const required = jd.skills.required
  const preferred = jd.skills.preferred

  const matchedRequired = required.filter((skill) => resumeSkills.has(skill))
  const missingRequired = required.filter((skill) => !resumeSkills.has(skill))
  const missingPreferred = preferred.filter((skill) => !resumeSkills.has(skill))

  const skillMatch = required.length
    ? Math.round((matchedRequired.length / required.length) * 100)
    : 0

  const jdKeywords = jd.keywords.filter((keyword) => keyword.length > 2)
  const matchedKeywords = jdKeywords.filter((keyword) =>
    normalize(resumeText).includes(normalize(keyword)),
  )
  const missingKeywords = jdKeywords.filter((keyword) => !matchedKeywords.includes(keyword))
  const keywordMatch = jdKeywords.length
    ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
    : skillMatch

  const experience = experienceScore(resumeText, jd.experience)
  const titleMatch = titleSimilarity(resumeText, jd.title)

  const weights = [
    { key: 'skills', label: 'Skill Match', score: skillMatch, weight: 40 },
    { key: 'keywords', label: 'Keyword Match', score: keywordMatch, weight: 20 },
    { key: 'experience', label: 'Experience Match', score: experience.score, weight: 20 },
    { key: 'title', label: 'Job Title Match', score: titleMatch, weight: 20 },
  ].filter((row) => row.score !== null)

  const totalWeight = weights.reduce((sum, row) => sum + row.weight, 0)
  const matchScore = Math.round(
    weights.reduce((sum, row) => sum + row.score * row.weight, 0) / totalWeight,
  )

  const recommendations = []
  if (missingRequired.length) {
    recommendations.push({
      priority: 'High',
      text: `Add the required skills you are missing: ${missingRequired.slice(0, 6).join(', ')}.`,
    })
  }
  if (experience.score < 100 && experience.note) recommendations.push({ priority: 'High', text: experience.note })
  if (keywordMatch < 70) {
    recommendations.push({
      priority: 'Medium',
      text: `Mirror the job description's wording — ${missingKeywords.slice(0, 5).join(', ')} do not appear in your resume.`,
    })
  }
  if (titleMatch !== null && titleMatch < 50) {
    recommendations.push({
      priority: 'Medium',
      text: `Use the target title "${jd.title}" in your headline so the recruiter sees the fit immediately.`,
    })
  }
  if (missingPreferred.length) {
    recommendations.push({
      priority: 'Low',
      text: `Nice-to-have gaps: ${missingPreferred.slice(0, 5).join(', ')}.`,
    })
  }
  if (!recommendations.length) {
    recommendations.push({ priority: 'Low', text: 'Strong alignment — apply with confidence.' })
  }

  return {
    matchScore,
    jdTitle: jd.title,
    matchedKeywords,
    missingKeywords,
    matchedRequired,
    missingRequired,
    missingPreferred,
    skillMatch,
    keywordMatch,
    experienceMatch: experience.score,
    jobTitleMatch: titleMatch,
    experienceNote: experience.note,
    breakdown: weights.map((row) => ({ ...row, label: row.label })),
    recommendations,
    jd,
  }
}

/* ------------------------------- skill gap ------------------------------- */

/**
 * @returns {{have:string[],missing:Array<{name:string,priority:'High'|'Medium'|'Low'}>,
 *            priorityCounts:{High:number,Medium:number,Low:number}, coverage:number}}
 */
export function skillGap(resumeText = '', jdText = '') {
  const jd = parseJobDescription(jdText)
  const resumeSkills = new Set(findSkills(resumeText).map((skill) => skill.name))
  const allJdSkills = uniq([...jd.skills.required, ...jd.skills.preferred])

  const have = allJdSkills.filter((skill) => resumeSkills.has(skill))
  const missing = allJdSkills
    .filter((skill) => !resumeSkills.has(skill))
    .map((name) => ({
      name,
      priority: jd.skills.required.includes(name) ? 'High' : 'Medium',
      group: SKILL_VOCABULARY.find((skill) => skill.name === name)?.group ?? 'other',
    }))

  // Bonus-list skills mentioned only under "nice to have" drop to Low.
  jd.skills.preferred.forEach((name) => {
    const entry = missing.find((item) => item.name === name)
    if (entry && entry.priority === 'Medium') entry.priority = 'Low'
  })

  const priorityCounts = {
    High: missing.filter((item) => item.priority === 'High').length,
    Medium: missing.filter((item) => item.priority === 'Medium').length,
    Low: missing.filter((item) => item.priority === 'Low').length,
  }

  const others = uniq(findSkills(resumeText).map((skill) => skill.name)).filter(
    (skill) => !allJdSkills.includes(skill),
  )

  return {
    have,
    missing,
    priorityCounts,
    others,
    coverage: allJdSkills.length ? Math.round((have.length / allJdSkills.length) * 100) : 0,
    jdTitle: jd.title,
  }
}

/** Keyword-only extraction used by the JD Analyzer cards. */
export function analyzeJobDescription(text = '') {
  const parsed = parseJobDescription(text)
  const structured = extractStructuredKeywords(text)
  return {
    ...parsed,
    softSkills: parsed.softSkills.length ? parsed.softSkills : structured.softSkills.slice(0, 6),
    responsibilities: parsed.responsibilities.length
      ? parsed.responsibilities
      : String(text)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 30)
          .slice(0, 5),
  }
}

export default parseJobDescription
