import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Field from '@/components/common/Field'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Select from '@/components/common/Select'
import TagInput from '@/components/common/TagInput'
import Checkbox from '@/components/common/Checkbox'
import Skeleton from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import * as jobService from '@/services/jobService'
import {
  DEPARTMENTS,
  JOB_STATUS,
  JOB_TYPES,
  SKILLS,
  WORK_MODES,
} from '@/utils/constants'
import { PATHS } from '@/routes/paths'
import { normalizeExternalApplicationUrl } from '@/utils/jobSeo'

/**
 * Create / edit job form (PRD section 16).
 *
 * One component serves both routes: `/recruiter/jobs/create` and
 * `/recruiter/jobs/:id/edit`. In edit mode the existing job is loaded and used
 * as the form defaults; `submitAsDraft` decides between Draft and Active.
 */
export default function JobForm({ mode = 'create' }) {
  const isEdit = mode === 'edit'

  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()

  const existing = useFetch(
    () => (isEdit ? jobService.getJob(id) : Promise.resolve(null)),
    [id, isEdit],
    { immediate: isEdit },
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      companyName: user?.companyName ?? '',
      companyAuthorized: false,
      title: '',
      department: DEPARTMENTS[0],
      location: '',
      workMode: WORK_MODES[0],
      employmentType: JOB_TYPES[0],
      experienceMin: 0,
      experienceMax: 3,
      salaryMin: '',
      salaryMax: '',
      openings: 1,
      skills: [],
      preferredSkills: [],
      education: '',
      description: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      deadline: '',
      applicationUrl: '',
    },
  })

  /* ---------------------- load existing job into the form ------------------ */

  useEffect(() => {
    const job = existing.data
    if (!job) return

    reset({
      companyName: job.companyName ?? '',
      companyAuthorized: job.companyAuthorized ?? false,
      title: job.title ?? '',
      department: job.department ?? DEPARTMENTS[0],
      location: job.location ?? '',
      workMode: job.workMode ?? WORK_MODES[0],
      employmentType: job.employmentType ?? JOB_TYPES[0],
      experienceMin: job.experienceMin ?? 0,
      experienceMax: job.experienceMax ?? 3,
      salaryMin: job.salaryMin ?? '',
      salaryMax: job.salaryMax ?? '',
      openings: job.openings ?? 1,
      skills: job.skills ?? [],
      preferredSkills: job.preferredSkills ?? [],
      education: job.education ?? '',
      description: job.description ?? '',
      responsibilities: job.responsibilities ?? [],
      requirements: job.requirements ?? [],
      benefits: job.benefits ?? [],
      deadline: job.deadline?.slice(0, 10) ?? '',
      applicationUrl: job.applicationUrl ?? '',
    })
  }, [existing.data, reset])

  /* ------------------------------- derived -------------------------------- */

  const salaryMin = Number(watch('salaryMin'))
  const salaryMax = Number(watch('salaryMax'))
  const experienceMin = Number(watch('experienceMin'))
  const experienceMax = Number(watch('experienceMax'))

  const salaryError =
    Number.isFinite(salaryMin) &&
    Number.isFinite(salaryMax) &&
    salaryMin > salaryMax
      ? 'Minimum salary must be lower than the maximum'
      : null

  const experienceError =
    Number.isFinite(experienceMin) &&
    Number.isFinite(experienceMax) &&
    experienceMin > experienceMax
      ? 'Minimum experience must be lower than the maximum'
      : null

  /* -------------------------------- submit ------------------------------- */

  async function submit(values, status) {
    if (status === JOB_STATUS.ACTIVE && !values.companyAuthorized) {
      toast.error('Confirm you are authorized to recruit for this company before publishing.')
      return
    }

    const payload = {
      ...values,
      companyName: values.companyName.trim(),
      salaryMin: values.salaryMin === '' ? null : Number(values.salaryMin),
      salaryMax: values.salaryMax === '' ? null : Number(values.salaryMax),
      experienceMin: Number(values.experienceMin),
      experienceMax: Number(values.experienceMax),
      experienceLabel: `${Number(values.experienceMin)}-${Number(values.experienceMax)} Years`,
      openings: Number(values.openings),
      deadline: values.deadline || null,
      applicationUrl: normalizeExternalApplicationUrl(values.applicationUrl),
      status,
    }

    try {
      if (isEdit) {
        // Only an explicit draft/publish action may change status. Preserve
        // moderated or closed statuses when an existing job is edited.
        const originalStatus = existing.data?.status
        if (originalStatus !== JOB_STATUS.DRAFT && status !== JOB_STATUS.DRAFT) {
          payload.status = originalStatus
        }
        const updated = await jobService.updateJob(id, payload)
        toast.success('Job updated.')
        navigate(PATHS.recruiter.jobDetails(updated.id ?? id))
      } else {
        payload.companyId = user?.companyId
        payload.createdBy = user?.id
        const created = await jobService.createJob(payload)
        toast.success(
          status === JOB_STATUS.DRAFT
            ? 'Saved as a draft.'
            : 'Job posted and live on JobKhoj.',
        )
        navigate(PATHS.recruiter.jobDetails(created.id))
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ------------------------------- states -------------------------------- */

  if (isEdit && existing.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (isEdit && existing.error) {
    return (
      <Card>
        <EmptyState
          icon="file"
          title="Could not load this job"
          description={existing.error.message}
          action={
            <Button variant="secondary" onClick={existing.refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  /* -------------------------------- render ------------------------------- */

  return (
    <form onSubmit={handleSubmit((values) => submit(values, JOB_STATUS.ACTIVE))}>
      <PageHeader
        title={isEdit ? 'Edit job' : 'Post a new job'}
        subtitle={
          isEdit
            ? 'Changes go live immediately unless the job is closed.'
            : 'Fill in the details below. You can save a draft and publish later.'
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              loading={isSubmitting}
              onClick={handleSubmit((values) => submit(values, JOB_STATUS.DRAFT))}
            >
              Save draft
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {!isSubmitting && <Send className="h-4 w-4" aria-hidden="true" />}
              {isEdit ? 'Save changes' : 'Publish job'}
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {/* ---------------------------- basics --------------------------- */}
        <Card padded={false}>
          <CardHeader title="Role basics" subtitle="What the job is and where." />

          <div className="space-y-4 p-5">
            <Field
              label="Company hiring for"
              htmlFor="companyName"
              required
              error={errors.companyName?.message}
              hint="This name appears on the public job listing. Custom company names are not independently verified by JobKhoj."
            >
              <Input
                id="companyName"
                placeholder="Company name"
                maxLength={120}
                {...register('companyName', {
                  required: 'Company name is required',
                  maxLength: { value: 120, message: 'Company name must be 120 characters or fewer' },
                  validate: (value) => Boolean(value?.trim()) || 'Company name is required',
                })}
              />
            </Field>

            <Field label="Job title" htmlFor="title" required error={errors.title?.message}>
              <Input
                id="title"
                placeholder="Senior React Developer"
                maxLength={80}
                {...register('title', { required: 'Job title is required' })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Department" htmlFor="department" required>
                <Select
                  id="department"
                  options={DEPARTMENTS.map((value) => ({ value, label: value }))}
                  {...register('department', { required: true })}
                />
              </Field>

              <Field label="Location" htmlFor="location" required error={errors.location?.message}>
                <Input
                  id="location"
                  placeholder="Bengaluru, Karnataka"
                  {...register('location', { required: 'Location is required' })}
                />
              </Field>

              <Field label="Work mode" htmlFor="workMode" required>
                <Select
                  id="workMode"
                  options={WORK_MODES.map((value) => ({ value, label: value }))}
                  {...register('workMode', { required: true })}
                />
              </Field>

              <Field label="Employment type" htmlFor="employmentType" required>
                <Select
                  id="employmentType"
                  options={JOB_TYPES.map((value) => ({ value, label: value }))}
                  {...register('employmentType', { required: true })}
                />
              </Field>

              <Field label="Openings" htmlFor="openings" error={errors.openings?.message}>
                <Input
                  id="openings"
                  type="number"
                  min="1"
                  max="99"
                  {...register('openings', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'At least 1 opening' },
                  })}
                />
              </Field>

              <Field label="Apply before" htmlFor="deadline">
                <Input id="deadline" type="date" {...register('deadline')} />
              </Field>
            </div>

            <Field
              label="External application link"
              htmlFor="applicationUrl"
              error={errors.applicationUrl?.message}
              hint="Optional. Candidates will be sent to this company or LinkedIn job posting when they click Apply. Use an http:// or https:// URL."
            >
              <Input
                id="applicationUrl"
                type="url"
                placeholder="https://www.linkedin.com/jobs/view/..."
                maxLength={2048}
                {...register('applicationUrl', {
                  validate: (value) =>
                    !String(value ?? '').trim() ||
                    Boolean(normalizeExternalApplicationUrl(value)) ||
                    'Enter a valid company or LinkedIn job URL beginning with http:// or https://',
                })}
              />
            </Field>
          </div>
        </Card>

        {/* --------------------- experience & salary ---------------------- */}
        <Card padded={false}>
          <CardHeader title="Experience & salary" subtitle="Shown on the public job page." />

          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Min experience"
                htmlFor="experienceMin"
                error={errors.experienceMin?.message}
              >
                <Input
                  id="experienceMin"
                  type="number"
                  min="0"
                  max="30"
                  {...register('experienceMin', { valueAsNumber: true })}
                />
              </Field>

              <Field
                label="Max experience"
                htmlFor="experienceMax"
                error={errors.experienceMax?.message ?? experienceError}
              >
                <Input
                  id="experienceMax"
                  type="number"
                  min="0"
                  max="30"
                  {...register('experienceMax', { valueAsNumber: true })}
                />
              </Field>

              <Field
                label="Salary from (LPA)"
                htmlFor="salaryMin"
                error={errors.salaryMin?.message ?? salaryError}
                hint="Leave blank to hide."
              >
                <Input
                  id="salaryMin"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="8"
                  {...register('salaryMin')}
                />
              </Field>

              <Field
                label="Salary to (LPA)"
                htmlFor="salaryMax"
                error={errors.salaryMax?.message}
              >
                <Input
                  id="salaryMax"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="14"
                  {...register('salaryMax')}
                />
              </Field>
            </div>

            {experienceError && (
              <p className="text-xs text-danger-600">{experienceError}</p>
            )}
          </div>
        </Card>

        {/* ---------------------------- skills --------------------------- */}
        <Card padded={false}>
          <CardHeader title="Skills & requirements" />

          <div className="space-y-4 p-5">
            <Field
              label="Required skills"
              htmlFor="skills"
              required
              error={errors.skills?.message}
              hint="These power job matching, so be specific."
            >
              <TagInput
                id="skills"
                max={15}
                value={watch('skills') ?? []}
                onChange={(skills) => setValue('skills', skills, { shouldValidate: true })}
                suggestions={SKILLS}
                placeholder="React, TypeScript…"
              />
            </Field>

            <Field
              label="Preferred skills"
              htmlFor="preferredSkills"
              hint="Nice to have — shown separately to candidates."
            >
              <TagInput
                id="preferredSkills"
                max={10}
                value={watch('preferredSkills') ?? []}
                onChange={(preferredSkills) => setValue('preferredSkills', preferredSkills)}
                suggestions={SKILLS}
                placeholder="Next.js, GraphQL…"
              />
            </Field>

            <Field label="Minimum education" htmlFor="education">
              <Input
                id="education"
                placeholder="Bachelor's degree in Computer Science or equivalent"
                {...register('education')}
              />
            </Field>

            <Field label="Responsibilities" htmlFor="responsibilities">
              <TagInput
                id="responsibilities"
                max={10}
                value={watch('responsibilities') ?? []}
                onChange={(responsibilities) => setValue('responsibilities', responsibilities)}
                placeholder="Own the frontend architecture…"
              />
            </Field>

            <Field label="Requirements" htmlFor="requirements">
              <TagInput
                id="requirements"
                max={10}
                value={watch('requirements') ?? []}
                onChange={(requirements) => setValue('requirements', requirements)}
                placeholder="5+ years with React…"
              />
            </Field>

            <Field label="Benefits" htmlFor="benefits">
              <TagInput
                id="benefits"
                max={10}
                value={watch('benefits') ?? []}
                onChange={(benefits) => setValue('benefits', benefits)}
                placeholder="Health insurance, Remote stipend…"
              />
            </Field>
          </div>
        </Card>

        {/* ------------------------- description ------------------------- */}
        <Card padded={false}>
          <CardHeader title="Job description" subtitle="The main body candidates will read." />

          <div className="space-y-4 p-5">
            <Field
              label="About the role"
              htmlFor="description"
              required
              error={errors.description?.message}
              hint="Markdown-ish plain text. Keep it under 3,000 characters."
            >
              <Textarea
                id="description"
                rows={12}
                maxLength={3000}
                placeholder="We are looking for a Senior React Developer to lead our design-system work…"
                {...register('description', {
                  required: 'A description is required',
                  maxLength: { value: 3000, message: 'Keep it under 3,000 characters' },
                })}
              />
            </Field>
          </div>
        </Card>

        {/* --------------------------- publish --------------------------- */}
        <div className="flex flex-col-reverse gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Checkbox
              label="I am authorized to recruit for this company and confirm this listing is accurate."
              description="JobKhoj does not independently verify custom company names."
              {...register('companyAuthorized')}
            />
            <p className="text-xs text-ink-500">
              {isEdit
                ? 'Saving updates the public job page immediately.'
                : 'Publishing makes the job visible to candidates right away.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(PATHS.recruiter.jobs)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={isSubmitting}
              onClick={handleSubmit((values) => submit(values, JOB_STATUS.DRAFT))}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save draft
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {isEdit ? 'Save changes' : 'Publish job'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}