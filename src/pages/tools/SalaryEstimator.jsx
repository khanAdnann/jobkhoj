import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ResultActions from '@/components/tools/ResultActions'
import { estimateSalary, SALARY_UNITS, COMPANY_TYPES, recordEstimate } from '@/services/salaryService'
import { formatLpa } from '@/utils/format'

function salaryText(result) {
  const unit = result.unit === 'LPA' ? 'LPA' : 'per month'
  return `₹${formatLpa(result.min)} – ₹${formatLpa(result.max)} ${unit}`
}

function summaryOf(result) {
  const lines = [
    `${result.family}: ${salaryText(result)}`,
    `P25: ${formatLpa(result.p25)} LPA · P50: ${formatLpa(result.p50)} LPA · P75: ${formatLpa(result.p75)} LPA`,
    '',
    'Factors:',
    ...result.factors.map((factor) => `- ${factor.label}: ${factor.value} → ${factor.impact}`),
  ]
  if (result.premiumSkills.length) lines.push('', `Premium skills: ${result.premiumSkills.join(', ')}`)
  return lines.join('\n')
}

export default function SalaryEstimator() {
  const [form, setForm] = useState({
    jobTitle: '',
    experience: '3',
    location: '',
    skills: '',
    companyType: 'product',
    unit: 'LPA',
  })
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const patch = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const ready = form.jobTitle.trim().length > 0

  function run() {
    setError(null)
    try {
      const estimate = estimateSalary({
        jobTitle: form.jobTitle,
        experience: form.experience,
        location: form.location,
        skills: form.skills,
        companyType: form.companyType,
        unit: form.unit,
      })
      recordEstimate({ jobTitle: form.jobTitle }, estimate)
      setResult(estimate)
    } catch (caught) {
      setError(caught)
      setResult(null)
    }
  }

  return (
    <ToolShell
      toolId="salary-estimator"
      title="Salary Estimator"
      blurb="A transparent CTC estimate by role family, experience, location, skills and company type — every factor is shown, not hidden."
      icon="IndianRupee"
    >
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Job title"
            value={form.jobTitle}
            onChange={patch('jobTitle')}
            placeholder="Senior Backend Engineer"
            required
          />
          <Input
            label="Years of experience"
            type="number"
            min="0"
            step="0.5"
            value={form.experience}
            onChange={patch('experience')}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={patch('location')}
            placeholder="Bengaluru (or Remote)"
          />
          <Input
            label="Skills"
            value={form.skills}
            onChange={patch('skills')}
            placeholder="java, kafka, kubernetes"
            hint="Comma-separated — in-demand skills add a premium."
          />
          <Select
            label="Company type"
            options={COMPANY_TYPES.map((item) => ({ value: item.id, label: item.label }))}
            value={form.companyType}
            onChange={patch('companyType')}
          />
          <Select
            label="Unit"
            options={SALARY_UNITS.map((item) => ({ value: item.id, label: item.label }))}
            value={form.unit}
            onChange={patch('unit')}
          />
        </div>
        <div className="mt-4">
          <Button onClick={run} disabled={!ready} fullWidth>
            Estimate salary
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink-900">{result.family}</h2>
              <p className="text-sm text-ink-500">
                {form.jobTitle} · {form.location || 'National average'}
              </p>
            </div>
            <div className="rounded-xl bg-brand-50 px-5 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                Estimated range
              </p>
              <p className="text-xl font-bold text-brand-800">{salaryText(result)}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Conservative', value: `₹${formatLpa(result.p25)} LPA` },
              { label: 'Likely offer', value: `₹${formatLpa(result.p50)} LPA` },
              { label: 'Strong case', value: `₹${formatLpa(result.p75)} LPA` },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-ink-200 bg-ink-50/60 px-3.5 py-3">
                <dt className="text-xs font-medium text-ink-500">{row.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink-900">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-ink-800">How it was calculated</h3>
            <ul className="space-y-2">
              {result.factors.map((factor) => (
                <li
                  key={factor.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm"
                >
                  <span className="font-medium text-ink-700">{factor.label}</span>
                  <span className="flex items-center gap-3 text-ink-500">
                    {factor.value}
                    <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-semibold text-ink-700">
                      {factor.impact}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {result.premiumSkills.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-ink-800">In-demand skills detected</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.premiumSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-xs text-ink-400">{result.note}</p>

          <div className="mt-2">
            <ResultActions
              copyText={summaryOf(result)}
              onReset={() => {
                setResult(null)
                setError(null)
              }}
              note={result.meta.note}
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}