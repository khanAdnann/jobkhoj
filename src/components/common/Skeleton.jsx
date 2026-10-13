import { cn } from '@/utils/cn'

/**
 * Shimmering placeholder block. Compose these to build every loading state in
 * the app — size them to match the real content to avoid layout shift.
 */
export default function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />
}

/** Wraps a group of skeletons and announces it to screen readers. */
export function SkeletonGroup({ label = 'Loading content', className, children }) {
  return (
    <div className={cn('animate-fade-in', className)} role="status" aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

/** Generic block used to compose larger skeletons. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}
