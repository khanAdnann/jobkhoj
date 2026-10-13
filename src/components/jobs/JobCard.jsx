import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Briefcase,
  Clock,
  GraduationCap,
  MapPin,
  Users,
} from 'lucide-react'
import { Badge, CompanyLogo } from '@/components/common'
import SaveJobButton from './SaveJobButton'
import { PATHS } from '@/routes/paths'
import { formatSalaryRange, timeAgo } from '@/utils/format'
import { COMPANY_STATUS } from '@/utils/constants'
import { cn } from '@/utils/cn'

/**
 * Job result card used by search, saved jobs, similar-jobs and the home page
 * (PRD section 6).
 *
 * The whole card is a link for a large click target; the save button stops
 * propagation so it doesn't navigate.
 */
export default function JobCard({ job, saved = false, onSavedChange, className }) {
  if (!job) return null

  const {
    id,
    title,
    company,
    location,
    workMode,
    employmentType,
    experienceLabel,
    salaryMin,
    salaryMax,
    skills = [],
    featured,
    openings,
    postedAt,
    department,
  } = job

  const salaryLabel = formatSalaryRange(salaryMin, salaryMax)

  return (
    <article
      className={cn(
        'group relative rounded-xl border border-ink-200 bg-white p-5 shadow-card transition-all',
        'hover:border-brand-300 hover:shadow-card-hover',
        featured && 'border-brand-200 bg-brand-50/30',
        className,
      )}
    >
      <div className="flex gap-4">
        <CompanyLogo company={company ?? title} size="md" />

        <div className="min-w-0 flex-1">
          {/* -------------------------------- title ------------------------------- */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink-900">
                <Link
                  to={PATHS.jobDetails(id)}
                  className="transition-colors hover:text-brand-600 after:absolute after:inset-0 after:content-['']"
                >
                  {title}
                </Link>
              </h3>

              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
                {company?.name && (
                  <Link
                    to={PATHS.companyDetails(company.slug ?? company.id)}
                    className="relative z-10 font-medium text-ink-700 hover:text-brand-600 hover:underline"
                  >
                    {company.name}
                  </Link>
                )}

                {company?.verification === COMPANY_STATUS.VERIFIED && (
                  <BadgeCheck
                    className="h-3.5 w-3.5 text-success-600"
                    strokeWidth={2.5}
                    aria-label="Verified company"
                  />
                )}

                {department && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{department}</span>
                  </>
                )}
              </p>
            </div>

            <SaveJobButton
              jobId={id}
              defaultSaved={saved}
              onToggle={onSavedChange}
              className="relative z-10"
            />
          </div>

          {/* -------------------------------- meta -------------------------------- */}
          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
              {location}
              {workMode && (
                <span className="font-medium text-ink-700">({workMode})</span>
              )}
            </li>

            <li className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
              {employmentType}
            </li>

            {experienceLabel && (
              <li className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                {experienceLabel}
              </li>
            )}

            {openings > 1 && (
              <li className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                {openings} openings
              </li>
            )}

            <li className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
              {postedAt ? timeAgo(postedAt) : 'Recently'}
            </li>
          </ul>

          {/* ------------------------------- salary ------------------------------- */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-700">
              {salaryLabel}
            </span>

            {featured && (
              <Badge tone="brand" size="sm">
                Featured
              </Badge>
            )}
          </div>

          {/* ------------------------------- skills ------------------------------- */}
          {skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {skills.slice(0, 5).map((skill) => (
                <li key={skill}>
                  <Badge tone="neutral" size="sm">
                    {skill}
                  </Badge>
                </li>
              ))}
              {skills.length > 5 && (
                <li>
                  <span className="text-xs text-ink-400">+{skills.length - 5} more</span>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </article>
  )
}