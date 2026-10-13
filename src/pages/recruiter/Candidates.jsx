import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Briefcase, Filter, Mail, MapPin, Phone, Search, SlidersHorizontal, X } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Avatar from '@/components/common/Avatar'
import Field from '@/components/common/Field'
import Input from '@/components/common/Input'
import TagInput from '@/components/common/TagInput'
import Pagination from '@/components/common/Pagination'
import Drawer from '@/components/common/Drawer'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import { useFetch } from '@/hooks/useFetch'
import * as applicationService from '@/services/applicationService'
import { SKILLS, STATUS_TONE } from '@/utils/constants'
import { formatDate, formatNumber } from '@/utils/format'

const PAGE_SIZE = 12

/**
 * Candidate search across the whole seeker pool (PRD section 19).
 *
 * Filters live in the URL so a recruiter can bookmark or share a shortlist.
 * Results are scoped to every seeker on the platform — not just applicants to
 * this company's jobs — which is the point of a talent pool.
 */
export default function Candidates() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('query') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [draftQuery, setDraftQuery] = useState(query)
  const [skills, setSkills] = useState(() => searchParams.get('skills')?.split(',').filter(Boolean) ?? [])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Keep the input in sync when the URL changes (back button, reset link).
  useEffect(() => {
    setDraftQuery(query)
    setSkills(searchParams.get('skills')?.split(',').filter(Boolean) ?? [])
  }, [query, searchParams])

  const search = useFetch(
    () => applicationService.searchCandidates({ query, skills, page, pageSize: PAGE_SIZE }),
    [query, skills.join(','), page],
  )

  const items = search.data?.items ?? []

  function updateParams(next, { resetPage = true } = {}) {
    const params = new URLSearchParams(searchParams)
    next.forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) params.delete(key)
      else params.set(key, String(value))
    })
    if (resetPage) params.delete('page')
    setSearchParams(params, { replace: true })
  }

  function applyFilters(event) {
    event.preventDefault()
    updateParams([
      ['query', draftQuery.trim()],
      ['skills', skills.join(',')],
    ])
  }

  function clearFilters() {
    setDraftQuery('')
    setSkills([])
    setSearchParams({}, { replace: true })
  }

  const activeFilterCount = skills.length + (draftQuery.trim() ? 1 : 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Candidates"
        subtitle="Search every job seeker on JobKhoj, then reach out or shortlist them for an open role."
        actions={
          <Button
            variant="outline"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="lg:hidden"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <Badge tone="brand" size="sm" className="ml-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ------------------------------ filters --------------------------- */}
        <aside className={filtersOpen ? 'block' : 'hidden lg:block'}>
          <Card padded={false} className="lg:sticky lg:top-6">
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  Filters
                </span>
              }
              action={
                activeFilterCount > 0 && (
                  <Button variant="ghost" size="xs" onClick={clearFilters}>
                    Clear all
                  </Button>
                )
              }
            />

            <form onSubmit={applyFilters} className="space-y-5 p-5">
              <Field label="Search" htmlFor="c-query">
                <Input
                  id="c-query"
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="Name, title, skill or city"
                  icon={Search}
                />
              </Field>

              <Field
                label="Skills"
                htmlFor="c-skills"
                hint="Candidates must have every skill you add."
              >
                <TagInput
                  id="c-skills"
                  max={8}
                  value={skills}
                  onChange={setSkills}
                  suggestions={SKILLS}
                  placeholder="Java, React…"
                />
              </Field>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          </Card>
        </aside>

        {/* ------------------------------ results --------------------------- */}
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              {search.loading ? (
                'Searching…'
              ) : (
                <>
                  <span className="font-semibold text-ink-800">
                    {formatNumber(search.data?.totalItems ?? 0)}
                  </span>{' '}
                  candidate{(search.data?.totalItems ?? 0) === 1 ? '' : 's'} found
                </>
              )}
            </p>

            {skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  const next = skills.filter((item) => item !== skill)
                  setSkills(next)
                  updateParams([['skills', next.join(',')]])
                }}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
              >
                {skill}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
          </div>

          {search.loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : search.error ? (
            <Card>
              <EmptyState
                icon="search"
                title="Search failed"
                description={search.error.message}
                action={
                  <Button variant="secondary" onClick={search.refetch}>
                    Try again
                  </Button>
                }
              />
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <EmptyState
                icon="users"
                title="No candidates match those filters"
                description="Try fewer skills, or a broader search term."
                action={
                  activeFilterCount > 0 ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onOpen={() => setSelectedId(candidate.id)}
                  />
                ))}
              </div>

              <Pagination
                page={search.data?.page ?? 1}
                totalPages={search.data?.totalPages ?? 1}
                totalItems={search.data?.totalItems ?? 0}
                rangeStart={(search.data?.page - 1) * PAGE_SIZE + 1}
                rangeEnd={Math.min(
                  search.data?.page * PAGE_SIZE,
                  search.data?.totalItems ?? 0,
                )}
                onChange={(next) => updateParams([['page', next]], { resetPage: false })}
              />
            </>
          )}
        </section>
      </div>

      <CandidateDrawer
        candidateId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function CandidateCard({ candidate, onOpen }) {
  const skills = useMemo(() => (candidate.skills ?? []).slice(0, 4), [candidate.skills])

  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start gap-3">
        <Avatar name={candidate.name} src={candidate.avatarUrl} />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            className="truncate text-left text-sm font-semibold text-ink-900 hover:text-brand-600 hover:underline"
          >
            {candidate.name}
          </button>
          <p className="mt-0.5 truncate text-xs text-ink-500">{candidate.headline}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" aria-hidden="true" />
              {candidate.yearsOfExperience ?? 0} yrs
            </span>
            {candidate.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {candidate.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skills.map((skill) => (
            <span key={skill} className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600">
              {skill}
            </span>
          ))}
          {(candidate.skills ?? []).length > skills.length && (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-500">
              +{(candidate.skills ?? []).length - skills.length}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
        {candidate.email && (
          <Button as="a" href={`mailto:${candidate.email}`} size="xs" variant="outline">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Email
          </Button>
        )}
        <Button size="xs" variant="ghost" onClick={onOpen} className="ml-auto">
          View profile
        </Button>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */

function CandidateDrawer({ candidateId, onClose }) {
  const query = useFetch(
    () => (candidateId ? applicationService.getCandidateById(candidateId) : Promise.resolve(null)),
    [candidateId],
  )

  const candidate = query.data
  const applications = candidate?.applications ?? []

  return (
    <Drawer open={Boolean(candidateId)} onClose={onClose} title="Candidate profile" footer={
      candidate ? (
        <div className="flex w-full gap-2">
          {candidate.email && (
            <Button as="a" href={`mailto:${candidate.email}`} fullWidth>
              <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Email {candidate.name?.split(' ')[0]}
            </Button>
          )}
          {candidate.phone && (
            <Button as="a" href={`tel:${candidate.phone}`} variant="outline" fullWidth>
              <Phone className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Call
            </Button>
          )}
        </div>
      ) : null
    }>
      {query.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : query.error ? (
        <EmptyState
          icon="search"
          title="Could not load this candidate"
          description={query.error.message}
          action={
            <Button variant="secondary" onClick={query.refetch}>
              Try again
            </Button>
          }
        />
      ) : candidate ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Avatar name={candidate.name} size="lg" src={candidate.avatarUrl} />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink-900">{candidate.name}</h2>
              <p className="mt-0.5 text-sm text-ink-500">{candidate.headline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3" aria-hidden="true" />
                  {candidate.yearsOfExperience ?? 0} yrs
                </span>
                {candidate.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {candidate.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              Contact
            </h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Email</dt>
                <dd className="truncate text-ink-800">{candidate.email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Phone</dt>
                <dd className="text-ink-800">{candidate.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Member since</dt>
                <dd className="text-ink-800">{formatDate(candidate.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {candidate.skills?.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              Applications ({applications.length})
            </h3>

            {applications.length === 0 ? (
              <p className="text-sm text-ink-400">No applications yet.</p>
            ) : (
              <ul className="space-y-2">
                {applications.map((application) => (
                  <li
                    key={application.id}
                    className="rounded-lg border border-ink-200 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-800">
                          {application.jobTitle}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {application.companyName} · {formatDate(application.appliedAt)}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[application.status] ?? 'neutral'} size="sm">
                        {application.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}