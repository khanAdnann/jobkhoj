import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

const SIZES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-24 w-24 text-2xl',
}

/** Deterministic accent colour so the same person keeps the same avatar tint. */
const TINTS = [
  'bg-brand-100 text-brand-700',
  'bg-success-50 text-success-700',
  'bg-warning-50 text-warning-700',
  'bg-info-50 text-info-700',
  'bg-danger-50 text-danger-700',
  'bg-ink-100 text-ink-700',
]

function tintFor(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000
  }
  return TINTS[hash % TINTS.length]
}

/**
 * Circular avatar. Falls back to initials on a tinted surface when no image
 * (or image fails to load) is available.
 */
export default function Avatar({
  src,
  name = '',
  alt,
  size = 'md',
  className,
  ring = false,
}) {
  const label = alt || name
  const showImage = Boolean(src)

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        SIZES[size],
        !showImage && tintFor(name || label),
        ring && 'ring-2 ring-white',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(event) => {
            // Swap to the initials layer by hiding the broken image.
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span aria-hidden={label ? undefined : 'true'}>{initials(name || label)}</span>
      )}
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

/**
 * Square logo tile for companies. Uses initials on a brand tint so every
 * company has a visible mark even without a real logo asset.
 */
export function CompanyLogo({ company, size = 'md', className }) {
  const map = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' }
  const name = typeof company === 'string' ? company : (company?.name ?? '')

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white',
        map[size] ?? map.md,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
