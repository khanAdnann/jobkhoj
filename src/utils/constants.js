/* ==========================================================================
   Shared enums + option lists used by forms, filters, badges and mock data.
   Kept framework-free so the service, mock and UI layers can all import it.
   ========================================================================== */

/* ------------------------- localStorage key names ------------------------- */
/* Namespaced under "jobkhoj:" by utils/storage.js. Declared here so neither
   the HTTP client nor the mock handlers need to import each other. */

export const TOKEN_KEY = 'auth.token'
export const USER_KEY = 'auth.user'
export const CONTACT_EMAIL = 'hello@jobkhoj.in'

/* ---------------------------------- Roles --------------------------------- */

export const ROLES = {
  JOB_SEEKER: 'JOB_SEEKER',
  RECRUITER: 'RECRUITER',
  ADMIN: 'ADMIN',
}

export const ROLE_LABELS = {
  JOB_SEEKER: 'Job Seeker',
  RECRUITER: 'Recruiter',
  ADMIN: 'Admin',
}

/** Landing route for each role after a successful login. */
export const HOME_BY_ROLE = {
  [ROLES.JOB_SEEKER]: '/dashboard',
  [ROLES.RECRUITER]: '/recruiter/dashboard',
  [ROLES.ADMIN]: '/admin',
}

/* ------------------------------ Job taxonomy ----------------------------- */

export const JOB_TYPES = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance']

export const WORK_MODES = ['On-site', 'Hybrid', 'Remote']

export const EXPERIENCE_LEVELS = [
  'Fresher (0-1 yrs)',
  'Entry (1-2 yrs)',
  'Mid (3-5 yrs)',
  'Senior (5-8 yrs)',
  'Lead / Principal (8+ yrs)',
]

export const DEPARTMENTS = [
  'Software Development',
  'Data Science',
  'Product Management',
  'Design',
  'Marketing',
  'Finance',
  'Human Resources',
  'Sales',
  'Customer Support',
]

export const SKILLS = [
  'Java',
  'Spring Boot',
  'Microservices',
  'Hibernate',
  'JPA',
  'React',
  'Angular',
  'Node.js',
  'JavaScript',
  'TypeScript',
  'Python',
  'Django',
  'Go',
  'SQL',
  'MongoDB',
  'Redis',
  'Kafka',
  'RabbitMQ',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Terraform',
  'Jenkins',
  'CI/CD',
  'DevOps',
  'GraphQL',
  'REST API',
  'Microservice Architecture',
  'Elasticsearch',
  'Power BI',
  'Tableau',
  'Machine Learning',
  'Deep Learning',
  'Selenium',
  'Git',
]

export const LOCATIONS = [
  'Mumbai, Maharashtra',
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Delhi NCR',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Kochi, Kerala',
  'Indore, Madhya Pradesh',
  'Coimbatore, Tamil Nadu',
  'Bhubaneswar, Odisha',
  'Nagpur, Maharashtra',
  'Chandigarh, Punjab',
  'Vadodara, Gujarat',
]

export const CURRENCY = 'INR'

/** salaryMin / salaryMax are stored in lakhs per annum (LPA). */
export const SALARY_UNIT = 'LPA'

/* ------------------------------- Filters --------------------------------- */

export const DATE_FILTERS = [
  { value: 'any', label: 'Any time' },
  { value: '24h', label: 'Past 24 hours' },
  { value: '3d', label: 'Past 3 days' },
  { value: '7d', label: 'Past week' },
  { value: '30d', label: 'Past month' },
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'salary-desc', label: 'Salary: High to Low' },
  { value: 'salary-asc', label: 'Salary: Low to High' },
]

/* ------------------------------ Applications ----------------------------- */

export const APPLICATION_STATUS = {
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
}

export const APPLICATION_STATUSES = Object.values(APPLICATION_STATUS)

/** Badge tone per status — consumed by <Badge tone={...} />. */
export const STATUS_TONE = {
  [APPLICATION_STATUS.APPLIED]: 'neutral',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'info',
  [APPLICATION_STATUS.SHORTLISTED]: 'brand',
  [APPLICATION_STATUS.INTERVIEW]: 'warning',
  [APPLICATION_STATUS.REJECTED]: 'danger',
  [APPLICATION_STATUS.HIRED]: 'success',
}

/** Recruiter Kanban pipeline, in order. */
/**
 * Pipeline stage keys.
 *
 * These are stored on every application row and used as board column keys, so
 * they are part of the data contract — not display strings. They get constants
 * like every other status value so no call site has to hardcode 'REJECTED'.
 */
export const PIPELINE_STAGE = {
  APPLIED: 'APPLIED',
  SCREENING: 'SCREENING',
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW: 'INTERVIEW',
  SELECTED: 'SELECTED',
  HIRED: 'HIRED',
  /** Terminal: excluded from the board and counted separately. */
  REJECTED: 'REJECTED',
}

/**
 * Notification categories for the seeker inbox.
 *
 * Deliberately distinct from PIPELINE_STAGE even where the names collide
 * ('SHORTLISTED', 'INTERVIEW'): a notification type says *why* the bell rang,
 * a stage key says *where the candidate sits on the board*. Sharing one
 * vocabulary would let a stage key be used as a notification type by accident.
 */
export const NOTIFICATION_TYPE = {
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW: 'INTERVIEW',
  MATCH: 'MATCH',
  STATUS: 'STATUS',
}

export const PIPELINE_STAGES = [
  { key: PIPELINE_STAGE.APPLIED, label: 'Applied', tone: 'neutral' },
  { key: PIPELINE_STAGE.SCREENING, label: 'Screening', tone: 'info' },
  { key: PIPELINE_STAGE.SHORTLISTED, label: 'Shortlisted', tone: 'brand' },
  { key: PIPELINE_STAGE.INTERVIEW, label: 'Interview', tone: 'warning' },
  { key: PIPELINE_STAGE.SELECTED, label: 'Selected', tone: 'success' },
  { key: PIPELINE_STAGE.HIRED, label: 'Hired', tone: 'success' },
]

/* --------------------------------- Jobs ---------------------------------- */

export const JOB_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending Approval',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
}

export const JOB_STATUSES = Object.values(JOB_STATUS)

export const JOB_STATUS_TONE = {
  [JOB_STATUS.DRAFT]: 'neutral',
  [JOB_STATUS.PENDING]: 'warning',
  [JOB_STATUS.ACTIVE]: 'success',
  [JOB_STATUS.CLOSED]: 'neutral',
  [JOB_STATUS.REJECTED]: 'danger',
  [JOB_STATUS.EXPIRED]: 'neutral',
}

/* ------------------------------- Companies ------------------------------- */

export const COMPANY_SIZE = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5000+ employees',
]

export const COMPANY_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
}

export const COMPANY_STATUS_TONE = {
  [COMPANY_STATUS.PENDING]: 'warning',
  [COMPANY_STATUS.VERIFIED]: 'success',
  [COMPANY_STATUS.REJECTED]: 'danger',
  [COMPANY_STATUS.SUSPENDED]: 'danger',
}

/* --------------------------------- Users --------------------------------- */

export const USER_STATUS = {
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
}

export const ALERT_FREQUENCIES = ['Instantly', 'Daily', 'Weekly']

/* --------------------------------- Misc ---------------------------------- */

export const PAGINATION_PAGE_SIZES = [6, 12, 24, 48]

export const SORTS = SORT_OPTIONS
