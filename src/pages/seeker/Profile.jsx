import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Field from '@/components/common/Field'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Select from '@/components/common/Select'
import TagInput from '@/components/common/TagInput'
import Avatar from '@/components/common/Avatar'
import ProfileCompleteness from '@/components/seeker/ProfileCompleteness'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import * as userService from '@/services/userService'
import { SKILLS, EXPERIENCE_LEVELS } from '@/utils/constants'
import { initials } from '@/utils/format'

/**
 * Seeker profile editor (PRD section 11).
 *
 * Experience and education are repeatable blocks; each keeps a local temp id so
 * react-hook-form can track newly added rows before the server assigns one.
 */
const EMPTY_EXPERIENCE = {
  tempId: 'new',
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

const EMPTY_EDUCATION = {
  tempId: 'new',
  institution: '',
  degree: '',
  field: '',
  startYear: '',
  endYear: '',
  grade: '',
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingExperience, setSavingExperience] = useState(false)
  const [savingEducation, setSavingEducation] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      headline: user?.headline ?? '',
      phone: user?.phone ?? '',
      location: user?.location ?? '',
      bio: user?.bio ?? '',
      skills: user?.skills ?? [],
    },
  })

  const [experience, setExperience] = useState(user?.experience ?? [])
  const [education, setEducation] = useState(user?.education ?? [])

  /* ------------------------------ profile ------------------------------ */

  async function onProfileSubmit(values) {
    setSavingProfile(true)
    try {
      const updated = await userService.updateProfile(values)
      updateUser(updated)
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  /* ----------------------------- experience ---------------------------- */

  async function saveExperience() {
    const cleaned = experience
      .map(({ tempId: _tempId, ...row }) => row)
      .filter((row) => row.company?.trim() && row.title?.trim())

    if (!cleaned.length) {
      toast.error('Add at least one role with a company and title.')
      return
    }

    setSavingExperience(true)
    try {
      const updated = await userService.updateProfile({ experience: cleaned })
      updateUser(updated)
      setExperience(updated.experience ?? cleaned)
      toast.success('Experience saved.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingExperience(false)
    }
  }

  async function removeExperience(tempId) {
    const cleaned = experience
      .filter((row) => row.tempId !== tempId)
      .map(({ tempId: _drop, ...row }) => row)

    try {
      const updated = await userService.updateProfile({ experience: cleaned })
      updateUser(updated)
      setExperience(updated.experience ?? [])
      toast.success('Experience updated.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ----------------------------- education ----------------------------- */

  async function saveEducation() {
    const cleaned = education
      .map(({ tempId: _tempId, ...row }) => row)
      .filter((row) => row.institution?.trim())

    if (!cleaned.length) {
      toast.error('Add at least one education entry.')
      return
    }

    setSavingEducation(true)
    try {
      const updated = await userService.updateProfile({ education: cleaned })
      updateUser(updated)
      setEducation(updated.education ?? cleaned)
      toast.success('Education saved.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingEducation(false)
    }
  }

  async function removeEducation(tempId) {
    const cleaned = education
      .filter((row) => row.tempId !== tempId)
      .map(({ tempId: _drop, ...row }) => row)

    try {
      const updated = await userService.updateProfile({ education: cleaned })
      updateUser(updated)
      setEducation(updated.education ?? [])
      toast.success('Education updated.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ------------------------------ helpers ------------------------------ */

  function updateExperienceRow(tempId, key, value) {
    setExperience((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [key]: value } : row)),
    )
  }

  function updateEducationRow(tempId, key, value) {
    setEducation((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [key]: value } : row)),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        subtitle="Keep this accurate — recruiters see it before they review your application."
      />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* ------------------------------ main ---------------------------- */}
        <div className="space-y-6 lg:col-span-3">
          {/* basics */}
          <Card padded={false}>
            <CardHeader title="Personal details" />
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
                  <Input
                    id="name"
                    {...register('name', { required: 'Your name is required' })}
                  />
                </Field>

                <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register('phone', {
                      pattern: { value: /^[+\d][\d\s-]{6,}$/, message: 'Enter a valid phone number' },
                    })}
                  />
                </Field>

                <Field label="Location" htmlFor="location" error={errors.location?.message}>
                  <Input
                    id="location"
                    placeholder="Bengaluru, Karnataka"
                    {...register('location', { required: 'Location is required' })}
                  />
                </Field>

                <Field label="Experience level" htmlFor="experienceLevel">
                  <Select
                    id="experienceLevel"
                    value={watch('experienceLevel') ?? user?.experienceLevel ?? 'Mid (3-5 yrs)'}
                    onChange={(event) =>
                      updateUser({ experienceLevel: event.target.value })
                    }
                    options={[
                      { value: 'Fresher', label: 'Fresher (0-1 yrs)' },
                      ...EXPERIENCE_LEVELS.map((level) => ({ value: level, label: level })),
                    ]}
                  />
                </Field>
              </div>

              <Field
                label="Professional headline"
                htmlFor="headline"
                hint="One line, e.g. “Backend Engineer · Java & Spring Boot · 5 yrs”."
                error={errors.headline?.message}
              >
                <Input
                  id="headline"
                  maxLength={90}
                  {...register('headline', {
                    required: 'Add a headline so recruiters know your focus',
                    maxLength: { value: 90, message: 'Keep it under 90 characters' },
                  })}
                />
              </Field>

              <Field
                label="About you"
                htmlFor="bio"
                hint="Up to 600 characters."
                error={errors.bio?.message}
              >
                <Textarea
                  id="bio"
                  rows={5}
                  maxLength={600}
                  {...register('bio', {
                    maxLength: { value: 600, message: 'Keep it under 600 characters' },
                  })}
                />
              </Field>

              <Field
                label="Skills"
                htmlFor="skills"
                hint="Add at least 3 — they power job matching."
                error={errors.skills?.message}
              >
                <TagInput
                  id="skills"
                  max={20}
                  value={watch('skills') ?? []}
                  onChange={(skills) => reset({ ...watch(), skills })}
                  suggestions={SKILLS}
                  placeholder="React, Java, SQL…"
                />
              </Field>

              <div className="flex justify-end border-t border-ink-100 pt-4">
                <Button type="submit" variant="primary" loading={savingProfile}>
                  {!savingProfile && <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {/* experience */}
          <Card padded={false}>
            <CardHeader
              title="Work experience"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExperience((prev) => [...prev, { ...EMPTY_EXPERIENCE }])}
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Add role
                </Button>
              }
            />

            <div className="space-y-4 p-5">
              {experience.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-500">
                  No roles added yet — most recruiters look for at least one.
                </p>
              )}

              {experience.map((row) => (
                <div key={row.tempId ?? `${row.company}-${row.title}`} className="rounded-lg border border-ink-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-700">
                      {row.title || 'New role'}
                    </p>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remove role"
                      onClick={() => removeExperience(row.tempId)}
                      className="text-ink-400 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Job title" htmlFor={`title-${row.tempId}`}>
                      <Input
                        id={`title-${row.tempId}`}
                        value={row.title ?? ''}
                        onChange={(e) => updateExperienceRow(row.tempId, 'title', e.target.value)}
                        placeholder="Backend Engineer"
                      />
                    </Field>

                    <Field label="Company" htmlFor={`company-${row.tempId}`}>
                      <Input
                        id={`company-${row.tempId}`}
                        value={row.company ?? ''}
                        onChange={(e) => updateExperienceRow(row.tempId, 'company', e.target.value)}
                        placeholder="Infosys"
                      />
                    </Field>

                    <Field label="Location" htmlFor={`loc-${row.tempId}`}>
                      <Input
                        id={`loc-${row.tempId}`}
                        value={row.location ?? ''}
                        onChange={(e) => updateExperienceRow(row.tempId, 'location', e.target.value)}
                        placeholder="Bengaluru"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="From" htmlFor={`start-${row.tempId}`}>
                        <Input
                          id={`start-${row.tempId}`}
                          type="month"
                          value={row.startDate ?? ''}
                          onChange={(e) => updateExperienceRow(row.tempId, 'startDate', e.target.value)}
                        />
                      </Field>

                      <Field label="To" htmlFor={`end-${row.tempId}`}>
                        <Input
                          id={`end-${row.tempId}`}
                          type="month"
                          disabled={row.current}
                          value={row.endDate ?? ''}
                          onChange={(e) => updateExperienceRow(row.tempId, 'endDate', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
                    <input
                      type="checkbox"
                      checked={Boolean(row.current)}
                      onChange={(e) => updateExperienceRow(row.tempId, 'current', e.target.checked)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600"
                    />
                    I currently work here
                  </label>

                  <Field label="What did you do?" htmlFor={`desc-${row.tempId}`} className="mt-3">
                    <Textarea
                      id={`desc-${row.tempId}`}
                      rows={3}
                      value={row.description ?? ''}
                      onChange={(e) =>
                        updateExperienceRow(row.tempId, 'description', e.target.value)
                      }
                      placeholder="Owned the billing service and cut month-end close time by 40%."
                    />
                  </Field>
                </div>
              ))}

              {experience.length > 0 && (
                <div className="flex justify-end">
                  <Button variant="primary" loading={savingExperience} onClick={saveExperience}>
                    {!savingExperience && (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    Save experience
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* education */}
          <Card padded={false}>
            <CardHeader
              title="Education"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEducation((prev) => [...prev, { ...EMPTY_EDUCATION }])}
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Add education
                </Button>
              }
            />

            <div className="space-y-4 p-5">
              {education.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-500">
                  Add your degree so recruiters can filter by qualification.
                </p>
              )}

              {education.map((row) => (
                <div key={row.tempId ?? `${row.institution}-${row.degree}`} className="rounded-lg border border-ink-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-700">
                      {row.degree || 'New education'}
                    </p>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remove education"
                      onClick={() => removeEducation(row.tempId)}
                      className="text-ink-400 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Institution" htmlFor={`inst-${row.tempId}`}>
                      <Input
                        id={`inst-${row.tempId}`}
                        value={row.institution ?? ''}
                        onChange={(e) => updateEducationRow(row.tempId, 'institution', e.target.value)}
                        placeholder="Anna University"
                      />
                    </Field>

                    <Field label="Degree" htmlFor={`deg-${row.tempId}`}>
                      <Input
                        id={`deg-${row.tempId}`}
                        value={row.degree ?? ''}
                        onChange={(e) => updateEducationRow(row.tempId, 'degree', e.target.value)}
                        placeholder="B.Tech"
                      />
                    </Field>

                    <Field label="Field of study" htmlFor={`field-${row.tempId}`}>
                      <Input
                        id={`field-${row.tempId}`}
                        value={row.field ?? ''}
                        onChange={(e) => updateEducationRow(row.tempId, 'field', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start year" htmlFor={`sy-${row.tempId}`}>
                        <Input
                          id={`sy-${row.tempId}`}
                          type="number"
                          min="1980"
                          max="2030"
                          value={row.startYear ?? ''}
                          onChange={(e) => updateEducationRow(row.tempId, 'startYear', e.target.value)}
                          placeholder="2018"
                        />
                      </Field>

                      <Field label="End year" htmlFor={`ey-${row.tempId}`}>
                        <Input
                          id={`ey-${row.tempId}`}
                          type="number"
                          min="1980"
                          max="2030"
                          value={row.endYear ?? ''}
                          onChange={(e) => updateEducationRow(row.tempId, 'endYear', e.target.value)}
                          placeholder="2022"
                        />
                      </Field>
                    </div>

                    <Field label="Grade / CGPA" htmlFor={`grade-${row.tempId}`}>
                      <Input
                        id={`grade-${row.tempId}`}
                        value={row.grade ?? ''}
                        onChange={(e) => updateEducationRow(row.tempId, 'grade', e.target.value)}
                        placeholder="8.6 CGPA"
                      />
                    </Field>
                  </div>
                </div>
              ))}

              {education.length > 0 && (
                <div className="flex justify-end">
                  <Button variant="primary" loading={savingEducation} onClick={saveEducation}>
                    {!savingEducation && (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    Save education
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ------------------------------ side ----------------------------- */}
        <aside className="space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <Avatar name={user?.name} size="xl" src={user?.avatarUrl} />
              <h2 className="mt-3 text-base font-semibold text-ink-900">
                {user?.name || 'Your name'}
              </h2>
              <p className="mt-0.5 text-sm text-ink-500">{user?.headline || 'Add a headline'}</p>
              <p className="mt-1 text-xs text-ink-400">{user?.email}</p>
              <p className="mt-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                {initials(user?.name)} · Job Seeker
              </p>
            </div>
          </Card>

          <Card>
            <ProfileCompleteness user={{ ...user, skills: watch('skills') ?? user?.skills, experience, education }} />
          </Card>
        </aside>
      </div>
    </div>
  )
}