import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * JobKhoj wordmark. `compact` drops the tagline for narrow sidebars.
 * Rendered as a link to home unless `to` is explicitly null.
 */
export default function Logo({ to = '/', compact = false, light = false, className }) {
  const content = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          light ? 'bg-white/15 text-white' : 'bg-brand-600 text-white',
        )}
      >
        <Briefcase className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-lg font-extrabold tracking-tight',
            light ? 'text-white' : 'text-ink-900',
          )}
        >
          Job<span className={light ? 'text-brand-200' : 'text-brand-600'}>Khoj</span>
        </span>

        {!compact && (
          <span
            className={cn(
              'mt-0.5 text-[10px] font-medium tracking-[0.14em] uppercase',
              light ? 'text-ink-400' : 'text-ink-400',
            )}
          >
            Find your future
          </span>
        )}
      </span>
    </span>
  )

  if (to === null) return content

  return (
    <Link to={to} aria-label="JobKhoj — go to homepage" className="rounded-lg">
      {content}
    </Link>
  )
}
