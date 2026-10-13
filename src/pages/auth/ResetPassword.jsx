import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertTriangle, Eye, EyeOff, Lock } from 'lucide-react'
import AuthLayout from '@/layouts/AuthLayout'
import * as authService from '@/services/authService'
import { PATHS } from '@/routes/paths'
import { Button, EmptyState, Input } from '@/components/common'

/**
 * Reset-password page (PRD section 23).
 *
 * The token arrives as a query parameter from the emailed link
 * (/reset-password?token=…). Because the mock cannot send mail, the token is
 * surfaced on the forgot-password page instead.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  })

  const password = watch('password')

  async function onSubmit(values) {
    try {
      await authService.resetPassword({ token, password: values.password })
      navigate(PATHS.login, { replace: true })
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title="Reset link missing"
        subtitle="This page is only reachable from the link in your password reset email."
        footer={
          <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <EmptyState
          icon={AlertTriangle}
          title="We could not find a reset token"
          description="Request a fresh reset link and open it from the email — the token is carried in the URL."
          action={
            <Link
              to={PATHS.forgotPassword}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Request a new link
            </Link>
          }
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something you haven't used before."
      footer={
        <>
          <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root?.message && (
          <div
            role="alert"
            className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
          >
            {errors.root.message}
          </div>
        )}

        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded p-1 transition-colors hover:text-ink-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Use at least 8 characters' },
            pattern: {
              value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
              message: 'Include at least one letter and one number',
            },
          })}
        />

        <Input
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword', {
            required: 'Please confirm your new password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Update password
        </Button>

        <p className="text-center text-xs text-ink-500">
          Your session will be signed out after the password changes.
        </p>
      </form>
    </AuthLayout>
  )
}