import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import { PATHS } from '@/routes/paths'

const HIGHLIGHTS = [
  '10,000+ active job listings',
  '500+ verified companies',
  'One-tap applications and instant tracking',
  'Personalised job alerts',
]

/**
 * Split-screen shell shared by every auth page.
 * The brand panel is hidden below `lg` so forms own the full width on mobile.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 shrink-0 overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, #4f46e5 0%, transparent 45%), radial-gradient(circle at 80% 70%, #6366f1 0%, transparent 45%)',
          }}
          aria-hidden="true"
        />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Find your dream job.
            <br />
            Build your future.
          </h2>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink-300">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-200">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-500">
          © {new Date().getFullYear()} JobKhoj. Built for candidates across India.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link
            to={PATHS.home}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>

          <span className="lg:hidden">
            <Logo compact />
          </span>
        </div>

        <div className="flex flex-1 items-start justify-center px-6 pb-12 sm:px-10 lg:items-center">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-ink-500">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
