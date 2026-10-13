import { Link } from 'react-router-dom'
import { Linkedin, Twitter, Github, Mail, MapPin } from 'lucide-react'
import Logo from './Logo'

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
      { label: 'About Us', to: '/' },
      { label: 'Contact', to: '/' },
      { label: 'Privacy Policy', to: '/' },
      { label: 'Terms of Service', to: '/' },
      { label: 'Help Center', to: '/' },
    ],
  },
]

const SOCIALS = [
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com' },
  { label: 'Twitter', icon: Twitter, href: 'https://x.com' },
  { label: 'GitHub', icon: Github, href: 'https://github.com' },
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
              JobKhoj connects ambitious professionals with thousands of opportunities from
              companies hiring across India.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-ink-500">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <a href="mailto:hello@jobkhoj.in" className="transition-colors hover:text-brand-600">
                  hello@jobkhoj.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>

            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
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
