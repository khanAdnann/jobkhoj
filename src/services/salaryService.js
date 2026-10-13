import { api, request } from './api'
import { findSkills, normalize, uniq } from '@/tools/engine/text.js'
import * as tools from './toolsService'

/**
 * Salary Estimator.
 *
 * A transparent, deterministic model (base × experience curve × location
 * index × skill premium × company type) — every factor is shown to the user,
 * because an estimate nobody can inspect is a guess dressed as a number.
 *
 * Live contract: POST /api/tools/salary/estimate -> same payload as below.
 */
export const SALARY_ENDPOINT = '/api/tools/salary/estimate'

export const SALARY_UNITS = [
  { id: 'LPA', label: '₹ LPA (lakhs per year)' },
  { id: 'monthly', label: '₹ per month' },
]

/** Role families — the first family whose terms appear in the title wins. */
export const ROLE_FAMILIES = [
  { id: 'backend', label: 'Backend Engineering', base: 6.5, terms: ['backend', 'server', 'api', 'java', 'spring', 'node', 'golang', 'rails'] },
  { id: 'frontend', label: 'Frontend Engineering', base: 6.0, terms: ['frontend', 'front end', 'react', 'angular', 'vue', 'ui engineer'] },
  { id: 'fullstack', label: 'Full Stack Engineering', base: 7.0, terms: ['full stack', 'fullstack', 'full-stack', 'software engineer', 'developer', 'sde', 'programmer'] },
  { id: 'devops', label: 'DevOps & SRE', base: 8.0, terms: ['devops', 'sre', 'site reliability', 'platform', 'infrastructure', 'cloud', 'kubernetes', 'aws'] },
  { id: 'data', label: 'Data Engineering', base: 8.5, terms: ['data engineer', 'data scientist', 'machine learning', 'ai engineer', 'analytics', 'ml engineer', 'big data'] },
  { id: 'mobile', label: 'Mobile Engineering', base: 6.5, terms: ['android', 'ios', 'mobile', 'flutter', 'react native'] },
  { id: 'qa', label: 'QA & Test Automation', base: 5.0, terms: ['qa', 'quality', 'test automation', 'sdet', 'tester'] },
  { id: 'design', label: 'Product Design', base: 6.0, terms: ['designer', 'ux', 'ui/ux', 'product design', 'graphic'] },
  { id: 'product', label: 'Product Management', base: 12.0, terms: ['product manager', 'product owner', 'program manager', 'pm '] },
  { id: 'marketing', label: 'Marketing & Growth', base: 5.5, terms: ['marketing', 'growth', 'seo', 'content', 'brand'] },
  { id: 'sales', label: 'Sales & Business Dev', base: 6.0, terms: ['sales', 'business development', 'account executive', 'bde'] },
  { id: 'support', label: 'Support & Operations', base: 4.0, terms: ['support', 'operations', 'customer success', 'technical support'] },
]

/** City → market index. Anything not listed uses the national baseline. */
export const LOCATION_INDEX = {
  bengaluru: 1.1, bangalore: 1.1,
  hyderabad: 1.05,
  pune: 1.0,
  chennai: 0.95,
  mumbai: 1.05,
  gurugram: 1.05, gurgaon: 1.05,
  noida: 0.95,
  'new delhi': 0.95, delhi: 0.95,
  kolkata: 0.85,
  ahmedabad: 0.85,
  coimbatore: 0.8, jaipur: 0.8, indore: 0.8, kochi: 0.8, chandigarh: 0.85, 'vadodara': 0.8,
  remote: 0.95,
  'san francisco': 4.6, 'new york': 4.4, london: 3.6, singapore: 3.2, dubai: 2.4, toronto: 3.0,
}

/** Skills that reliably move the offer (India product-market premium). */
export const PREMIUM_SKILLS = [
  'kubernetes', 'kafka', 'spark', 'terraform', 'machine learning', 'deep learning',
  'golang', 'rust', 'scala', 'graphql', 'react native', 'data pipeline', 'llm',
  'airflow', 'snowflake', 'elasticsearch', 'redis', 'microservices', 'aws',
  'azure', 'typescript', 'system design', 'distributed systems',
]

export const COMPANY_TYPES = [
  { id: 'product', label: 'Product / SaaS', factor: 1.2 },
  { id: 'startup', label: 'Startup', factor: 1.0 },
  { id: 'services', label: 'IT Services', factor: 0.85 },
  { id: 'enterprise', label: 'Large Enterprise / MNC', factor: 1.05 },
  { id: 'top', label: 'Top-tier (FAANG-equivalent)', factor: 1.7 },
]

