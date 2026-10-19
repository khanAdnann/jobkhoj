/* ==========================================================================
   Presentation helpers. Salary values arrive in LPA (lakhs per annum);
   dates arrive as ISO strings or Date objects.
   ========================================================================== */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "₹8L - ₹14L" — falls back gracefully when only one bound is present. */
export function formatSalaryRange(min, max) {
  const hasMin = Number.isFinite(min) && min > 0
  const hasMax = Number.isFinite(max) && max > 0

  if (hasMin && hasMax) {
    return `₹${formatLpa(min)} - ₹${formatLpa(max)}`
  }
  if (hasMin) return `From ₹${formatLpa(min)}`
  if (hasMax) return `Up to ₹${formatLpa(max)}`
  return 'Not disclosed'
}

export function formatLpa(value) {
  if (!Number.isFinite(value)) return '0L'
  // Whole numbers read cleaner as "12L", fractional as "7.5L".
  return Number.isInteger(value) ? `${value}L` : `${value.toFixed(1)}L`
}

/** "05 Oct 2026" */
export function formatDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** "05 Oct" — compact form for table cells. */
export function formatDateShort(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]}`
}

/** "2 days ago" / "just now" */
export function timeAgo(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'

  const units = [
    { limit: 3600, size: 60, word: 'minute' },
    { limit: 86400, size: 3600, word: 'hour' },
    { limit: 2592000, size: 86400, word: 'day' },
    { limit: 31536000, size: 2592000, word: 'month' },
  ]

  const unit = units.find(({ limit }) => seconds < limit)
  const count = Math.floor(seconds / (unit?.size ?? 31536000))
  const word = unit?.word ?? 'year'

  return `${count} ${word}${count === 1 ? '' : 's'} ago`
}

/** "1.2k" / "24.8k" / "1.4M" — for stat cards. */
export function formatCompact(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`
  if (abs >= 1_000) return `${trim(n / 1_000)}k`
  return String(n)
}

export function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString('en-IN')
}

/** "4.2" — used on candidate cards. */
export function formatYears(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return String(n)
}

/** "AD" from "Adnan Khan" */
export function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase() || 'NA'
  )
}

/** Truncate long text without breaking mid-word awkwardly. */
export function truncate(text = '', max = 140) {
  const value = String(text)
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** Bytes -> "1.4 MB" (resume upload display). */
export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  return `${trim(n / 1024 ** i)} ${units[i]}`
}

/** Percentage delta for admin stat cards. */
export function formatDelta(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0%'
  const sign = n > 0 ? '+' : ''
  return `${sign}${trim(n)}%`
}

/** Mask an email for privacy in shared/public views: a***@gmail.com */
export function maskEmail(email = '') {
  const [name, domain] = String(email).split('@')
  if (!domain) return email
  const head = name.slice(0, 1)
  return `${head}${'*'.repeat(Math.max(3, name.length - 1))}@${domain}`
}

/* ------------------------------- internals ------------------------------- */

/** URL-safe slug: "Acme Technologies Pvt Ltd" -> "acme-technologies-pvt-ltd" */
export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function trim(n) {
  return String(Math.round(n * 10) / 10)
}
