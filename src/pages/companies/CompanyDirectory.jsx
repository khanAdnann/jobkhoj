import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgeCheck, Briefcase, MapPin, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import { CompanyLogo } from '@/components/common/Avatar'
import { useFetch } from '@/hooks/useFetch'
import * as companyService from '@/services/companyService'
import { PATHS } from '@/routes/paths'
import { COMPANY_SIZE, COMPANY_STATUS } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

const PAGE_SIZE = 12

const VERIFICATION_OPTIONS = [
  { value: COMPANY_STATUS.VERIFIED, label: 'Verified companies' },
  { value: 'all', label: 'All companies' },
  { value: COMPANY_STATUS.PENDING, label: 'Awaiting verification' },
]

/**
 * Public company directory (PRD section 7).
 *
 * Defaults to verified employers only, because the directory is a trust signal
 * — an unverified company appearing next to verified ones implies it isn't.
 * "All companies" is available but never the default.
 */
export default function CompanyDirectory() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('query') ?? '')

  const verification = searchParams.get('verification') ?? COMPANY_STATUS.VERIFIED
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const search = searchParams.get('query') ?? ''

  useEffect(() => {
    setQuery(search)
  }, [search])

  const { data, error, loading, refetch } = useFetch(
    () => companyService.getCompanies({ verification, query: search, page, pageSize: PAGE_SIZE }),
    [verification, search, page],
  )

  const companies = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const safePage = data?.page ?? page

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      const isDefault = value === null || value === undefined || value === '' || value === 'all'
      if (isDefault || (key === 'page' && Number(value) <= 1)) next.delete(key)
      else next.set(key, String(value))
    })
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Companies hiring on JobKhoj"
        subtitle="Browse employers by how many roles they have open right now."
      />

      <Card className="mb-6">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            updateParams({ query: query.trim() })
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Input
            label="Search companies"
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Company, industry or location"
            className="sm:w-80"
          />

          <Select
            label="Show"
            name="verification"
            value={verification}
            onChange={(event) => updateParams({ verification: event.target.value })}
            options={VERIFICATION_OPTIONS}
          />

          <Button type="submit" variant="primary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
        </form>
      </Card>

      {error ? (
        <Card>
          <EmptyState
            icon="alert"
            title="Could not load companies"
            description={error.message}
            action={
              <Button variant="secondary" onClick={refetch}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-44 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <EmptyState
            icon="company"
            title="No companies match your search"
            description={
              verification === COMPANY_STATUS.VERIFIED
                ? 'Try a broader search, or switch to "All companies" to include employers still being verified.'
                : 'Try a different company name, industry or location.'
            }
            action={
              <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} hover padded={false} className="flex flex-col">
              <div className="flex items-start gap-4 p-5">
                <CompanyLogo company={company} />

                <div className="min-w-0 flex-1">
                  <Link
                    to={PATHS.companyDetails(company.slug ?? company.id)}
                    className="font-semibold text-ink-900 hover:text-brand-700 hover:underline"
                  >
                    {company.name}
                  </Link>

                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {company.location}
                  </p>

                  {company.verification === COMPANY_STATUS.VERIFIED ? (
                    <Badge tone="success" className="mt-2">
                      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge tone="warning" className="mt-2">
                      {company.verification}
                    </Badge>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-px border-t border-ink-100 bg-ink-100 text-sm">
                <div className="bg-white px-5 py-3">
                  <dt className="text-xs text-ink-500">Open roles</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-ink-900">
                    <Briefcase className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                    {formatNumber(company.openJobs ?? 0)}
                  </dd>
                </div>

                <div className="bg-white px-5 py-3">
                  <dt className="text-xs text-ink-500">Company size</dt>
                  <dd className="mt-0.5 truncate font-semibold text-ink-900">
                    {company.size ?? COMPANY_SIZE[1]}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto border-t border-ink-100 px-5 py-3">
                <Button
                  as={Link}
                  to={PATHS.companyDetails(company.slug ?? company.id)}
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                >
                  View company
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={data?.totalItems ?? 0}
        rangeStart={(safePage - 1) * PAGE_SIZE + 1}
        rangeEnd={Math.min(safePage * PAGE_SIZE, data?.totalItems ?? 0)}
        onChange={(next) => updateParams({ page: next })}
      />
    </div>
  )
}