import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  MapPin,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import { CompanyLogo } from '@/components/common/Avatar'
import JobCard from '@/components/jobs/JobCard'
import JobCardSkeleton from '@/components/jobs/JobCardSkeleton'
import { useFetch } from '@/hooks/useFetch'
import * as jobService from '@/services/jobService'
import * as companyService from '@/services/companyService'
import { PATHS } from '@/routes/paths'
import { COMPANY_STATUS, LOCATIONS, SKILLS } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

const FEATURED_LIMIT = 6
const COMPANY_LIMIT = 6

/** Landing page (PRD section 3). */
export default function Home() {
  const featuredQuery = useFetch(() => jobService.getFeaturedJobs(FEATURED_LIMIT), [])
  const companiesQuery = useFetch(() => companyService.getTopCompanies(COMPANY_LIMIT), [])

  const featured = featuredQuery.data ?? []
  const companies = companiesQuery.data ?? []

  return (
    <div>
      {/* -------------------------------- hero -------------------------------- */}

      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50/70 to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="brand" className="mb-5">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              Explore job listings and career tools
            </Badge>

            <h1 className="text-3xl font-bold tracking-tight text-balance text-ink-900 sm:text-5xl">
              Find the job that fits your life
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-pretty text-ink-600 sm:text-lg">
              Browse job listings, explore company information, and use practical tools as you
              prepare for your next career move.
            </p>

            <SearchForm className="mt-8" />

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <li className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Explore job listings
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Organize your applications
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-info-600" aria-hidden="true" />
                Career tools for candidates
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------- featured jobs --------------------------- */}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeading
          title="Featured openings"
          subtitle="A selection of listings from the current catalog."
          action={
            <Button as={Link} to={PATHS.jobs} variant="ghost">
              Browse all jobs
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
          }
        />

        {featuredQuery.loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <JobCardSkeleton key={row} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------- categories ---------------------------- */}

      <section className="border-y border-ink-200 bg-ink-50/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            title="Browse by skill"
            subtitle="Jump straight into the roles that match your stack."
          />

          <div className="flex flex-wrap gap-2.5">
            {SKILLS.slice(0, 14).map((skill) => (
              <Link
                key={skill}
                to={`${PATHS.jobs}?skills=${encodeURIComponent(skill)}`}
                className="rounded-full border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-700 hover:shadow-card"
              >
                {skill}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ companies ---------------------------- */}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeading
          title="Companies"
          subtitle="Explore company information in the current catalog."
          action={
            <Button as={Link} to={PATHS.companies} variant="ghost">
              All companies
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
          }
        />

        {companiesQuery.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="h-28 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                to={PATHS.companyDetails(company.slug ?? company.id)}
                className="group flex items-start gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover"
              >
                <CompanyLogo company={company} />

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-semibold text-ink-900 group-hover:text-brand-700">
                    <span className="truncate">{company.name}</span>
                    {company.verification === COMPANY_STATUS.VERIFIED && (
                      <BadgeCheck
                        className="h-4 w-4 shrink-0 text-success-600"
                        aria-label="Verified company"
                      />
                    )}
                  </p>

                  <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {company.location}
                  </p>

                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
                    <Briefcase className="h-3 w-3" aria-hidden="true" />
                    {formatNumber(company.openJobs ?? 0)} open roles
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------- for employers ------------------------------- */}

      <section className="border-t border-ink-200 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Hiring for your team?</h2>
              <p className="mt-3 text-base text-pretty text-ink-300">
                Create a company profile, manage job listings, and review applications from
                the recruiter dashboard.
              </p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  'Create and manage job listings',
                  'Review applicants by pipeline stage',
                  'View recruiter reporting',
                  'Manage a company profile',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-ink-200">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-success-500" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Button as={Link} to={PATHS.register} size="lg">
                <Building2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Create employer account
              </Button>
              <Button as={Link} to={PATHS.jobs} size="lg" variant="outline" className="border-ink-600 text-white hover:bg-ink-800">
                Browse candidates' roles
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/** Hero search. Submits into the jobs route so filters stay URL-driven. */
function SearchForm({ className }) {
  return (
    <form
      action={PATHS.jobs}
      method="get"
      className={className}
      role="search"
      aria-label="Search jobs"
    >
      {/* Field names must match useJobFilters' URL contract: the free-text term
          is "q", and multi-value filters are comma-separated lists. */}
      <div className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-2 shadow-card-hover sm:flex-row">
        <Input
          name="q"
          aria-label="Job title, company or skill"
          placeholder="Job title, company or skill"
          containerClassName="flex-1"
          className="border-0 focus:ring-0"
        />

        <Select
          name="location"
          aria-label="Location"
          options={LOCATIONS}
          placeholder="Any location"
          containerClassName="sm:w-48"
          className="border-0 focus:ring-0"
        />

        <Button type="submit" size="md" className="sm:px-6">
          <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Search jobs
        </Button>
      </div>
    </form>
  )
}

/** Section title with an optional trailing action. */
function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}