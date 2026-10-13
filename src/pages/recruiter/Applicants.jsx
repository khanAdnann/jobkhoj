import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, LayoutGrid, List, Users } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ApplicantCard from '@/components/recruiter/ApplicantCard'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as jobService from '@/services/jobService'
import * as applicationService from '@/services/applicationService'
import { PIPELINE_STAGE, PIPELINE_STAGES, STATUS_TONE } from '@/utils/constants'
import { formatNumber, timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import { PATHS } from '@/routes/paths'

const COLUMN_TONE = {
  neutral: 'bg-ink-100 text-ink-600',
  info: 'bg-info-50 text-info-600',
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-warning-50 text-warning-700',
  success: 'bg-success-50 text-success-700',
}

/**
 * Applicant pipeline board (PRD section 17).
 *
 * Two views over the same data: a Kanban board where cards move between stages
 * by drag-and-drop, and a sortable table. Moving a card updates both the
 * pipeline column and the status the candidate sees, in one request.
 */
export default function Applicants() {
  const { id } = useParams()
  const toast = useToast()

  const [view, setView] = useState('board')
  const [dragOver, setDragOver] = useState(null)
  const [movingId, setMovingId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const jobQuery = useFetch(() => jobService.getJob(id), [id])
  const pipelineQuery = useFetch(() => applicationService.getPipeline(id), [id])

  const columns = pipelineQuery.data?.columns ?? {}
  const rejectedCount = pipelineQuery.data?.rejectedCount ?? 0

  async function moveStage(application, stage) {
    if (!stage || stage === application.stage) return

    setMovingId(application.id)
    try {
      const updated = await applicationService.updateApplicationStage(application.id, stage)
      // Reflect the move immediately instead of refetching the whole board.
      const next = { ...columns }
      next[application.stage] = (next[application.stage] ?? []).filter((row) => row.id !== application.id)
      next[stage] = [...(next[stage] ?? []), { ...application, ...updated, stage }]

      pipelineQuery.setData({ ...pipelineQuery.data, columns: next })

      if (stage === PIPELINE_STAGE.REJECTED) {
        pipelineQuery.setData({
          ...pipelineQuery.data,
          columns: next,
          rejectedCount: rejectedCount + 1,
        })
        toast.info(`${application.candidateName} was rejected.`)
      } else {
        toast.success(`${application.candidateName} moved to ${stage.toLowerCase()}.`)
      }
    } catch (error) {
      toast.error(error.message)
      pipelineQuery.refetch()
    } finally {
      setMovingId(null)
    }
  }

  /** Advance / retreat relative to the column order. */
  function moveRelative(application, direction) {
    const currentIndex = PIPELINE_STAGES.findIndex((stage) => stage.key === application.stage)
    const target = PIPELINE_STAGES[currentIndex + (direction === 'NEXT' ? 1 : -1)]
    if (target) moveStage(application, target.key)
  }

  async function handleDrop(event, stageKey) {
    event.preventDefault()
    setDragOver(null)

    const applicationId = event.dataTransfer.getData('text/plain')
    const all = Object.values(columns).flat()
    const application = all.find((row) => row.id === applicationId)
    if (application) await moveStage(application, stageKey)
  }

  if (pipelineQuery.error) {
    return (
      <Card>
        <EmptyState
          icon="inbox"
          title="Could not load applicants"
          description={pipelineQuery.error.message}
          action={
            <Button variant="secondary" onClick={pipelineQuery.refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  const totalApplicants = Object.values(columns).reduce((sum, list) => sum + list.length, 0)

  return (
    <div className="space-y-5">
      <div>
        <Button
          as={Link}
          to={PATHS.recruiter.jobDetails(id)}
          variant="ghost"
          size="sm"
          className="-ml-3 mb-3"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back to job
        </Button>

        <PageHeader
          title="Applicants"
          subtitle={
            jobQuery.data ? (
              <span className="flex flex-wrap items-center gap-2">
                <span>{jobQuery.data.title}</span>
                <Badge tone="neutral">{formatNumber(totalApplicants)} candidates</Badge>
                {rejectedCount > 0 && (
                  <Badge tone="danger">{rejectedCount} rejected</Badge>
                )}
              </span>
            ) : (
              'Loading job…'
            )
          }
          actions={
            <>
              {jobQuery.data && (
                <Button as={Link} to={PATHS.jobDetails(id)} variant="ghost" size="sm">
                  <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Public page
                </Button>
              )}

              <div className="flex rounded-lg border border-ink-300 p-0.5">
                {[
                  { key: 'board', label: 'Board', icon: LayoutGrid },
                  { key: 'table', label: 'Table', icon: List },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setView(option.key)}
                    aria-pressed={view === option.key}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
                      view === option.key
                        ? 'bg-white text-ink-900 shadow-sm'
                        : 'text-ink-500 hover:text-ink-800',
                    )}
                  >
                    <option.icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          }
        />
      </div>

      {pipelineQuery.loading ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {PIPELINE_STAGES.map((stage) => (
            <Skeleton key={stage.key} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : totalApplicants === 0 ? (
        <Card>
          <EmptyState
            icon="users"
            title="No applicants yet"
            description="Candidates who apply to this job will appear here in a pipeline you can move through."
            action={
              <Button as={Link} to={PATHS.jobDetails(id)} variant="outline">
                Back to job
              </Button>
            }
          />
        </Card>
      ) : view === 'board' ? (
        /* ------------------------------ board ---------------------------- */
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-max gap-3 md:grid-cols-3 xl:grid-cols-6">
            {PIPELINE_STAGES.map((stage, stageIndex) => {
              const cards = columns[stage.key] ?? []

              return (
                <section
                  key={stage.key}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(stage.key)
                  }}
                  onDragLeave={() => setDragOver((prev) => (prev === stage.key ? null : prev))}
                  onDrop={(event) => handleDrop(event, stage.key)}
                  className={cn(
                    'flex w-64 flex-col rounded-xl border-2 p-3 transition-colors xl:w-auto',
                    dragOver === stage.key
                      ? 'border-brand-400 bg-brand-50/50'
                      : 'border-transparent bg-ink-100/60',
                  )}
                >
                  <header className="mb-3 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                        COLUMN_TONE[stage.tone] ?? COLUMN_TONE.neutral,
                      )}
                    >
                      {cards.length}
                    </span>
                    <h2 className="text-sm font-semibold text-ink-800">{stage.label}</h2>
                  </header>

                  <div className="min-h-16 space-y-2">
                    {cards.length === 0 && (
                      <p className="rounded-lg border border-dashed border-ink-300 px-3 py-6 text-center text-xs text-ink-400">
                        Drop candidates here
                      </p>
                    )}

                    {cards.map((application) => (
                      <ApplicantCard
                        key={application.id}
                        application={{
                          ...application,
                          isFirstColumn: stageIndex === 0,
                          isLastColumn: stageIndex === PIPELINE_STAGES.length - 1,
                        }}
                        onMove={moveRelative}
                        disabled={movingId === application.id}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      ) : (
        /* ------------------------------ table ---------------------------- */
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50">
                  {['Candidate', 'Experience', 'Applied', 'Stage', 'Status', ''].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {Object.entries(columns).flatMap(([stageKey, cards]) => {
                  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === stageKey)
                  const stageMeta = PIPELINE_STAGES[stageIndex]
                  const nextStage = PIPELINE_STAGES[stageIndex + 1]

                  return cards.map((application) => (
                    <tr key={application.id} className="transition-colors hover:bg-ink-50/70">
                      <td className="px-5 py-3">
                        <Link
                          to={PATHS.recruiter.applicantDetails(application.id)}
                          className="font-medium text-ink-900 hover:text-brand-600 hover:underline"
                        >
                          {application.candidateName}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-500">{application.headline}</p>
                      </td>

                      <td className="px-5 py-3 text-ink-600">
                        {application.yearsOfExperience} yrs
                      </td>

                      <td className="px-5 py-3 text-ink-600">{timeAgo(application.appliedAt)}</td>

                      <td className="px-5 py-3">
                        <Badge tone={stageMeta?.tone ?? 'neutral'}>{stageMeta?.label ?? stageKey}</Badge>
                      </td>

                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[application.status] ?? 'neutral'}>
                          {application.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {nextStage && (
                            <Button
                              size="xs"
                              variant="outline"
                              loading={movingId === application.id}
                              onClick={() => moveStage(application, nextStage.key)}
                            >
                              → {nextStage.label}
                            </Button>
                          )}

                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-ink-500 hover:text-danger-600"
                            onClick={() => setConfirm(application)}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && moveStage(confirm, PIPELINE_STAGE.REJECTED)}
        title={`Reject ${confirm?.candidateName ?? 'this candidate'}?`}
        message="The candidate will see their status as Rejected. This can be reversed by moving them back on the board."
        confirmLabel="Reject candidate"
      />
    </div>
  )
}