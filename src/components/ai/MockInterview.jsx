import { useState } from 'react'
import {
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'
import { startMockInterview, submitInterviewAnswer } from '@/services/aiService'
import { Card, CardHeader, Button, Badge } from '@/components/common'

const INTERVIEW_ROLES = [
  'Java Developer',
  'Spring Boot Developer',
  'React Developer',
  'Full Stack Developer',
  'SQL Developer',
]

const LEVELS = [
  { id: 'Junior', label: 'Junior (0-2 yrs)' },
  { id: 'Mid', label: 'Mid-Level (3-5 yrs)' },
  { id: 'Senior', label: 'Senior (5+ yrs)' },
]

export default function MockInterview() {
  const [role, setRole] = useState('Java Developer')
  const [level, setLevel] = useState('Mid')
  const [topic, setTopic] = useState('')

  const [session, setSession] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    setFeedback(null)
    try {
      const data = await startMockInterview({ role, level, topic })
      setSession(data)
      setAnswer('')
    } catch (err) {
      setError(err.message || 'Failed to initialize interview session.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const data = await submitInterviewAnswer({
        sessionId: session.sessionId,
        answer: answer.trim(),
      })
      setFeedback(data)
      if (data.isComplete) {
        setSession((prev) => ({ ...prev, isComplete: true, summary: data.summaryReport }))
      } else {
        setSession((prev) => ({
          ...prev,
          questionIndex: data.nextQuestionIndex,
          question: data.nextQuestion,
        }))
        setAnswer('')
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSession(null)
    setFeedback(null)
    setAnswer('')
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Configuration View (Before Start) */}
      {!session && (
        <Card>
          <CardHeader
            title="AI Technical Mock Interview"
            subtitle="Practice technical interviews with real-time AI evaluation, scoring, and feedback powered by Ollama."
          />
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-xl bg-danger-50 p-4 text-xs text-danger-700 border border-danger-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                  Target Role
                </label>
                <div className="space-y-2">
                  {INTERVIEW_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        role === r
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100'
                          : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                      }`}
                    >
                      <span>{r}</span>
                      {role === r && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setLevel(lvl.id)}
                        className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-all ${
                          level === lvl.id
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-ink-200 text-ink-700 hover:bg-ink-50'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                    Specific Focus Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Concurrency, Microservices, React Hooks, Indexing..."
                    className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <p className="mt-1 text-xs text-ink-500">
                    Leave blank for a comprehensive full-breadth technical round.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    loading={loading}
                    onClick={handleStart}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                    Start Mock Interview Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Active Session View */}
      {session && !session.isComplete && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-ink-100 p-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Badge tone="brand">
                  Question {session.questionIndex} of {session.totalQuestions || 5}
                </Badge>
                <span className="text-xs text-ink-500">
                  {session.role} ({session.level})
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Restart
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-2xl bg-brand-50/60 border border-brand-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800 flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-4 w-4" />
                  Interviewer Question:
                </p>
                <h3 className="text-base sm:text-lg font-bold text-ink-900 leading-snug">
                  {session.question}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                  Your Answer:
                </label>
                <textarea
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Explain your approach clearly. Mention internal mechanics, edge cases, and practical trade-offs..."
                  className="w-full rounded-2xl border border-ink-200 p-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <div className="flex justify-between items-center text-xs text-ink-400 mt-1">
                  <span>Aim for clear, structured technical explanations.</span>
                  <span>{answer.length} characters</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-danger-50 p-3 text-xs text-danger-700 border border-danger-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  loading={loading}
                  disabled={answer.trim().length < 10}
                  onClick={handleSubmitAnswer}
                >
                  Submit & Evaluate Answer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Feedback from previous answer */}
          {feedback && (
            <Card>
              <CardHeader
                title="AI Evaluation & Insights"
                action={
                  feedback.score && (
                    <Badge tone={feedback.score >= 8 ? 'success' : feedback.score >= 6 ? 'warning' : 'danger'}>
                      Score: {feedback.score} / 10
                    </Badge>
                  )
                }
              />
              <div className="p-6 prose-sm text-ink-800 whitespace-pre-line leading-relaxed">
                {feedback.feedback}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Completed Summary View */}
      {session && session.isComplete && (
        <Card>
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900">Mock Interview Completed!</h2>
              <p className="text-xs text-ink-500 mt-1">
                Role: {session.role} ({session.level})
              </p>
            </div>

            <div className="mx-auto max-w-xl text-left rounded-2xl bg-ink-50 p-6 border border-ink-200 whitespace-pre-line text-xs sm:text-sm text-ink-800">
              {session.summary}
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Button variant="primary" onClick={handleReset}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Start Another Round
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

