import { cn } from '@/utils/cn'

/** Colour + label bands shared by every scoring surface. */
export function scoreTone(score) {
  if (score >= 80) return { label: 'Excellent', className: 'text-success-600', stroke: '#10b981' }
  if (score >= 60) return { label: 'Good', className: 'text-info-600', stroke: '#3b82f6' }
  if (score >= 40) return { label: 'Needs work', className: 'text-warning-600', stroke: '#f59e0b' }
  return { label: 'At risk', className: 'text-danger-600', stroke: '#ef4444' }
}

/**
 * Circular 0–100 score gauge (ATS score, job match, etc).
 *
 * Pure SVG + inline styles — renders identically in the browser and in the
 * SSR smoke probes (no animation, no measurement).
 */
export default function ScoreGauge({ score = 0, label, sublabel, size = 168, className }) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(score) || 0)))
  const tone = scoreTone(safe)

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dash = (safe / 100) * circumference

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      role="img"
      aria-label={`${label ?? 'Score'}: ${safe} out of 100`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-ink-200"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            style={{ stroke: tone.stroke, transition: 'stroke-dasharray .6s ease' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-ink-900">{safe}</span>
          <span className={cn('text-xs font-semibold uppercase tracking-wide', tone.className)}>
            {tone.label}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        {label && <p className="text-sm font-semibold text-ink-800">{label}</p>}
        {sublabel && <p className="mt-0.5 text-xs text-ink-500">{sublabel}</p>}
      </div>
    </div>
  )
}
