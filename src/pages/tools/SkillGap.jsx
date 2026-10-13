import { useState } from 'react'
import { Card, Button, Textarea } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ScoreGauge from '@/components/tools/ScoreGauge'
import KeywordChips from '@/components/tools/KeywordChips'
import ResultActions from '@/components/tools/ResultActions'
import { analyzeSkillGap } from '@/services/jobAnalysisService'
import { consumeUsage, saveResult } from '@/services/toolsService'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const PRIORITY = {
  High: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  Medium: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  Low: 'bg-ink-100 text-ink-600 ring-ink-300/30',
}

function summaryOf(result) {
  const lines = [
    `Skill coverage: ${result.coverage}%`,
    `Have: ${result.have.length} · Missing: ${result.missing.length}`,
    '',
    'Missing skills:',
    ...result.missing.map((item) => `- ${item.name} (${item.priority})`),
  ]
  if (result.others.length) lines.push('', `Extra skills you have: ${result.others.join(', ')}`)
  return lines.join('\n')
}

function PriorityGroup({ result }) {
  const order = ['High', 'Medium', 'Low']
  return (
    <div className="space-y-4">
      {order.map((priority) => {
        const items = result.missing.filter((item) => item.priority === priority)
        if (!items.length) return null
        return (
          <div key={priority}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {priority} priority ({items.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span
                  key={item.name}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                    PRIORITY[priority] ?? PRIORITY.Low,
                  )}
                >
                  {item.name}
                  <span className="text-[10px] font-normal opacity-70">{item.group}</span>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SkillGap() {
  const toast = useToast()
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      consumeUsage('aiAnalysis')
      setResult(await analyzeSkillGap(resume, jd))
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
    saveResult({
      toolId: 'skill-gap',
      title: `Skill gap — ${result.coverage}% coverage`,
      content: summaryOf(result),
    })
    toast.success('Gap report saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="skill-gap"
      title="Skill Gap Analyzer"
      blurb="See the skills you have, the skills the job wants and what to learn first — grouped by priority."
      icon="GitCompareArrows"
      bucket="aiAnalysis"
    >
      <Card>
        <div className="space-y-4">
          <Textarea
            label="Your resume text"
            rows={7}
            value={resume}
            onChange={(event) => setResume(event.target.value)}
            hint="Paste the skills and experience from your current resume."
            placeholder="Java, Spring Boot, Kubernetes, REST APIs…"
          />
          <Textarea
            label="Target job description"
            rows={7}
            value={jd}
            onChange={(event) => setJd(event.target.value)}
            hint="Paste the posting whose requirements you want to compare against."
            placeholder="Skills required: Java, Kafka, Docker…"
          />
          <Button onClick={run} loading={busy} disabled={!resume.trim() || !jd.trim()} fullWidth>
            Analyze skill gap
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <ScoreGauge
              score={result.coverage}
              label="Skill coverage"
              sublabel={result.jdTitle || 'vs the job'}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-ink-600">
                You match <strong className="text-ink-900">{result.have.length}</strong> of{' '}
                <strong className="text-ink-900">
                  {result.have.length + result.missing.length}
                </strong>{' '}
                skills the posting asks for.
                {result.others.length > 0 && (
                  <span className="mt-1 block">
                    Skills you have that the posting does not list:{' '}
                    <span className="font-medium text-ink-800">{result.others.join(', ')}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-800">Skills to learn</h3>
              <PriorityGroup result={result} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-800">
                Skills you already have
              </h3>
              <KeywordChips
                present={result.have}
                presentTitle="Matched"
                emptyNote="No matching skills detected yet."
              />
            </div>
          </div>

          <div className="mt-6">
            <ResultActions
              copyText={summaryOf(result)}
              onSave={onSave}
              onReset={reset}
              note="Priorities come from whether each skill is listed as required or nice-to-have."
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}