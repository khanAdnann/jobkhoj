import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Globe,
  MapPin,
  Users,
} from 'lucide-react'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card, { CardBody, CardHeader } from '@/components/common/Card'
import EmptyState from '@/components/common/EmptyState'
import JobCard from '@/components/jobs/JobCard'
import JobCardSkeleton from '@/components/jobs/JobCardSkeleton'
import { CompanyLogo } from '@/components/common/Avatar'
import { useFetch } from '@/hooks/useFetch'
import * as companyService from '@/services/companyService'
import * as jobService from '@/services/jobService'
import { PATHS } from '@/routes/paths'
import { COMPANY_STATUS, COMPANY_STATUS_TONE } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

const OPEN_JOBS_LIMIT = 6

/** Public company profile (PRD section 7). */
export default function CompanyDetails() {
  const { idOrSlug } = useParams()

  const companyQuery = useFetch(() => companyService.getCompany(idOrSlug), [idOrSlug])
  const company = companyQuery.data

  // Jobs are fetched per company, so this waits for the company id to resolve.
  const jobsQuery = useFetch(
    () => jobService.getJobsByCompany(company.id, { pageSize: OPEN_JOBS_LIMIT }),
    [company?.id],
    { immediate: Boolean(company?.id) },
  )

  if (companyQuery.error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Card>
          <EmptyState
            icon="search"
            title="Company not found"
            description={companyQuery.error.message}
            action={
              <Button as={Link} to={PATHS.companies} variant="outline">
                Back to companies
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  if (companyQuery.loading || !company) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
        <div className="h-44 animate-pulse rounded-2xl bg-ink-100" />
        <div className="h-64 animate-pulse rounded-xl bg-ink-100" />
      </div>
    )
  }

  const jobs = jobsQuery.data?.items ?? []
  const isVerified = company.verification === COMPANY_STATUS.VERIFIED

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Button as={Link} to={PATHS.companies} variant="ghost" size="sm" className="-ml-3 mb-4">
        <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
        All companies
      </Button>

      {/* -------------------------------- masthead -------------------------------- */}

      <Card className="mb-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <CompanyLogo company={company} size="2xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink-900">{company.name}</h1>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 text-success-600" aria-label="Verified company" />
              )}
            </div>

            <p className="mt-1 text-sm text-ink-500">{company.industry}</p>

            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-600">
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-ink-400" aria-hidden="true" />
                {company.location}
              </li>
              {company.size && (
                <li className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  {company.size}
                </li>
              )}
              {company.founded && (
                <li className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  Founded {company.founded}
                </li>
              )}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone={COMPANY_STATUS_TONE[company.verification] ?? 'neutral'}>
                {company.verification}
              </Badge>

              <Badge tone="brand" icon={Briefcase}>
                {formatNumber(company.openJobs ?? 0)} open roles
              </Badge>

              {company.technology && <Badge tone="info">{company.technology}</Badge>}
            </div>
          </div>

          {company.website && (
            <Button
              as="a"
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              className="shrink-0"
            >
              <Globe className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Website
            </Button>
          )}
        </div>
      </Card>

      {/* --------------------------------- about --------------------------------- */}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="About the company" />
          <CardBody>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-600">
              {company.about}
            </p>

            {company.benefits?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-ink-900">What they offer</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {company.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-ink-600">
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-success-600"
                        aria-hidden="true"
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="At a glance" />
          <CardBody>
            <dl className="space-y-3.5 text-sm">
              <Row label="Industry" value={company.industry} />
              <Row label="Headquarters" value={company.location} />
              <Row label="Company size" value={company.size ?? '—'} />
              <Row label="Founded" value={company.founded ?? '—'} />
              <Row
                label="Open roles"
                value={formatNumber(company.openJobs ?? 0)}
                icon={Briefcase}
              />
            </dl>

            {company.social?.linkedin && (
              <Button
                as="a"
                href={company.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="sm"
                className="-ml-3 mt-4"
              >
                <Building2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                View on LinkedIn
              </Button>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ------------------------------ open roles ------------------------------ */}

      <div className="mt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink-900">
              Open roles{company.openJobs ? ` (${formatNumber(company.openJobs)})` : ''}
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">Currently hiring at {company.name}.</p>
          </div>

          {jobs.length > 0 && (
            <Button as={Link} to={`${PATHS.jobs}?company=${encodeURIComponent(company.name)}`} variant="ghost">
              View all on JobKhoj
            </Button>
          )}
        </div>

        {jobsQuery.loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((row) => (
              <JobCardSkeleton key={row} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon="briefcase"
              title="No open roles right now"
              description={`${company.name} isn't hiring at the moment. Check back soon or set up a job alert.`}
              action={
                <Button as={Link} to={PATHS.jobs} variant="outline">
                  Browse other jobs
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={{ ...job, company }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** One label/value pair in the "At a glance" list. */
function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="flex items-center gap-1.5 text-right font-medium text-ink-900">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  )
}