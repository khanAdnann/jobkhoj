import { useState } from 'react'
import { Card, Button, Textarea } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ResultActions from '@/components/tools/ResultActions'
import { analyzeJd } from '@/services/jobAnalysisService'
import { consumeUsage, saveResult } from '@/services/toolsService'
import { formatSalaryRange } from '@/utils/format'
import { useToast } from '@/hooks/useToast'

function ChipList({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink-800">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3.5 py-3">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-900">{value}</dd>
    </div>
  )
}

function experienceLabel(experience) {
  if (!experience) return 'Not stated'
  const { minYears, maxYears } = experience
  if (minYears !== maxYears) return `${minYears}–${maxYears} years`
  return `${minYears} years`
}

function salaryLabel(result) {
  if (!result.salary) return 'Not stated'
  const { min, max, unit } = result.salary
  if (unit === 'USD') return `$${min}–${max} USD`
  if (unit === 'INR') return `₹${min.toLocaleString('en-IN')}`
  return formatSalaryRange(min, max)
}

function summaryOf(result) {
  const lines = [
    result.title || 'Job Description Analysis',
    `Seniority: ${result.seniority?.label}`,
    `Experience: ${experienceLabel(result.experience)}`,
    result.education ? `Education: ${result.education}` : '',
    result.locations.length ? `Locations: ${result.locations.join(', ')}` : '',
    `Salary: ${salaryLabel(result)}`,
    '',
    `Required skills (${result.skills.required.length}):`,
    ...result.skills.required.map((skill) => `- ${skill}`),
    '',
    `Keywords (${result.keywords.length}): ${result.keywords.join(', ')}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export default function JdAnalyzer() {
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      consumeUsage('aiAnalysis')
      setResult(await analyzeJd(text))
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
    saveResult({ toolId: 'jd-analyzer', title: 'Job Description Analysis', content: summaryOf(result) })
    toast.success('Analysis saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="jd-analyzer"
      title="Job Description Analyzer"
      blurb="Paste any posting to extract the skills, seniority, education, salary range, locations and keywords recruiters care about."
      icon="ScanText"
      bucket="aiAnalysis"
    >
      <Card>
        <Textarea
          label="Job description"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
          hint="Paste the full posting. Headings like Responsibilities and Requirements are parsed into their own buckets."
          placeholder="About the role… Responsibilities… Requirements…"
        />
        <div className="mt-4">
          <Button onClick={run} loading={busy} disabled={!text.trim()} fullWidth>
            Analyze job description
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                {result.title || 'Job posting'}
                <span className="ml-2 text-sm font-normal text-ink-500">
                  {result.seniority?.label}
                </span>
              </h2>
              <p className="mt-0.5 text-xs text-ink-500">
                {result.stats?.words} words · {result.stats?.detectedSkills} detected skills
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Experience" value={experienceLabel(result.experience)} />
            <Stat label="Education" value={result.education} />
            <Stat label="Salary" value={salaryLabel(result)} />
            <Stat label="Locations" value={result.locations.join(', ') || null} />
          </dl>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ChipList title={`Required skills (${result.skills.required.length})`} items={result.skills.required} />
            <ChipList title={`Nice-to-have skills (${result.skills.preferred.length})`} items={result.skills.preferred} />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ChipList title="Technologies" items={result.technologies} />
            <ChipList title="Soft skills" items={result.softSkills} />
          </div>

          {result.responsibilities.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-ink-800">Responsibilities</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-700">
                {result.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <ChipList title="Keywords to mirror in your resume" items={result.keywords} />
          </div>

          <div className="mt-6">
            <ResultActions
              copyText={summaryOf(result)}
              onSave={onSave}
              onReset={reset}
              note="Parsed locally by the deterministic JD engine — shareable as a summary note."
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}