import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import ToolErrorNotice from '@/components/tools/ToolErrorNotice'
import ResultActions from '@/components/tools/ResultActions'
import MockInterview from '@/components/ai/MockInterview'
import { generateQuestionSetAsync, DIFFICULTIES } from '@/services/interviewService'
import { consumeUsage, saveResult } from '@/services/toolsService'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { Sparkles, ListFilter } from 'lucide-react'

const DIFFICULTY_TONES = {
  Easy: 'bg-success-50 text-success-700',
  Medium: 'bg-info-50 text-info-700',
  Hard: 'bg-warning-50 text-warning-700',
  Expert: 'bg-danger-50 text-danger-700',
}

const COUNTS = [3, 5, 8, 10]

function summaryOf(result) {
  const lines = [`${result.total} interview questions · ${result.seniority}`, '']
  result.categories.forEach((category) => {
    lines.push(`${category.name}:`)
    category.questions.forEach((q) => lines.push(`- [${q.difficulty}] ${q.question}`))
    lines.push('')
  })
  return lines.join('\n')
}

export default function InterviewQuestions() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('interactive')
  const [form, setForm] = useState({
    jobTitle: '',
    experience: '3',
    skills: '',
    difficulty: '',
    count: '5',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const patch = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const ready = !busy && form.jobTitle.trim().length > 0

  async function run() {
    setBusy(true)
    setError(null)
    try {
      consumeUsage('interviewSet')
      setResult(
        await generateQuestionSetAsync({
          jobTitle: form.jobTitle,
          experience: form.experience,
          skills: form.skills,
          difficulty: form.difficulty,
          count: Number(form.count),
        }),
      )
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
      toolId: 'interview-questions',
      title: `Interview set — ${form.jobTitle || 'General'}`,
      content: summaryOf(result),
    })
    toast.success('Question set saved to "Saved results"')
  }

  return (
    <ToolShell
      toolId="interview-questions"
      title="Interview Preparation & Mock Interviews"
      blurb="Practice live 1-on-1 technical mock interviews with AI evaluation, or generate curated question sets."
      icon="MessagesSquare"
      badge="AI-Powered"
      bucket="interviewSet"
    >
      {/* Mode Switcher Tabs */}
      <div className="mb-6 flex rounded-xl bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('interactive')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all',
            activeTab === 'interactive'
              ? 'bg-white text-brand-700 shadow-xs'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          <Sparkles className="h-4 w-4 text-brand-600" />
          Interactive AI Mock Interview (Live)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all',
            activeTab === 'generator'
              ? 'bg-white text-brand-700 shadow-xs'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          <ListFilter className="h-4 w-4 text-ink-500" />
          Question Bank Generator
        </button>
      </div>

      {activeTab === 'interactive' ? (
        <MockInterview />
      ) : (
        <>
          <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Job title" value={form.jobTitle} onChange={patch('jobTitle')} placeholder="Backend Engineer" required />
          <Input
            label="Years of experience"
            type="number"
            min="0"
            value={form.experience}
            onChange={patch('experience')}
          />
          <Input
            label="Skills"
            value={form.skills}
            onChange={patch('skills')}
            placeholder="java, spring, kafka, sql"
            hint="Comma-separated — matched against the question bank."
            containerClassName="sm:col-span-2"
          />
          <Select
            label="Difficulty"
            options={[
              { value: '', label: 'Balanced' },
              ...DIFFICULTIES.map((item) => ({ value: item.id, label: item.label })),
            ]}
            value={form.difficulty}
            onChange={patch('difficulty')}
            hint={DIFFICULTIES.find((item) => item.id === form.difficulty)?.hint}
          />
          <Select
            label="Questions per category"
            options={COUNTS.map((count) => ({ value: String(count), label: String(count) }))}
            value={form.count}
            onChange={patch('count')}
          />
        </div>

        <div className="mt-4">
          <Button onClick={run} loading={busy} disabled={!ready} fullWidth>
            Generate questions
          </Button>
        </div>
      </Card>

      {error && <ToolErrorNotice error={error} className="mt-4" />}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {result.total} questions
            </span>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
              {result.seniority} track
            </span>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
              {result.categories.length} categories
            </span>
          </div>

          {result.categories.map((category) => (
            <Card key={category.key} className="overflow-hidden">
              <div className="border-b border-ink-200 bg-ink-50/60 px-5 py-3">
                <h2 className="text-sm font-semibold text-ink-900">{category.name}</h2>
              </div>
              <ul className="divide-y divide-ink-100 px-5">
                {category.questions.map((question) => (
                  <li key={question.id} className="py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed text-ink-800">{question.question}</p>
                      <span
                        className={cn(
                          'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          DIFFICULTY_TONES[question.difficulty] ?? 'bg-ink-100 text-ink-600',
                        )}
                      >
                        {question.difficulty}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">{question.focus}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <Card>
            <ResultActions
              copyText={summaryOf(result)}
              onSave={onSave}
              onReset={() => setResult(null)}
              note={result.meta.note}
            />
          </Card>
        </div>
      )}
        </>
      )}
    </ToolShell>
  )
}