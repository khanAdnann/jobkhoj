import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import Logo from './Logo'
import { PATHS } from '@/routes/paths'
import { CONTACT_EMAIL } from '@/utils/constants'

const COLUMNS = [
  {
    title: 'For Job Seekers',
    links: [
      { label: 'Browse Jobs', to: '/jobs' },
      { label: 'Companies', to: '/companies' },
      { label: 'Career Resources', to: '/jobs' },
      { label: 'My Dashboard', to: '/dashboard' },
      { label: 'Saved Jobs', to: '/dashboard/saved-jobs' },
    ],
  },
  {
    title: 'For Employers',
    links: [
      { label: 'Post a Job', to: '/register?role=RECRUITER' },
      { label: 'Recruiter Dashboard', to: '/recruiter/dashboard' },
      { label: 'Manage Jobs', to: '/recruiter/jobs' },
      { label: 'Candidates', to: '/recruiter/candidates' },
      { label: 'Analytics', to: '/recruiter/analytics' },
    ],
  },
  {
    title: 'Career Tools',
    links: [
      { label: 'ATS Resume Checker', to: '/tools/ats-checker' },
      { label: 'Resume Builder', to: '/tools/resume-builder' },
      { label: 'Resume Optimizer', to: '/tools/resume-optimizer' },
      { label: 'Cover Letter Generator', to: '/tools/cover-letter' },
      { label: 'Interview Questions', to: '/tools/interview-questions' },
      { label: 'Salary Estimator', to: '/tools/salary-estimator' },
      { label: 'All Tools', to: '/tools' },
      { label: 'History', to: '/tools/history' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: PATHS.about },
      { label: 'Contact', to: PATHS.contact },
      { label: 'Privacy Policy', to: PATHS.privacyPolicy },
      { label: 'Terms of Service', to: PATHS.terms },
      { label: 'Help Center', to: PATHS.help },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-ink-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand + blurb */}
          <div className="max-w-sm">
            <Logo />

            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              JobKhoj helps people explore job listings and organize their career search.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-ink-500">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-brand-600">
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-ink-900">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-200 pt-6 sm:flex-row">
          <p className="text-sm text-ink-500">
            © {year} JobKhoj. All rights reserved.
          </p>
          <p className="text-xs text-ink-400">
            Made for candidates who are serious about their next move.
          </p>
        </div>
      </div>
    </footer>
  )
}
