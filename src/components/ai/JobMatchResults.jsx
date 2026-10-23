import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building2, MapPin, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/common'

export default function JobMatchResults({ jobs = [], explanation = '', loading = false }) {
  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center text-sm text-ink-500 animate-pulse">
          <Sparkles className="mx-auto h-8 w-8 text-brand-500 mb-2 animate-spin" />
          <p>Matching candidate profile against verified JobKhoj listings...</p>
        </div>
      </Card>
    )
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center text-sm text-ink-500">
          <p>No active job listings match your current criteria. Try broadening your skills or location.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {explanation && (
        <Card>
          <div className="p-5 bg-gradient-to-r from-brand-50 to-indigo-50/40 rounded-2xl border border-brand-100">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-4 w-4 text-brand-600" />
              AI Match Synthesis:
            </p>
            <p className="text-xs sm:text-sm text-ink-800 leading-relaxed whitespace-pre-line">
              {explanation}
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} hover>
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="font-bold text-base text-ink-900 hover:text-brand-600 transition-colors truncate"
                  >
                    {job.title}
                  </Link>
                  <Badge tone={job.matchScore >= 80 ? 'success' : 'brand'}>
                    {job.matchScore}% Match
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1 font-medium text-ink-700">
                    <Building2 className="h-3.5 w-3.5 text-ink-400" />
                    {job.companyName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-ink-400" />
                    {job.location} ({job.workMode})
                  </span>
                  <span>•</span>
                  <span>{job.employmentType}</span>
                </div>

                {/* Skills Match Breakdown */}
                <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mr-1">
                    Matched:
                  </span>
                  {job.matchedSkills?.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200"
                    >
                      ✓ {s}
                    </span>
                  ))}
                  {job.missingSkills?.length > 0 && (
                    <>
                      <span className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider ml-2 mr-1">
                        Learn:
                      </span>
                      {job.missingSkills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600"
                        >
                          + {s}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <Button as={Link} to={`/jobs/${job.id}`} variant="primary" size="sm">
                  View Job
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

