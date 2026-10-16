import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Briefcase, Building2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import AuthLayout from '@/layouts/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { PATHS } from '@/routes/paths'
import { HOME_BY_ROLE, ROLES } from '@/utils/constants'
import { Button, Input, Select } from '@/components/common'
import { cn } from '@/utils/cn'

const ACCOUNT_TYPES = [
  {
    value: ROLES.JOB_SEEKER,
    label: 'I am looking for a job',
    description: 'Search roles, apply and track progress',
    icon: User,
  },
  {
    value: ROLES.RECRUITER,
    label: 'I am hiring',
    description: 'Post jobs and manage candidates',
    icon: Building2,
  },
]

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5000+ employees',
]

/**
 * Registration page (PRD section 23).
 *
 * The account-type toggle is the key interaction: it decides the role stored on
 * the user, which in turn decides the dashboard they land on and which extra
 * fields the form shows.
 */
export default function Register() {
  const { register: createAccount } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [role, setRole] = useState(ROLES.JOB_SEEKER)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      role: ROLES.JOB_SEEKER,
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companySize: '',
      terms: false,
    },
  })

  const password = watch('password')

  async function onSubmit(values) {
    try {
      // Client-side guard; the service validates again server-side.
      if (values.password !== values.confirmPassword) {
        setError('confirmPassword', { message: 'Passwords do not match' })
        return
      }

      const result = await createAccount({
        role: values.role,
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        companyName: values.role === ROLES.RECRUITER ? values.companyName : undefined,
        companySize: values.role === ROLES.RECRUITER ? values.companySize : undefined,
      })

      if (result?.needsEmailConfirmation) {
        toast.info('Check your email to confirm your account, then sign in.')
        navigate(PATHS.login, { replace: true })
        return
      }

      const user = result?.user ?? result
      toast.success(
        user.role === ROLES.RECRUITER
          ? 'Account created. Recruiter approval is required before posting jobs.'
          : 'Account created — welcome to JobKhoj!',
      )
      navigate(HOME_BY_ROLE[user.role] ?? PATHS.home, { replace: true })
    } catch (error) {
      setError('root', { message: error.message })
      toast.error(error.message || 'Could not create your account.')
    }
  }

  function chooseRole(next) {
    setRole(next)
    // Keep the registered form value in sync without re-running validation.
    setValue('role', next)
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute — no credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline">
            Sign in
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

        {/* ------------------------- account type ------------------------- */}
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold text-ink-800">
            What brings you to JobKhoj?
          </legend>

          <input type="hidden" {...register('role')} />

          <div className="grid gap-3 sm:grid-cols-2">
            {ACCOUNT_TYPES.map((option) => {
              const Icon = option.icon
              const active = role === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => chooseRole(option.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-colors',
                    active
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-ink-200 bg-white hover:border-ink-300',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      className={cn('h-4 w-4', active ? 'text-brand-600' : 'text-ink-400')}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        active ? 'text-brand-800' : 'text-ink-800',
                      )}
                    >
                      {option.label}
                    </span>
                  </span>
                  <span className="text-xs text-ink-500">{option.description}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* -------------------------- shared fields ------------------------ */}
        <Input
          label="Full name"
          icon={User}
          placeholder="e.g. Aditya Sharma"
          autoComplete="name"
          error={errors.name?.message}
          required
          {...register('name', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'Please enter your full name' },
          })}
        />

        <div className="grid gap-5 sm:grid-cols-2">
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

          <Input
            label="Phone number"
            type="tel"
            icon={Phone}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone', {
              pattern: {
                value: /^[+]?[\d\s-]{10,15}$/,
                message: 'Enter a valid phone number',
              },
            })}
          />
        </div>

        {/* ----------------------- recruiter-only fields ------------------- */}
        {role === ROLES.RECRUITER && (
          <div className="grid gap-5 rounded-lg border border-brand-200 bg-brand-50/40 p-4 sm:grid-cols-2">
            <Input
              label="Company name"
              icon={Building2}
              placeholder="e.g. Acme Technologies"
              containerClassName="sm:col-span-2"
              error={errors.companyName?.message}
              required
              {...register('companyName', {
                required: 'Company name is required',
              })}
            />

            <Select
              label="Company size"
              placeholder="Select size"
              options={COMPANY_SIZES.map((size) => ({ value: size, label: size }))}
              error={errors.companySize?.message}
              required
              {...register('companySize', {
                required: 'Please select your company size',
              })}
            />
          </div>
        )}

        {/* ----------------------------- passwords ------------------------- */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Password"
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
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
        </div>

        {/* Password strength meter */}
        <PasswordStrength value={password} />

        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            id="terms"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            {...register('terms', { required: 'Please accept the terms to continue' })}
          />
          <label htmlFor="terms" className="cursor-pointer text-sm text-ink-600">
            I agree to the{' '}
            <span className="font-medium text-brand-600">Terms of Service</span> and{' '}
            <span className="font-medium text-brand-600">Privacy Policy</span>.
          </label>
        </div>
        {errors.terms && <p className="-mt-3 text-xs text-danger-600">{errors.terms.message}</p>}

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          <Briefcase className="h-4 w-4" aria-hidden="true" />
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}

/* -------------------------------------------------------------------------- */

const LEVELS = [
  { label: 'Too short', test: (v) => v.length >= 8 },
  { label: 'Weak', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'Fair', test: (v) => /\d/.test(v) },
  { label: 'Strong', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

const TONE = ['bg-ink-200', 'bg-danger-500', 'bg-warning-500', 'bg-brand-500', 'bg-success-500']

/** Small inline meter so users get feedback before submitting. */
function PasswordStrength({ value = '' }) {
  if (!value) return null

  const score = LEVELS.filter((level) => level.test(value)).length

  return (
    <div className="-mt-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', TONE[Math.min(score, 3)])}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-500">
        Password strength:{' '}
        <span className="font-medium text-ink-700">
          {['Too short', 'Weak', 'Fair', 'Strong'][Math.min(score, 3)]}
        </span>
      </p>
      <span className="sr-only" aria-live="polite">
        {`Password strength: ${['Too short', 'Weak', 'Fair', 'Strong'][Math.min(score, 3)]}`}
      </span>
    </div>
  )
}