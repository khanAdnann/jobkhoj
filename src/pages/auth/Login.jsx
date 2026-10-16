import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react'
import AuthLayout from '@/layouts/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { DEMO_ACCOUNTS, supabaseEnabled } from '@/services/authService'
import { PATHS } from '@/routes/paths'
import { HOME_BY_ROLE } from '@/utils/constants'
import { Button, Input, Checkbox } from '@/components/common'

/**
 * Sign-in page (PRD section 23).
 *
 * On success the user is routed to the dashboard for their role
 * (JOB_SEEKER -> /dashboard, RECRUITER -> /recruiter/dashboard,
 * ADMIN -> /admin), unless ProtectedRoute had stashed an intended destination
 * in router state.
 */
export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '', password: '', remember: true },
  })

  const intendedRoute = location.state?.from

  async function submitAndRedirect(values) {
    try {
      const user = await login({ email: values.email, password: values.password })

      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)

      const destination = intendedRoute ?? HOME_BY_ROLE[user.role] ?? PATHS.home
      navigate(destination, { replace: true })
    } catch (error) {
      setError('root', { message: error.message })
      toast.error(error.message || 'Could not sign in. Please try again.')
    }
  }

  /** Fills the form with a seeded demo account. */
  function fillDemoAccount(email) {
    setValue('email', email, { shouldValidate: true })
    setValue('password', 'demo1234', { shouldValidate: true })
    toast.info('Demo credentials filled in — press Sign in to continue.')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your JobKhoj account to continue."
      footer={
        <>
          Don't have an account?{' '}
          <Link to={PATHS.register} className="font-semibold text-brand-600 hover:underline">
            Create one now
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(submitAndRedirect)} noValidate className="space-y-5">
        {errors.root?.message && (
          <div
            role="alert"
            className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
          >
            {errors.root.message}
          </div>
        )}

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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Enter your password"
            autoComplete="current-password"
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
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />

          <div className="mt-2.5 flex items-center justify-between">
            <Checkbox label="Remember me" {...register('remember')} />
            <Link
              to={PATHS.forgotPassword}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in
        </Button>

        {!supabaseEnabled && (
          <>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-ink-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium text-ink-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google sign-in is intentionally a placeholder (PRD section 2). */}
            <button
              type="button"
              onClick={() =>
                toast.info(
                  'Google sign-in will be available once the backend OAuth flow is connected.',
                )
              }
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-ink-300 bg-white text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
            >
              <GoogleMark />
              <span>Continue with Google</span>
              <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                Soon
              </span>
            </button>
          </>
        )}

        {!supabaseEnabled && (
          <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-4">
            <p className="text-xs font-semibold tracking-wide text-brand-800 uppercase">
              Demo accounts
            </p>
            <p className="mt-1 text-xs text-brand-700">
              The mock backend accepts any password for these seeded accounts.
            </p>

            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(account.email)}
                  className="flex items-center justify-between gap-2 rounded-md border border-brand-200 bg-white px-3 py-2 text-left transition-colors hover:border-brand-400"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-ink-900">
                      {account.label}
                    </span>
                    <span className="block truncate text-xs text-ink-500">{account.email}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-brand-600">Use</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </AuthLayout>
  )
}

/** Inline Google "G" mark — avoids another network request for an icon. */
function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2.01 3.44-4.97 3.44-8.56Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.72-2.9c-1.03.69-2.35 1.1-4.22 1.1-3.25 0-6-2.19-6.98-5.14H1.18v3.04A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.02 14.05a7.2 7.2 0 0 1 0-4.1V6.91H1.18a12 12 0 0 0 0 10.18l3.84-3.04Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.18 6.91l3.84 3.04C6 6.96 8.75 4.77 12 4.77Z"
      />
    </svg>
  )
}
