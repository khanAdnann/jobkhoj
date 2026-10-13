import { storage } from '@/utils/storage'
import { buildDocx, textToBlocks } from '@/tools/engine/docx.js'
import { textToPdf } from '@/tools/engine/pdf.js'
import * as tools from './toolsService'

/**
 * Resume Builder service — data model, templates and exports.
 *
 * Persistence is localStorage today; the live contract is
 *   GET/PUT /api/resumes/me   (single resume per account)
 * so switching to a server-side draft is a storage swap inside this file.
 */

export const RESUME_TEMPLATES = [
  {
    id: 'ats',
    name: 'ATS Friendly',
    description: 'Single column, no graphics, maximum parser score.',
    accent: '#4f46e5',
    default: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Classic serif headings, ideal for finance and consulting.',
    accent: '#0f172a',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold colour blocks and a confident typographic scale.',
    accent: '#2563eb',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Quiet, airy layout that lets content do the talking.',
    accent: '#475569',
  },
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    description: 'Skills-forward layout tuned for technical screening.',
    accent: '#059669',
  },
]

export const RESUME_FONTS = [
  { id: 'sans', label: 'Inter / Sans', stack: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { id: 'serif', label: 'Georgia / Serif', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', label: 'JetBrains Mono', stack: "'Cascadia Code', Consolas, monospace" },
]

export const RESUME_SPACING = [
  { id: 'compact', label: 'Compact', lineHeight: 1.35, gap: '0.5rem' },
  { id: 'normal', label: 'Normal', lineHeight: 1.55, gap: '0.9rem' },
  { id: 'relaxed', label: 'Relaxed', lineHeight: 1.75, gap: '1.4rem' },
]

export const SECTION_DEFS = [
  { id: 'summary', label: 'Professional Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Work Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'languages', label: 'Languages' },
  { id: 'interests', label: 'Interests' },
]

const RESUME_KEY = 'tools.resume'

export function createEmptyResume() {
  return {
    template: 'ats',
    font: 'sans',
    spacing: 'normal',
    sections: SECTION_DEFS.map((section) => ({ id: section.id, visible: true })),
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
    },
    summary: '',
    skills: [],
    experience: [
      { company: '', role: '', location: '', start: '', end: '', current: false, bullets: [''] },
    ],
    education: [{ school: '', degree: '', start: '', end: '', grade: '' }],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    interests: [],
  }
}

/** Section reorder used by the builder UI (drag or arrow buttons). */
export function moveSection(sections, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= sections.length) return sections
  const next = [...sections]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function loadResume() {
  return storage.get(RESUME_KEY, null) ?? createEmptyResume()
}

export function saveResume(resume) {
  storage.set(RESUME_KEY, resume)
  return resume
}

export function clearResume() {
  storage.set(RESUME_KEY, createEmptyResume())
  return createEmptyResume()
}

export function exportToDocxFileName(resume) {
  const name = resume?.personal?.name?.trim() || 'resume'
  return `${name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-Resume.docx`
}

/** Structured resume → plain text (used for PDF generation and analysis). */
export function resumeToPlainText(resume) {
  const { personal, sections } = resume
  const lines = []

  if (personal.name) lines.push(personal.name.toUpperCase())
  const contact = [personal.email, personal.phone, personal.location, personal.linkedin, personal.github, personal.portfolio]
    .filter(Boolean)
    .join(' | ')
  if (contact) lines.push(contact)
  lines.push('')

  const visible = (id) => sections?.find((section) => section.id === id)?.visible !== false

  if (visible('summary') && resume.summary) {
    lines.push('PROFESSIONAL SUMMARY', resume.summary, '')
  }
  if (visible('skills') && resume.skills?.length) {
    lines.push('SKILLS', resume.skills.join(', '), '')
  }
  if (visible('experience') && resume.experience?.length) {
    lines.push('WORK EXPERIENCE')
    resume.experience.forEach((item) => {
      const range = [item.start, item.current ? 'Present' : item.end].filter(Boolean).join(' - ')
      if (item.role || item.company) lines.push(`${item.role} - ${item.company} ${range ? `(${range})` : ''}`.trim())
      item.bullets?.filter(Boolean).forEach((bullet) => lines.push(`- ${bullet}`))
      lines.push('')
    })
  }
  if (visible('education') && resume.education?.length) {
    lines.push('EDUCATION')
    resume.education.forEach((item) => {
      if (item.degree || item.school) {
        lines.push([item.degree, item.school, item.start ? `${item.start} - ${item.end}` : item.end].filter(Boolean).join(', '))
      }
    })
    lines.push('')
  }
  if (visible('projects') && resume.projects?.length) {
    lines.push('PROJECTS')
    resume.projects.forEach((item) => {
      if (item.name) lines.push(`${item.name}${item.link ? ` (${item.link})` : ''}`)
      if (item.tech) lines.push(`Tech: ${item.tech}`)
      if (item.description) lines.push(`- ${item.description}`)
    })
    lines.push('')
  }
  if (visible('certifications') && resume.certifications?.length) {
    lines.push('CERTIFICATIONS')
    resume.certifications.forEach((item) => lines.push(`- ${item.name}${item.year ? ` (${item.year})` : ''}`))
    lines.push('')
  }
  if (visible('achievements') && resume.achievements?.length) {
    lines.push('ACHIEVEMENTS')
    resume.achievements.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }
  if (visible('languages') && resume.languages?.length) {
    lines.push('LANGUAGES', resume.languages.join(', '), '')
  }
  if (visible('interests') && resume.interests?.length) {
    lines.push('INTERESTS', resume.interests.join(', '), '')
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Real .docx export built from the current resume data. */
export async function exportResumeToDocx(resume) {
  const text = resumeToPlainText(resume)
  const bytes = await buildDocx({
    title: `${resume.personal.name || 'Resume'} — Resume`,
    blocks: textToBlocks(text),
  })
  return { bytes, fileName: exportToDocxFileName(resume) }
}

/** PDF bytes for the resume (used by tools; the builder preview prints too). */
export async function exportResumeToPdf(resume) {
  const text = resumeToPlainText(resume)
  const bytes = await textToPdf(resume.personal.name ? `${resume.personal.name} — Resume` : 'Resume', text.split(/\r?\n/))
  return { bytes, fileName: exportToDocxFileName(resume).replace(/\.docx$/i, '.pdf') }
}

export function recordExport(resume) {
  return tools.recordHistory({
    toolId: 'resume-builder',
    tool: 'Resume Builder',
    fileName: exportToDocxFileName(resume),
    summary: 'Exported resume',
  })
}

export default { loadResume, saveResume, resumeToPlainText, exportResumeToDocx }
