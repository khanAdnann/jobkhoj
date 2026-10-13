import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyRound, Mail, Save, ShieldCheck, Smartphone } from 'lucide-react'
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

/**
 * Account settings (PRD section 11).
 *
 * Notification switches are intentionally UI-only — there is no preferences
 * endpoint yet, so they persist to localStorage as a demo affordance.
 */
const PREFERENCES_KEY = 'jobkhoj:seeker-preferences'

const DEFAULTS = {
  emailApplications: true,
  emailJobAlerts: true,
  emailSavedJobs: false,
  pushApplications: true,
  pushJobAlerts: false,
  weeklyDigest: true,
  showProfilePublicly: true,
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
    register: registerPassword,
    handleSubmit: submitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  const {
    register: registerProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
  })

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
      toast.success('Account details updated.')
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
      <PageHeader title="Settings" subtitle="Manage your account, security and notifications." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ---------------------- account details ---------------------- */}
          <Card padded={false}>
            <CardHeader title="Account details" />
            <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="s-name" error={profileErrors.name?.message}>
                  <Input id="s-name" {...registerProfile('name', { required: 'Name is required' })} />
                </Field>

                <Field
                  label="Email"
                  htmlFor="s-email"
                  hint="Contact support to change your email."
                  error={profileErrors.email?.message}
                >
                  <Input id="s-email" type="email" readOnly {...registerProfile('email')} />
                </Field>

                <Field label="Phone" htmlFor="s-phone" error={profileErrors.phone?.message}>
                  <Input
                    id="s-phone"
                    type="tel"
                    {...registerProfile('phone', {
                      pattern: {
                        value: /^[+\d][\d\s-]{6,}$/,
                        message: 'Enter a valid phone number',
                      },
                    })}
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

          {/* -------------------------- password -------------------------- */}
          <Card padded={false}>
            <CardHeader
              title="Change password"
              subtitle="Use at least 8 characters with a mix of letters and numbers."
            />
            <form onSubmit={submitPassword(onPasswordSubmit)} className="space-y-4 p-5">
              <Field label="Current password" htmlFor="current-password" required>
                <Input
                  id="current-password"
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
                  htmlFor="new-password"
                  required
                  error={passwordErrors.newPassword?.message}
                >
                  <Input
                    id="new-password"
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
                  htmlFor="confirm-password"
                  required
                  error={passwordErrors.confirmPassword?.message}
                >
                  <Input
                    id="confirm-password"
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
                  {!savingPassword && (
                    <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  )}
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* ---------------------- notifications ------------------------- */}
        <aside className="space-y-6">
          <Card padded={false}>
            <CardHeader title="Notifications" subtitle="Choose what we send you." />

            <div className="space-y-4 p-5">
              <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
                Email
              </p>

              {[
                { key: 'emailApplications', label: 'Application updates', icon: Mail },
                { key: 'emailJobAlerts', label: 'New job alert matches', icon: Mail },
                { key: 'emailSavedJobs', label: 'Weekly digest of saved jobs', icon: Mail },
              ].map((item) => (
                <Switch
                  key={item.key}
                  checked={preferences[item.key]}
                  onChange={(value) => setPref(item.key, value)}
                  label={item.label}
                />
              ))}

              <p className="pt-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                Push
              </p>

              {[
                { key: 'pushApplications', label: 'Application updates' },
                { key: 'pushJobAlerts', label: 'New job alert matches' },
              ].map((item) => (
                <Switch
                  key={item.key}
                  checked={preferences[item.key]}
                  onChange={(value) => setPref(item.key, value)}
                  label={item.label}
                />
              ))}

              <p className="text-xs text-ink-400">
                Push notifications require the mobile app — saved locally in this demo.
              </p>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Privacy" />
            <div className="space-y-4 p-5">
              <Switch
                checked={preferences.showProfilePublicly}
                onChange={(value) => setPref('showProfilePublicly', value)}
                label="Public profile"
                description="Let recruiters view your profile without an invitation."
              />

              <div className="flex items-start gap-2.5 rounded-lg bg-success-50 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                <p className="text-xs text-ink-600">
                  Your email is never shown to other candidates. Recruiters only see your
                  application and resume.
                </p>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Signed in as" />
            <div className="space-y-2 p-5 text-sm">
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
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}