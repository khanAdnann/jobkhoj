import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Bell, KeyRound, Mail, Save, Smartphone, User } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Field from '@/components/common/Field'
import Input from '@/components/common/Input'
import Switch from '@/components/common/Switch'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import * as userService from '@/services/userService'
import * as authService from '@/services/authService'

/** Notification preferences are demo-only and persist to localStorage. */
const PREFERENCES_KEY = 'jobkhoj:recruiter-preferences'

const DEFAULTS = {
  emailNewApplicant: true,
  emailShortlisted: true,
  emailJobApproved: true,
  weeklySummary: true,
  candidateMessages: true,
}

function readPreferences() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

export default function Settings() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [preferences, setPreferences] = useState(readPreferences)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      headline: user?.headline ?? '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: submitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  function setPref(key, value) {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next))
  }

  async function onProfileSubmit(values) {
    setSavingProfile(true)
    try {
      const updated = await userService.updateProfile(values)
      updateUser(updated)
      toast.success('Your details were updated.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function onPasswordSubmit(values) {
    setSavingPassword(true)
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      resetPassword()
      toast.success('Password changed successfully.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Recruiter settings" subtitle="Manage your account and hiring alerts." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card padded={false}>
            <CardHeader title="Your details" />
            <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="r-name" error={profileErrors.name?.message}>
                  <Input id="r-name" {...registerProfile('name', { required: 'Name is required' })} />
                </Field>

                <Field label="Email" htmlFor="r-email" hint="Contact support to change this.">
                  <Input id="r-email" type="email" value={user?.email ?? ''} readOnly />
                </Field>

                <Field label="Phone" htmlFor="r-phone" error={profileErrors.phone?.message}>
                  <Input
                    id="r-phone"
                    type="tel"
                    {...registerProfile('phone', {
                      pattern: {
                        value: /^[+\d][\d\s-]{6,}$/,
                        message: 'Enter a valid phone number',
                      },
                    })}
                  />
                </Field>

                <Field label="Job title" htmlFor="r-headline" error={profileErrors.headline?.message}>
                  <Input
                    id="r-headline"
                    placeholder="Senior Talent Acquisition Lead"
                    {...registerProfile('headline')}
                  />
                </Field>
              </div>

              <div className="flex justify-end border-t border-ink-100 pt-4">
                <Button type="submit" variant="primary" loading={savingProfile}>
                  {!savingProfile && <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                  Save details
                </Button>
              </div>
            </form>
          </Card>

          <Card padded={false}>
            <CardHeader title="Change password" subtitle="At least 8 characters with a letter and a number." />
            <form onSubmit={submitPassword(onPasswordSubmit)} className="space-y-4 p-5">
              <Field label="Current password" htmlFor="r-current" required>
                <Input
                  id="r-current"
                  type="password"
                  autoComplete="current-password"
                  {...registerPassword('currentPassword', {
                    required: 'Enter your current password',
                  })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="New password"
                  htmlFor="r-new"
                  required
                  error={passwordErrors.newPassword?.message}
                >
                  <Input
                    id="r-new"
                    type="password"
                    autoComplete="new-password"
                    {...registerPassword('newPassword', {
                      required: 'Enter a new password',
                      minLength: { value: 8, message: 'Use at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                        message: 'Include at least one letter and one number',
                      },
                    })}
                  />
                </Field>

                <Field
                  label="Confirm new password"
                  htmlFor="r-confirm"
                  required
                  error={passwordErrors.confirmPassword?.message}
                >
                  <Input
                    id="r-confirm"
                    type="password"
                    autoComplete="new-password"
                    {...registerPassword('confirmPassword', {
                      required: 'Re-enter your new password',
                      validate: (value) =>
                        value === watchPassword('newPassword') || 'Passwords do not match',
                    })}
                  />
                </Field>
              </div>

              <div className="flex justify-end border-t border-ink-100 pt-4">
                <Button type="submit" variant="primary" loading={savingPassword}>
                  {!savingPassword && <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card padded={false}>
            <CardHeader title="Hiring notifications" subtitle="What we alert you about." />
            <div className="space-y-4 p-5">
              {[
                { key: 'emailNewApplicant', label: 'New applicant' },
                { key: 'emailShortlisted', label: 'Status change on a candidate' },
                { key: 'emailJobApproved', label: 'Job approved or rejected' },
                { key: 'candidateMessages', label: 'Messages from candidates' },
              ].map((item) => (
                <Switch
                  key={item.key}
                  checked={preferences[item.key]}
                  onChange={(value) => setPref(item.key, value)}
                  label={item.label}
                />
              ))}

              <Switch
                checked={preferences.weeklySummary}
                onChange={(value) => setPref('weeklySummary', value)}
                label="Weekly hiring summary"
                description="Applications, views and pipeline health, every Monday."
              />

              <p className="text-xs text-ink-400">
                Saved locally — this demo has no notification service.
              </p>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Signed in as" />
            <div className="space-y-2 p-5 text-sm">
              <p className="flex items-center gap-2 text-ink-700">
                <User className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {user?.name}
              </p>
              <p className="flex items-center gap-2 text-ink-700">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {user?.email}
              </p>
              {user?.phone && (
                <p className="flex items-center gap-2 text-ink-700">
                  <Smartphone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                  {user.phone}
                </p>
              )}
              <p className="flex items-center gap-2 text-ink-700">
                <Bell className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Recruiter
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}