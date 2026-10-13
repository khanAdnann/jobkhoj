import { useState } from 'react'
import { Card, Button, Input, Select, Textarea } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ResultActions from '@/components/tools/ResultActions'
import { generateCoverLetter, TONES, LENGTHS } from '@/services/coverLetterService'
import { consumeUsage, saveResult } from '@/services/toolsService'
import { downloadText } from '@/utils/download'
import { useToast } from '@/hooks/useToast'

export default function CoverLetter() {
  const toast = useToast()
  const [form, setForm] = useState({
    candidateName: '',
    jobTitle: '',
    company: '',
    experience: '',
    skills: '',
    jobDescription: '',
    tone: 'professional',
    length: 'medium',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const patch = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const ready = !busy && form.jobTitle.trim().length > 0

  function run() {
    setBusy(true)
    setError(null)
    try {
      consumeUsage('coverLetter')
      const letter = generateCoverLetter({
        candidateName: form.candidateName,
        jobTitle: form.jobTitle,
        company: form.company,
        experience: form.experience,
        skills: form.skills,
        jobDescription: form.jobDescription,
        tone: form.tone,
        length: form.length,
      })
      setResult(letter)
    } catch (caught) {
      setError(caught)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function onSave() {
    if (!result) return
    saveResult({
      toolId: 'cover-letter',
      title: `Cover letter — ${form.company || form.jobTitle}`,
      content: result.text,
    })
    toast.success('Letter saved to "Saved results"')
  }

  const tone = TONES.find((item) => item.id === form.tone)

  return (
    <ToolShell
      toolId="cover-letter"
      title="Cover Letter Generator"
      blurb="A tailored cover letter in four tones and three lengths — drafted from the details you provide."
      icon="Mail"
      badge="AI-ready"
      bucket="coverLetter"
    >
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Your name" value={form.candidateName} onChange={patch('candidateName')} placeholder="Adnan Khan" />
          <Input label="Job title" value={form.jobTitle} onChange={patch('jobTitle')} placeholder="Senior Backend Engineer" required />
          <Input label="Company" value={form.company} onChange={patch('company')} placeholder="Acme Technologies" />
          <Input label="Years of experience" value={form.experience} onChange={patch('experience')} placeholder="6+ years" />
          <Input
            label="Key skills"
            value={form.skills}
            onChange={patch('skills')}
            placeholder="java, kafka, kubernetes"
            hint="Comma-separated — the strongest ones carry the letter."
            containerClassName="sm:col-span-2"
          />
          <Textarea
            label="Job description (optional)"
            rows={4}
            value={form.jobDescription}
            onChange={patch('jobDescription')}
            hint="Pasted JD text is parsed so the letter mirrors the role's language."
            placeholder="Paste the posting to tailor the letter…"
            containerClassName="sm:col-span-2"
          />
          <Select
            label="Tone"
            options={TONES.map((item) => ({ value: item.id, label: item.label }))}
            value={form.tone}
            onChange={patch('tone')}
            hint={tone?.hint}
          />
          <Select
            label="Length"
            options={LENGTHS.map((item) => ({ value: item.id, label: item.label }))}
            value={form.length}
            onChange={patch('length')}
            hint={LENGTHS.find((item) => item.id === form.length)?.hint}
          />
        </div>

        <div className="mt-4">
          <Button onClick={run} loading={busy} disabled={!ready} fullWidth>
            Generate cover letter
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <Card className="mt-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {result.wordCount} words
            </span>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
              {tonedLabel(result.tone)}
            </span>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
              {lengthLabel(result.length)}
            </span>
          </div>

          <div className="space-y-4 rounded-xl border border-ink-200 bg-ink-50/60 p-6">
            {result.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="whitespace-pre-line text-sm leading-relaxed text-ink-800"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-4">
            <ResultActions
              copyText={result.text}
              onDownload={() => downloadText(result.text, `${(form.company || form.jobTitle).replace(/[^\w\s-]/g, '') || 'cover-letter'}-cover-letter.txt`, 'text/plain')}
              onSave={onSave}
              onReset={() => setResult(null)}
              note={result.meta.note}
            />
          </div>
        </Card>
      )}
    </ToolShell>
  )
}

function tonedLabel(id) {
  return TONES.find((item) => item.id === id)?.label ?? id
}

function lengthLabel(id) {
  return LENGTHS.find((item) => item.id === id)?.label ?? id
}