const SENIORITY_CURVE = [
  { maxYears: 1, factor: 0.55 },
  { maxYears: 3, factor: 0.85 },
  { maxYears: 5, factor: 1.1 },
  { maxYears: 8, factor: 1.4 },
  { maxYears: 12, factor: 1.75 },
  { maxYears: Infinity, factor: 2.1 },
]

const round = (value) => Math.round(value * 10) / 10

function matchFamily(jobTitle) {
  const title = normalize(jobTitle)
  if (!title) return ROLE_FAMILIES.find((family) => family.id === 'fullstack')
  return ROLE_FAMILIES.find((family) => family.terms.some((term) => title.includes(term)))
    ?? ROLE_FAMILIES.find((family) => family.id === 'fullstack')
}

function locationIndex(location) {
  const key = normalize(location)
  if (!key) return 1
  const direct = LOCATION_INDEX[key]
  if (direct) return direct
  const partial = Object.keys(LOCATION_INDEX).find((city) => key.includes(city))
  return partial ? LOCATION_INDEX[partial] : 1
}

function seniorityFactor(years) {
  const y = Number(years) || 0
  return SENIORITY_CURVE.find((band) => y <= band.maxYears).factor
}

/**
 * @param {{jobTitle:string,experience:number|string,location:string,
 *          skills:string[]|string,companyType?:string,unit?:string}} input
 */
export function estimateSalary(input = {}) {
  const {
    jobTitle = '',
    experience = 0,
    location = '',
    skills = [],
    companyType = 'product',
    unit = 'LPA',
  } = input

  const skillList = Array.isArray(skills)
    ? skills.filter(Boolean)
    : String(skills).split(',').map((skill) => skill.trim()).filter(Boolean)

  const family = matchFamily(jobTitle)
  const years = Number(experience) || 0
  const locIndex = locationIndex(location)

  const matched = uniq([
    ...skillList.map((skill) => normalize(skill)),
    ...findSkills(`${jobTitle} ${skillList.join(' ')}`),
  ])
  const premiumHits = matched.filter((skill) =>
    PREMIUM_SKILLS.some((premium) => skill.includes(premium) || premium.includes(skill)),
  )
  const skillPremium = Math.min(0.35, premiumHits.length * 0.05)

  const company = COMPANY_TYPES.find((item) => item.id === companyType) ?? COMPANY_TYPES[1]

  const base = family.base
  const sFactor = seniorityFactor(years)

  const midpoint = base * sFactor * locIndex * (1 + skillPremium) * company.factor

  const spread = 0.18
  const p25 = round(midpoint * (1 - spread))
  const p50 = round(midpoint)
  const p75 = round(midpoint * (1 + spread * 1.4))

  const factors = [
    { label: 'Role family', value: family.label, impact: `${base.toFixed(1)}L base` },
    { label: 'Experience', value: `${years} year${years === 1 ? '' : 's'}`, impact: `×${sFactor.toFixed(2)}` },
    { label: 'Location', value: location || 'National average', impact: `×${locIndex.toFixed(2)}` },
    { label: 'Skill premium', value: premiumHits.length ? `${premiumHits.length} in-demand skill${premiumHits.length > 1 ? 's' : ''}` : 'None matched', impact: `+${Math.round(skillPremium * 100)}%` },
    { label: 'Company type', value: company.label, impact: `×${company.factor.toFixed(2)}` },
  ]

  let min = p25
  let max = p75
  if (unit === 'monthly') {
    min = round((p25 * 100000) / 12)
    max = round((p75 * 100000) / 12)
  }

  return {
    currency: 'INR',
    unit,
    min,
    max,
    p25,
    p50,
    p75,
    family: family.label,
    factors,
    premiumSkills: premiumHits,
    note: 'Estimate only — offers vary with equity, bonus, notice period and negotiation.',
    meta: {
      mode: 'mock',
      endpoint: SALARY_ENDPOINT,
      note: 'Deterministic model shown factor-by-factor. Swap for a market-data API when available.',
    },
  }
}

/** Live wrapper with the identical payload shape. */
export function estimateSalaryAsync(input = {}) {
  return request(
    () => api.post(SALARY_ENDPOINT, input),
    async () => estimateSalary(input),
  )
}

/** Records the run so the history page stays honest about free usage. */
export function recordEstimate(input, result) {
  return tools.recordHistory({
    toolId: 'salary-estimator',
    tool: 'Salary Estimator',
    fileName: input.jobTitle || 'Salary estimate',
    summary: `${result.min}–${result.max} ${result.unit} · ${result.factors[0]?.value ?? ''}`,
  })
}

export default estimateSalary
