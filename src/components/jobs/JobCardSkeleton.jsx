/** Loading placeholder for <JobCard /> — keeps list height stable while fetching. */
export default function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex gap-4">
        <span className="skeleton h-12 w-12 shrink-0 rounded-lg" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <span className="skeleton block h-4 w-2/3" />
              <span className="skeleton block h-3 w-1/3" />
            </div>
            <span className="skeleton h-10 w-10 shrink-0 rounded-lg" />
          </div>

          <div className="flex flex-wrap gap-3">
            {[28, 22, 26, 18].map((width, index) => (
              <span key={index} className="skeleton block h-3" style={{ width: `${width * 4}px` }} />
            ))}
          </div>

          <span className="skeleton block h-4 w-40" />

          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="skeleton block h-5 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Renders `count` skeletons; use for the initial page of any job list. */
export function JobCardSkeletonList({ count = 6 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  )
}