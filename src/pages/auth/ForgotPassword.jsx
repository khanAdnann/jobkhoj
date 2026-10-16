import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Mail } from 'lucide-react'
import AuthLayout from '@/layouts/AuthLayout'
import * as authService from '@/services/authService'
import { supabaseEnabled } from '@/services/supabaseClient'
import { PATHS } from '@/routes/paths'
import { Button, Input } from '@/components/common'

/**
 * Forgot-password page (PRD section 23).
 *
 * The confirmation is intentionally identical whether or not the address is
 * registered — telling an anonymous visitor which emails exist would leak
 * account information.
 */
export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [resetToken, setResetToken] = useState(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  async function onSubmit(values) {
    const result = await authService.forgotPassword({ email: values.email })
    // Mock-only: the real backend emails the link instead of returning it.
    setResetToken(result?.resetToken ?? null)
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="If an account exists for that address, a reset link is on its way."
        footer={
          <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="rounded-lg border border-success-200 bg-success-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-success-700">
            Reset link sent to
          </p>
          <p className="mt-1 font-semibold break-all text-ink-900">{getValues('email')}</p>
        </div>

        {!supabaseEnabled && <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50/60 p-4">
          <p className="text-xs font-semibold tracking-wide text-brand-800 uppercase">
            Demo mode
          </p>
          <p className="mt-1 text-xs text-brand-700">
            No email is actually sent. The reset link below works immediately.
          </p>

          <Link
            to={
              resetToken
                ? `${PATHS.resetPassword}?token=${encodeURIComponent(resetToken)}`
                : PATHS.resetPassword
            }
            className="mt-2.5 inline-block text-xs font-medium text-brand-700 underline"
          >
            {resetToken ? 'Open your reset link' : 'Go to reset password'}
          </Link>

          {resetToken && (
            <p className="mt-2 text-[11px] break-all text-brand-600/80">
              token: {resetToken.slice(0, 42)}…
            </p>
          )}
        </div>}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <>
          Remembered it?{' '}
          <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          required
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address',
            },
          })}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}