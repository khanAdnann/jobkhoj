import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Send,
  Upload,
  User,
} from 'lucide-react'
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/common'
import { submitApplication } from '@/services/applicationService'
import { getResume } from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { PATHS } from '@/routes/paths'
import { formatSalaryRange } from '@/utils/format'
import { cn } from '@/utils/cn'

const NOTICE_PERIODS = [
  'Immediate',
  '15 days',
  '30 days',
  '60 days',
  '90 days',
  'Not applicable',
]

const STEPS = ['Your details', 'Questions', 'Review']

/**
 * Apply-to-job modal (PRD section 10).
 *
 * Three steps: confirm contact details, answer the employer's questions, then
 * review and submit. The resume comes from the candidate's uploaded file — we
 * never re-ask for it inline, we just show what will be sent and offer a jump
 * to upload one if there isn't any.
 */
export default function ApplyModal({ open, onClose, job, onApplied }) {
  const { user, hasRole } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [resume, setResume] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      currentLocation: '',
      experience: '',
      expectedSalary: '',
      noticePeriod: '',
      coverLetter: '',
    },
  })

  const values = watch()

  /* Prefill from the signed-in profile and load the uploaded resume. */
  useEffect(() => {
    if (!open) return undefined

    setStep(0)
    setDone(false)

    if (user) {
      setValue('fullName', user.name ?? '')
      setValue('email', user.email ?? '')
      setValue('phone', user.phone ?? '')
      setValue('currentLocation', user.location ?? '')
      setValue('experience', String(user.yearsOfExperience ?? ''))
    }

    setResumeLoading(true)
    let cancelled = false

    getResume()
      .then((result) => {
        if (!cancelled) setResume(result)
      })
      .catch((error) => {
        if (!cancelled) {
          setResume(null)
          toast.error(error.message || 'Could not load your resume.')
        }
      })
      .finally(() => {
        if (!cancelled) setResumeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, user, setValue, toast])

  async function onSubmit() {
    setSubmitting(true)

    try {
      const application = await submitApplication({
        jobId: job.id,
        ...values,
        experience: values.experience ? Number(values.experience) : undefined,
        resume: resume ? { name: resume.name } : undefined,
      })

      setDone(true)
      onApplied?.(application)
      toast.success(`Application sent to ${job.company?.name ?? 'the employer'}.`)
    } catch (error) {
      toast.error(error.message || 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ------------------------------- permissions ------------------------------ */

  if (hasRole('RECRUITER', 'ADMIN')) {
    return (
      <Modal open={open} onClose={onClose} title="Applications are for job seekers" size="sm">
        <p className="text-sm text-ink-600">
          You are signed in with a {hasRole('ADMIN') ? 'admin' : 'recruiter'} account, so you
          cannot apply to jobs. Browse and manage candidates from your dashboard instead.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onClose()
              navigate(hasRole('ADMIN') ? PATHS.admin.dashboard : PATHS.recruiter.dashboard)
            }}
          >
            Go to dashboard
          </Button>
        </div>
      </Modal>
    )
  }

  /* ---------------------------------- success -------------------------------- */

  if (done) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Application submitted"
        size="sm"
        closeOnBackdrop={false}
      >
        <div className="text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>

          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Your application for <strong className="text-ink-900">{job.title}</strong> at{' '}
            <strong className="text-ink-900">{job.company?.name}</strong> is with the hiring
            team. You can follow its progress from your dashboard.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              onClose()
              navigate(PATHS.applications)
            }}
          >
            Track application
          </Button>
          <Button
            fullWidth
            onClick={() => {
              onClose()
              navigate(PATHS.savedJobs)
            }}
          >
            Saved jobs
          </Button>
        </div>
      </Modal>
    )
  }

  /* ----------------------------------- form ---------------------------------- */

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Apply — ${job.title}`}
      description={job.company?.name}
      size="lg"
      closeOnBackdrop={!submitting}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-500">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>

          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((prev) => prev - 1)} disabled={submitting}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button
                disabled={submitting}
                onClick={() => {
                  // Step 1 has required fields, so it must validate first. Later
                  // steps hold no required inputs and just advance.
                  if (step === 0) {
                    handleSubmit(() => setStep(1))()
                    return
                  }
                  setStep((prev) => prev + 1)
                }}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={onSubmit} loading={submitting}>
                {!submitting && <Send className="h-4 w-4" aria-hidden="true" />}
                Submit application
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* ------------------------------ step tracker ---------------------------- */}
      <ol className="mb-6 flex items-center gap-2" aria-label="Application steps">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                index < step
                  ? 'bg-success-500 text-white'
                  : index === step
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-200 text-ink-600',
              )}
              aria-current={index === step ? 'step' : undefined}
            >
              {index < step ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                'hidden text-xs font-medium sm:block',
                index === step ? 'text-ink-900' : 'text-ink-500',
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      {/* ------------------------------- step: 1 ------------------------------- */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Full name"
              icon={User}
              error={errors.fullName?.message}
              required
              {...register('fullName', { required: 'Your name is required' })}
            />
            <Input
              label="Email"
              type="email"
              icon={Send}
              error={errors.email?.message}
              required
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            <Input
              label="Phone"
              type="tel"
              icon={Phone}
              error={errors.phone?.message}
              {...register('phone', {
                pattern: { value: /^[+]?[\d\s-]{10,15}$/, message: 'Enter a valid phone number' },
              })}
            />
            <Input
              label="Current location"
              icon={MapPin}
              placeholder="e.g. Bengaluru, Karnataka"
              error={errors.currentLocation?.message}
              {...register('currentLocation')}
            />
          </div>

          {/* ------------------------------ resume ----------------------------- */}
          <Field label="Resume" hint="Sent to the employer as-is.">
            {resumeLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking your resume…
              </div>
            ) : resume ? (
              <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3">
                <FileText className="h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-success-800">{resume.name}</p>
                  <p className="text-xs text-success-700">
                    Uploaded {new Date(resume.uploadedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge tone="success" size="sm">
                  Attached
                </Badge>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3">
                <p className="text-sm text-warning-700">
                  You haven&apos;t uploaded a resume yet.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose()
                    navigate(PATHS.resume)
                  }}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload now
                </Button>
              </div>
            )}
          </Field>
        </div>
      )}

      {/* ------------------------------- step: 2 ------------------------------- */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Years of experience"
              type="number"
              min="0"
              max="50"
              placeholder="e.g. 4"
              error={errors.experience?.message}
              {...register('experience', {
                valueAsNumber: false,
                validate: (value) =>
                  value === '' || (Number(value) >= 0 && Number(value) <= 50) ||
                  'Enter a number between 0 and 50',
              })}
            />

            <Select
              label="Notice period"
              placeholder="Select"
              options={NOTICE_PERIODS}
              error={errors.noticePeriod?.message}
              {...register('noticePeriod')}
            />
          </div>

          <Input
            label="Expected salary (LPA)"
            icon={IndianRupee}
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 18"
            error={errors.expectedSalary?.message}
            {...register('expectedSalary', {
              validate: (value) =>
                value === '' || Number(value) >= 0 || 'Enter a valid amount',
            })}
          />

          <Textarea
            label="Why are you a good fit?"
            hint="A short, specific note works better than a cover letter."
            rows={5}
            placeholder={`In a sentence or two, why are you interested in ${job.title} at ${job.company?.name}?`}
            error={errors.coverLetter?.message}
            {...register('coverLetter', { maxLength: 1000 })}
          />
        </div>
      )}

      {/* ------------------------------- step: 3 ------------------------------- */}
      {step === 2 && (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              Contact
            </h3>
            <dl className="grid gap-3 rounded-lg border border-ink-200 bg-ink-50/60 p-4 text-sm sm:grid-cols-2">
              <ReviewRow label="Name" value={values.fullName} />
              <ReviewRow label="Email" value={values.email} />
              <ReviewRow label="Phone" value={values.phone} />
              <ReviewRow label="Location" value={values.currentLocation} />
            </dl>
          </section>

          <section>
            <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              Role details
            </h3>
            <dl className="grid gap-3 rounded-lg border border-ink-200 bg-ink-50/60 p-4 text-sm sm:grid-cols-2">
              <ReviewRow label="Experience" value={values.experience ? `${values.experience} years` : null} />
              <ReviewRow label="Notice period" value={values.noticePeriod} />
              <ReviewRow
                label="Expected salary"
                value={values.expectedSalary ? formatSalaryRange(values.expectedSalary, values.expectedSalary) : null}
              />
              <ReviewRow label="Resume" value={resume?.name ?? 'None attached'} />
            </dl>
          </section>

          {values.coverLetter && (
            <section>
              <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Your note
              </h3>
              <p className="rounded-lg border border-ink-200 bg-ink-50/60 p-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
                {values.coverLetter}
              </p>
            </section>
          )}

          <p className="rounded-lg border border-info-200 bg-info-50 px-4 py-3 text-xs text-info-700">
            By submitting you confirm the details above are accurate and agree to the hiring
            team contacting you about this application.
          </p>
        </div>
      )}
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */

function ReviewRow({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="truncate font-medium text-ink-800">{value || '—'}</dd>
    </div>
  )
}