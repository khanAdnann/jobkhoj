import { useState } from 'react'
import { Card, Textarea, Button } from '@/components/common'
import ToolShell from './ToolShell'
import ToolErrorNotice from './ToolErrorNotice'
import ScoreGauge from './ScoreGauge'
import CategoryBars from './CategoryBars'
import KeywordChips from './KeywordChips'
import ResultActions from './ResultActions'
import { saveResult } from '@/services/toolsService'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const PRIORITY_TONE = {
  High: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  Medium: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  Low: 'bg-ink-100 text-ink-600 ring-ink-300/30',
}

function summaryOf(result) {
  const lines = [`Job match score: ${result.matchScore}/100`, '']
  if (result.jdTitle) lines.push(`Target role: ${result.jdTitle}`)
  result.breakdown?.forEach((row) =>
    lines.push(`${row.label}: ${row.score}/100 (weight ${row.weight}%)`),
  )
  lines.push('', 'Recommendations:')
  result.recommendations?.forEach((item) => lines.push(`- [${item.priority}] ${item.text}`))
  return lines.join('\n')
}

/**
 * Shared scaffold for the two text-in/text-out match tools (Resume Optimizer
 * and Job Match Checker): paste a resume and a job description, inspect the
 * fit score and close the gaps. Each page only supplies its copy + the run fn.
 */
export default function TextMatchAnalyzer({
  toolId,
  title,
  blurb,
  icon,
  badge,
  bucket = 'aiAnalysis',
  resumeLabel = 'Paste your resume text',
  jdLabel = 'Paste the job description',
  resumeHint = 'Plain text from your resume, or use the ATS checker to grab it from a file.',
  jdHint = 'Paste the full posting — the parser reads skills, experience and keywords.',
  run,
  related,
  note,
}) {
  const toast = useToast()
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const ready = resume.trim().length > 0 && jd.trim().length > 0 && !busy

  async function analyze() {
    setBusy(true)
    setError(null)
    try {
      setResult(await run(resume, jd))
    } catch (caught) {
      setError(caught)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setResult(null)
    setError(null)
  }

  function onSave() {
    if (!result) return
    saveResult({ toolId, title, content: summaryOf(result) })
    toast.success('Result saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId={toolId}
      title={title}
      blurb={blurb}
      icon={icon}
      badge={badge}
      bucket={bucket}
      related={related}
    >
      <Card>
        <div className="space-y-4">
          <Textarea
            label={resumeLabel}
            rows={8}
            value={resume}
            onChange={(event) => setResume(event.target.value)}
            hint={resumeHint}
            placeholder="…with 3+ years building React applications and Node services…"
          />
          <Textarea
            label={jdLabel}
            rows={8}
            value={jd}
            onChange={(event) => setJd(event.target.value)}
            hint={jdHint}
            placeholder="Full job posting text, including requirements and nice-to-haves…"
          />
          <Button onClick={analyze} loading={busy} disabled={!ready} fullWidth>
            {title.includes('Optimize') ? 'Optimize resume' : 'Check match'}
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <ScoreGauge
              score={result.matchScore}
              label="Job match"
              sublabel={result.jdTitle || 'Fit score'}
            />
            <div className="min-w-0 flex-1">
              <CategoryBars rows={result.breakdown} showWeight />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink-800">
                Required skills — found vs missing
              </h3>
              <KeywordChips
                present={result.matchedRequired}
                missing={result.missingRequired}
                presentTitle="Found"
                missingTitle="Missing"
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink-800">
                Keywords that do not appear in your resume
              </h3>
              <KeywordChips
                present={result.matchedKeywords}
                missing={result.missingKeywords}
                presentTitle="Matched"
                missingTitle="Missed"
              />
            </div>
          </div>

          {result.recommendations?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink-800">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((item) => (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-3"
                  >
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                        PRIORITY_TONE[item.priority] ?? 'bg-ink-100 text-ink-600 ring-ink-300/30',
                      )}
                    >
                      {item.priority}
                    </span>
                    <p className="text-sm leading-relaxed text-ink-700">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <ResultActions
              copyText={summaryOf(result)}
              onSave={onSave}
              onReset={reset}
              note={
                note ??
                (result.jd
                  ? `Scored locally from the deterministic JD parser — no resume or posting is uploaded.`
                  : '')
              }
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}