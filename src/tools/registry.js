/**
 * Career Tools registry — the single source of truth for every tool.
 *
 * The landing page, the "Career Tools" nav dropdown and the route table all
 * read from this file, so adding a tool is one entry here + one page component.
 */

export const TOOL_CATEGORIES = {
  resume: {
    id: 'resume',
    label: 'Resume Tools',
    description: 'Analyse, build and optimise your resume',
    accent: 'brand',
  },
  job: {
    id: 'job',
    label: 'Job Tools',
    description: 'Understand roles, market salary and fit',
    accent: 'info',
  },
  document: {
    id: 'document',
    label: 'Document Tools',
    description: 'Convert, merge and compress files',
    accent: 'success',
  },
  career: {
    id: 'career',
    label: 'Career Tools',
    description: 'Cover letters, interviews and planning',
    accent: 'warning',
  },
}

/** @type {Array<{id:string,to:string,title:string,blurb:string,icon:string,category:string,badge?:string}>} */
export const TOOLS = [
  /* ------------------------------- resume ------------------------------- */
  {
    id: 'ats-checker',
    to: '/tools/ats-checker',
    title: 'ATS Resume Checker',
    blurb: 'Score your resume 0–100 across 11 recruiter screening categories.',
    icon: 'FileSearch',
    category: 'resume',
    badge: 'Popular',
  },
  {
    id: 'resume-builder',
    to: '/tools/resume-builder',
    title: 'Resume Builder',
    blurb: 'Five professional templates with live preview and instant PDF download.',
    icon: 'FilePenLine',
    category: 'resume',
    badge: 'New',
  },
  {
    id: 'resume-optimizer',
    to: '/tools/resume-optimizer',
    title: 'Resume Optimizer',
    blurb: 'Match your resume against a target job description and close the gaps.',
    icon: 'Wand2',
    category: 'resume',
  },
  {
    id: 'keyword-extractor',
    to: '/tools/keyword-extractor',
    title: 'Resume Keyword Extractor',
    blurb: 'Pull skills, tools, languages and job titles out of any resume.',
    icon: 'Tags',
    category: 'resume',
  },
  {
    id: 'skill-gap',
    to: '/tools/skill-gap',
    title: 'Skill Gap Analyzer',
    blurb: 'See the skills you have, the skills you miss and what to learn first.',
    icon: 'GitCompareArrows',
    category: 'resume',
  },
  {
    id: 'job-match',
    to: '/tools/job-match',
    title: 'Job Match Checker',
    blurb: 'Instant fit score for a resume against any job posting.',
    icon: 'BadgeCheck',
    category: 'job',
  },

  /* --------------------------------- job -------------------------------- */
  {
    id: 'jd-analyzer',
    to: '/tools/jd-analyzer',
    title: 'Job Description Analyzer',
    blurb: 'Extract skills, seniority, education, salary and keywords from any JD.',
    icon: 'ScanText',
    category: 'job',
  },
  {
    id: 'salary-estimator',
    to: '/tools/salary-estimator',
    title: 'Salary Estimator',
    blurb: 'Estimated CTC range by role, experience, location and skill set.',
    icon: 'IndianRupee',
    category: 'job',
  },

  /* ------------------------------ document ------------------------------ */
  {
    id: 'pdf-to-word',
    to: '/tools/pdf-to-word',
    title: 'PDF to Word',
    blurb: 'Convert a PDF resume into an editable DOCX document.',
    icon: 'FileOutput',
    category: 'document',
  },
  {
    id: 'word-to-pdf',
    to: '/tools/word-to-pdf',
    title: 'Word to PDF',
    blurb: 'Turn a DOC or DOCX file into a clean, shareable PDF.',
    icon: 'FileInput',
    category: 'document',
  },
  {
    id: 'merge-pdf',
    to: '/tools/merge-pdf',
    title: 'Merge PDF',
    blurb: 'Combine several PDFs into one file, in the order you choose.',
    icon: 'Combine',
    category: 'document',
  },
  {
    id: 'split-pdf',
    to: '/tools/split-pdf',
    title: 'Split PDF',
    blurb: 'Extract a page range or split every page into its own file.',
    icon: 'Scissors',
    category: 'document',
  },
  {
    id: 'compress-pdf',
    to: '/tools/compress-pdf',
    title: 'Compress PDF',
    blurb: 'Reduce file size with low, medium or high compression.',
    icon: 'Minimize2',
    category: 'document',
  },
  {
    id: 'pdf-to-images',
    to: '/tools/pdf-to-images',
    title: 'PDF to Images',
    blurb: 'Render every page as a JPG or PNG and download them as a ZIP.',
    icon: 'Images',
    category: 'document',
  },
  {
    id: 'images-to-pdf',
    to: '/tools/images-to-pdf',
    title: 'Images to PDF',
    blurb: 'Drag, reorder and combine JPG, PNG or WEBP images into one PDF.',
    icon: 'FileImage',
    category: 'document',
  },
  {
    id: 'rotate-pdf',
    to: '/tools/rotate-pdf',
    title: 'Rotate PDF',
    blurb: 'Rotate all pages or a selection, left or right.',
    icon: 'RotateCw',
    category: 'document',
  },
  {
    id: 'extract-pdf',
    to: '/tools/extract-pdf',
    title: 'Extract PDF Pages',
    blurb: 'Pick the exact pages you need and export them as a new PDF.',
    icon: 'ListFilter',
    category: 'document',
  },
  {
    id: 'resume-format-converter',
    to: '/tools/resume-format-converter',
    title: 'Resume Format Converter',
    blurb: 'PDF to DOCX, DOCX to PDF or resume to clean plain text.',
    icon: 'RefreshCcw',
    category: 'document',
  },

  /* ------------------------------- career ------------------------------- */
  {
    id: 'cover-letter',
    to: '/tools/cover-letter',
    title: 'Cover Letter Generator',
    blurb: 'Generate a tailored cover letter in four tones and three lengths.',
    icon: 'Mail',
    category: 'career',
    badge: 'AI-ready',
  },
  {
    id: 'interview-questions',
    to: '/tools/interview-questions',
    title: 'Interview Question Generator',
    blurb: 'Role-specific questions across core, scenario and system design rounds.',
    icon: 'MessagesSquare',
    category: 'career',
    badge: 'AI-ready',
  },
  {
    id: 'experience-calculator',
    to: '/tools/experience-calculator',
    title: 'Experience Calculator',
    blurb: 'Total up multiple roles without double-counting overlaps.',
    icon: 'CalendarClock',
    category: 'career',
  },
  {
    id: 'notice-period-calculator',
    to: '/tools/notice-period-calculator',
    title: 'Notice Period Calculator',
    blurb: 'Last working day, joining date and notice-period overlap checks.',
    icon: 'CalendarRange',
    category: 'career',
  },
]

export const TOOLS_PATH = '/tools'

/** Flat path list — used by the nav dropdown and by route smoke probes. */
export const TOOL_PATHS = [TOOLS_PATH, ...TOOLS.map((tool) => tool.to)]

export function toolsByCategory(category) {
  return TOOLS.filter((tool) => tool.category === category)
}

export function findTool(idOrPath) {
  return TOOLS.find((tool) => tool.id === idOrPath || tool.to === idOrPath)
}

export default TOOLS
