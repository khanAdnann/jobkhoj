/**
 * Every route in the app, in one place.
 *
 * Components and <Link>s use these helpers rather than hardcoding strings, so a
 * path change is a single edit and typo-prone mismatches become impossible.
 */

export const PATHS = {
  /* ------------------------------ public ------------------------------- */
  home: '/',
  jobs: '/jobs',
  jobDetails: (id) => `/jobs/${id}`,
  companies: '/companies',
  companyDetails: (idOrSlug) => `/companies/${idOrSlug}`,
  about: '/about',
  contact: '/contact',
  privacyPolicy: '/privacy-policy',
  terms: '/terms',
  help: '/help',

  /* ---------------------------- career tools ---------------------------- */
  tools: {
    root: '/tools',
    atsChecker: '/tools/ats-checker',
    resumeBuilder: '/tools/resume-builder',
    resumeOptimizer: '/tools/resume-optimizer',
    keywordExtractor: '/tools/keyword-extractor',
    skillGap: '/tools/skill-gap',
    jobMatch: '/tools/job-match',
    jdAnalyzer: '/tools/jd-analyzer',
    salaryEstimator: '/tools/salary-estimator',
    pdfToWord: '/tools/pdf-to-word',
    wordToPdf: '/tools/word-to-pdf',
    mergePdf: '/tools/merge-pdf',
    splitPdf: '/tools/split-pdf',
    compressPdf: '/tools/compress-pdf',
    pdfToImages: '/tools/pdf-to-images',
    imagesToPdf: '/tools/images-to-pdf',
    rotatePdf: '/tools/rotate-pdf',
    extractPdf: '/tools/extract-pdf',
    resumeFormatConverter: '/tools/resume-format-converter',
    coverLetter: '/tools/cover-letter',
    interviewQuestions: '/tools/interview-questions',
    experienceCalculator: '/tools/experience-calculator',
    noticePeriod: '/tools/notice-period-calculator',
    history: '/tools/history',
  },

  /* -------------------------------- auth ------------------------------- */
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  /* ---------------------------- job seeker ----------------------------- */
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  resume: '/dashboard/resume',
  applications: '/dashboard/applications',
  applicationDetails: (id) => `/dashboard/applications/${id}`,
  savedJobs: '/dashboard/saved-jobs',
  jobAlerts: '/dashboard/job-alerts',
  notifications: '/dashboard/notifications',
  settings: '/dashboard/settings',

  /* ----------------------------- recruiter ----------------------------- */
  recruiter: {
    dashboard: '/recruiter/dashboard',
    company: '/recruiter/company',
    jobs: '/recruiter/jobs',
    createJob: '/recruiter/jobs/create',
    editJob: (id) => `/recruiter/jobs/${id}/edit`,
    jobDetails: (id) => `/recruiter/jobs/${id}`,
    applicants: (id) => `/recruiter/jobs/${id}/applicants`,
    applicantDetails: (id) => `/recruiter/applicants/${id}`,
    candidates: '/recruiter/candidates',
    analytics: '/recruiter/analytics',
    settings: '/recruiter/settings',
  },

  /* ------------------------------- admin ------------------------------- */
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    recruiters: '/admin/recruiters',
    companies: '/admin/companies',
    jobs: '/admin/jobs',
    applications: '/admin/applications',
    reports: '/admin/reports',
  },
}

/** Sidebar definition for the job-seeker dashboard (PRD section 9). */
export const SEEKER_NAV = [
  { to: PATHS.dashboard, label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: PATHS.profile, label: 'My Profile', icon: 'User' },
  { to: PATHS.resume, label: 'My Resume', icon: 'FileText' },
  { to: PATHS.applications, label: 'Applied Jobs', icon: 'Send' },
  { to: PATHS.savedJobs, label: 'Saved Jobs', icon: 'Bookmark' },
  { to: PATHS.jobAlerts, label: 'Job Alerts', icon: 'BellRing' },
  { to: PATHS.notifications, label: 'Notifications', icon: 'Bell' },
  { to: PATHS.settings, label: 'Settings', icon: 'Settings' },
]

/** Sidebar definition for the recruiter area (PRD section 15). */
export const RECRUITER_NAV = [
  { to: PATHS.recruiter.dashboard, label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: PATHS.recruiter.company, label: 'Company Profile', icon: 'Building2' },
  { to: PATHS.recruiter.jobs, label: 'Manage Jobs', icon: 'Briefcase' },
  { to: PATHS.recruiter.candidates, label: 'Candidates', icon: 'Users' },
  { to: PATHS.recruiter.analytics, label: 'Analytics', icon: 'BarChart3' },
  { to: PATHS.recruiter.settings, label: 'Settings', icon: 'Settings' },
]

/** Sidebar definition for the admin area (PRD section 21). */
export const ADMIN_NAV = [
  { to: PATHS.admin.dashboard, label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: PATHS.admin.users, label: 'Users', icon: 'Users' },
  { to: PATHS.admin.recruiters, label: 'Recruiters', icon: 'UserCheck' },
  { to: PATHS.admin.companies, label: 'Companies', icon: 'Building2' },
  { to: PATHS.admin.jobs, label: 'Jobs', icon: 'Briefcase' },
  { to: PATHS.admin.applications, label: 'Applications', icon: 'FileCheck2' },
  { to: PATHS.admin.reports, label: 'Reports', icon: 'BarChart3' },
]

/**
 * Nested "Career Tools" dropdown shown in the public header.
 *
 * Kept as an explicit list (rather than derived from the registry) so the menu
 * order and grouping can be curated independently of which tools exist.
 */
export const CAREER_TOOLS_MENU = [
  { to: PATHS.tools.atsChecker, label: 'ATS Resume Checker' },
  { to: PATHS.tools.resumeBuilder, label: 'Resume Builder' },
  { to: PATHS.tools.resumeOptimizer, label: 'Resume Optimizer' },
  { to: PATHS.tools.jdAnalyzer, label: 'Job Description Analyzer' },
  { to: PATHS.tools.coverLetter, label: 'Cover Letter Generator' },
  { to: PATHS.tools.interviewQuestions, label: 'Interview Questions' },
  { to: PATHS.tools.skillGap, label: 'Skill Gap Analyzer' },
  { to: PATHS.tools.salaryEstimator, label: 'Salary Estimator' },
  {
    label: 'PDF Tools',
    children: [
      { to: PATHS.tools.pdfToWord, label: 'PDF → Word' },
      { to: PATHS.tools.wordToPdf, label: 'Word → PDF' },
      { to: PATHS.tools.mergePdf, label: 'Merge PDF' },
      { to: PATHS.tools.splitPdf, label: 'Split PDF' },
      { to: PATHS.tools.compressPdf, label: 'Compress PDF' },
      { to: PATHS.tools.pdfToImages, label: 'PDF → Images' },
      { to: PATHS.tools.imagesToPdf, label: 'Images → PDF' },
    ],
  },
  { to: PATHS.tools.root, label: 'More Tools' },
]

/** Public navigation (PRD section 4). */
export const PUBLIC_NAV = [
  { to: PATHS.home, label: 'Home' },
  { to: PATHS.jobs, label: 'Find Jobs' },
  { to: PATHS.companies, label: 'Companies' },
  { to: PATHS.tools.root, label: 'Career Tools', menu: CAREER_TOOLS_MENU },
  { to: PATHS.jobs, label: 'Career Resources' },
  { to: PATHS.register, label: 'For Employers' },
]

export default PATHS
