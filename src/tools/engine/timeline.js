/**
 * Date-range maths shared by the Experience Calculator, the JD matcher and
 * the interview generator. Overlapping roles are merged so a resume that
 * lists two jobs covering the same months never double-counts them.
 */

const MONTH_NAMES = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]

function monthIndex(name) {
  return MONTH_NAMES.findIndex((month) => name.toLowerCase().startsWith(month))
}

/**
 * Parses the date formats that actually appear on resumes.
 * @returns {Date|null} day is normalised to the 1st so month maths are stable
 */
export function parseDate(value) {
  if (!value) return null
  const raw = String(value).trim()

  if (/^(present|current|now|till date|to date)$/i.test(raw)) return null

  // Jan 2021 / January 2021
  const named = raw.match(/^([a-z]{3,9})\.?\s+(\d{4})$/i)
  if (named && monthIndex(named[1]) >= 0) {
    return new Date(Number(named[2]), monthIndex(named[1]), 1)
  }

  // 2021-06 / 2021/06 / 06-2021 / 06/2021
  const numeric = raw.match(/^(\d{4})[-/.](\d{1,2})$|^(\d{1,2})[-/.](\d{4})$/)
  if (numeric) {
    const year = Number(numeric[1] ?? numeric[4])
    const month = Number(numeric[2] ?? numeric[3]) - 1
    if (month >= 0 && month <= 11) return new Date(year, month, 1)
  }

  // Bare year
  const yearOnly = raw.match(/^(19|20)\d{2}$/)
  if (yearOnly) return new Date(Number(raw), 0, 1)

  // Fallback: let the engine try (covers "Jun 2023", "2021")
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Turns "Jan 2021 - Jun 2023" / "2021 to Present" into a normalised range. */
export function parseRange(startValue, endValue, today = new Date()) {
  const start = parseDate(startValue)
  const end = parseDate(endValue) ?? (start ? today : null)
  if (!start || !end || end < start) return null
  return { start, end }
}

function toMonths(date) {
  return date.getFullYear() * 12 + date.getMonth()
}

/** Merges overlapping/adjacent ranges into disjoint blocks. */
export function mergeRanges(ranges) {
  const valid = ranges
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
    .map((range) => ({ start: new Date(range.start), end: new Date(range.end) }))

  return valid.reduce((merged, range) => {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end) {
      if (range.end > last.end) last.end = range.end
      return merged
    }
    return [...merged, range]
  }, [])
}

/**
 * @param {Array<{start:Date|string,end:Date|string,label?:string}>} periods
 * @returns {{months:number,years:number,remainingMonths:number,label:string,
 *            overlaps:number,blocks:Array<{start:Date,end:Date,months:number}>}}
 */
export function totalExperience(periods = []) {
  const parsed = periods
    .map((period) => ({
      label: period.label,
      ...parseRange(period.start, period.end),
    }))
    .filter(Boolean)

  const blocks = mergeRanges(parsed).map((block) => ({
    ...block,
    months: Math.max(0, toMonths(block.end) - toMonths(block.start)),
  }))

  const months = blocks.reduce((total, block) => total + block.months, 0)
  const overlaps = parsed.length - mergeRanges(parsed).length

  return {
    months,
    years: Math.floor(months / 12),
    remainingMonths: months % 12,
    label:
      months === 0
        ? '0 Years 0 Months'
        : `${Math.floor(months / 12)} Years ${months % 12} Months`,
    overlaps,
    blocks,
  }
}

/**
 * Best-effort extraction of total experience straight out of resume prose —
 * used by the Job Match Checker, where there is no structured input.
 */
export function experienceFromText(text = '') {
  const datePattern = new RegExp(
    `(${MONTH_NAMES.join('|')})\\.?\\s+(19|20)\\d{2}\\s*[-–]|\\d{4}\\s*[-–]\\s*(${MONTH_NAMES.join('|')})\\.?`,
    'gi',
  )
  const ranges = []
  const source = String(text)
  const naive = source.match(
    /([a-z]{3,9})\.?\s+((?:19|20)\d{2})\s*(?:-|–|to)\s*([a-z]{3,9}|present|current|now|(?:(?:19|20)\d{2}))\b/gi,
  )
  if (naive) {
    naive.forEach((snippet) => {
      const parts = snippet.split(/\s*(?:-|–|to)\s*/i)
      const range = parseRange(parts[0], parts[1])
      if (range) ranges.push(range)
    })
  }
  if (!ranges.length && datePattern.test(source)) {
    return { months: 0, years: 0, remainingMonths: 0, label: 'Not detectable', overlaps: 0, blocks: [] }
  }
  return totalExperience(ranges)
}

/** Free-text duration such as "4+ years" → months, for JD requirements. */
export function yearsToMonths(value) {
  if (!value) return 0
  return Math.round(Number(value) * 12)
}

export default totalExperience
