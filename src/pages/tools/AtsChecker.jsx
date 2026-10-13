import { useState } from 'react'
import { Card, Button, Textarea } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import FileDropzone from '@/components/tools/FileDropzone'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ScoreGauge from '@/components/tools/ScoreGauge'
import CategoryBars from '@/components/tools/CategoryBars'
import KeywordChips from '@/components/tools/KeywordChips'
import ResultActions from '@/components/tools/ResultActions'
import { analyzeResume, ANALYSIS_MODE } from '@/services/atsService'
import { saveResult } from '@/services/toolsService'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const MODES = [
  { id: 'upload', label: 'Upload file' },
  { id: 'paste', label: 'Paste text' },
]

function summaryOf(report) {
  const lines = [
    `ATS score: ${report.overall}/100 (${report.band.label})`,
    `Word count: ${report.stats.wordCount} · Sections: ${report.stats.sectionsFound}`,
    '',
    'Top improvements:',
    ...report.improvements.map(
      (item) => `- ${item.category} (${item.score}/100, weight ${item.weight}%): ${item.action}`,
    ),
    '',
    'Suggestions:',
    ...report.suggestions.map((item) => `- ${item}`),
  ]
  return lines.join('\n')
}

export default function AtsChecker() {
  const toast = useToast()
  const [mode, setMode] = useState('upload')
  const [file, setFile] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(null)

  const ready = !busy && (mode === 'upload' ? file.length === 1 : text.trim().length > 0)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const result = await analyzeResume({
        file: mode === 'upload' ? file[0] : undefined,
        text: mode === 'paste' ? text : undefined,
        onProgress() {},
      })
      setReport(result)
    } catch (caught) {
      setError(caught)
      setReport(null)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setReport(null)
    setError(null)
    setText('')
    setFile([])
  }

  function onSave() {
    if (!report) return
    saveResult({
      toolId: 'ats-checker',
      title: `ATS report — ${report.overall}/100`,
      content: summaryOf(report),
    })
    toast.success('Report saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="ats-checker"
      title="ATS Resume Checker"
      blurb="Score your resume 0–100 across 11 recruiter-screening categories and see exactly what an applicant tracking system will reward."
      icon="FileSearch"
      badge="Popular"
      bucket="atsCheck"
    >
      <Card>
        <div className="mb-4 inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id)
                setError(null)
                setReport(null)
              }}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                mode === item.id
                  ? 'bg-white text-ink-900 shadow-sm ring-1 ring-ink-200'
                  : 'text-ink-500 hover:text-ink-800',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === 'upload' ? (
          <FileDropzone
            label="Resume file"
            accept=".pdf,.docx,.doc,.txt"
            files={file}
            onChange={setFile}
            hint="PDF, DOCX or TXT — parsed locally, never uploaded"
            maxSizeMb={15}
          />
        ) : (
          <Textarea
            label="Resume text"
            rows={12}
            value={text}
            onChange={(event) => setText(event.target.value)}
            hint="Paste the full text of your resume. Plain-text and simple bullets score best."
            placeholder="Full name, contact details, skills, work experience, education…"
          />
        )}

        <div className="mt-4">
          <Button onClick={run} loading={busy} disabled={!ready} fullWidth>
            Analyze my resume
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {report && (
        <Card className="mt-4">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <ScoreGauge
              score={report.overall}
              label="Overall score"
              sublabel={report.band.label}
            />
            <div className="min-w-0 flex-1">
              <dl className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Words', value: report.stats.wordCount },
                  { label: 'Sections', value: report.stats.sectionsFound },
                  { label: 'Bullets', value: report.stats.bullets },
                  { label: 'Action verbs', value: report.stats.actionVerbs },
                  { label: 'Recognised skills', value: report.stats.recognizedSkills },
                  { label: 'Quantified bullets', value: report.stats.quantifiedBullets },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-ink-50 px-3 py-2.5">
                    <dd className="text-lg font-bold text-ink-900">{stat.value}</dd>
                    <dt className="text-xs font-medium text-ink-500">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-800">Category breakdown</h3>
              <CategoryBars
                rows={report.categories.map((category) => ({
                  label: category.label,
                  score: category.score,
                  weight: category.weight,
                  note: category.findings?.[0],
                }))}
                showWeight
              />
            </div>

            <div className="space-y-6">
              {report.missingKeywords.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink-800">
                    Keywords recruiters will search for
                  </h3>
                  <KeywordChips missing={report.missingKeywords} missingTitle="Not found" />
                </div>
              )}

              {report.suggestions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-ink-800">Top suggestions</h3>
                  <ul className="space-y-2">
                    {report.suggestions.slice(0, 6).map((suggestion) => (
                      <li
                        key={suggestion}
                        className="rounded-lg border border-ink-200 bg-ink-50/60 px-3.5 py-2.5 text-sm leading-relaxed text-ink-700"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {report.formattingIssues.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-ink-800">Formatting issues</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-600">
                {report.formattingIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <ResultActions
              copyText={summaryOf(report)}
              onSave={onSave}
              onReset={reset}
              note={ANALYSIS_MODE.note}
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}