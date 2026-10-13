import { useState } from 'react'
import { Card, Button, Textarea } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ResultActions from '@/components/tools/ResultActions'
import { extractKeywords } from '@/services/jobAnalysisService'
import { consumeUsage, saveResult } from '@/services/toolsService'
import { useToast } from '@/hooks/useToast'

const GROUPS = [
  { key: 'languages', label: 'Languages' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'databases', label: 'Databases' },
  { key: 'cloud', label: 'Cloud & DevOps' },
  { key: 'tools', label: 'Tools' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'data', label: 'Data' },
  { key: 'practices', label: 'Practices' },
]

function Chip({ label, tone = 'ink' }) {
  const tones = {
    ink: 'border-ink-200 bg-ink-50 text-ink-700',
    brand: 'border-brand-200 bg-brand-50 text-brand-700',
    success: 'border-success-200 bg-success-50 text-success-700',
    warning: 'border-warning-200 bg-warning-50 text-warning-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone] ?? tones.ink}`}
    >
      {label}
    </span>
  )
}

function ChipGroup({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink-800">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Chip key={item} label={item} />
        ))}
      </div>
    </div>
  )
}

function flatten(result) {
  return [result.all.join(', '), ...result.jobTitles, ...result.actionVerbs].filter(Boolean).join(', ')
}

export default function KeywordExtractor() {
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  function run() {
    setBusy(true)
    setError(null)
    try {
      consumeUsage('aiAnalysis')
      const found = extractKeywords(text)
      setResult(found)
    } catch (caught) {
      setError(caught)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setText('')
    setResult(null)
    setError(null)
  }

  function onSave() {
    if (!result) return
    saveResult({
      toolId: 'keyword-extractor',
      title: 'Resume keywords',
      content: result.all.join(', '),
    })
    toast.success('Keywords saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="keyword-extractor"
      title="Resume Keyword Extractor"
      blurb="Pull skills, tools, languages, certifications, job titles and action verbs out of any resume text."
      icon="Tags"
      bucket="aiAnalysis"
    >
      <Card>
        <Textarea
          label="Resume text"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
          hint="Paste the resume body — the recogniser matches your wording against a structured vocabulary."
          placeholder="5+ years of Java, Spring Boot and Kafka…"
        />
        <div className="mt-4">
          <Button onClick={run} loading={busy} disabled={!text.trim()} fullWidth>
            Extract keywords
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {result.all.length} total keywords · {result.jobTitles.length} job titles ·{' '}
              {result.actionVerbs.length} action verbs
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {GROUPS.map((group) => (
              <ChipGroup key={group.key} title={group.label} items={result[group.key]} />
            ))}
          </div>

          <div className="mt-6 space-y-6">
            <ChipGroup title="Job titles" items={result.jobTitles} />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink-800">Action verbs</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.actionVerbs.map((verb) => (
                  <Chip key={verb} label={verb} tone="success" />
                ))}
              </div>
            </div>
            <ChipGroup title="Certifications" items={result.certifications} />
            <ChipGroup title="Soft skills" items={result.softSkills} />
          </div>

          <div className="mt-6">
            <ResultActions
              copyText={flatten(result)}
              onSave={onSave}
              onReset={reset}
              note="Matches the same deterministic vocabulary used by the ATS checker and JD tools."
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}