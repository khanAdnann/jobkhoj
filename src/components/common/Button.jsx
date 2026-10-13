import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:hover:bg-brand-600',
  secondary: 'bg-ink-900 text-white shadow-sm hover:bg-ink-800 active:bg-ink-950',
  outline:
    'border border-ink-300 bg-white text-ink-700 hover:border-ink-400 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:bg-danger-700',
  success: 'bg-success-600 text-white shadow-sm hover:bg-success-700 active:bg-success-700',
  link: 'text-brand-600 underline-offset-4 hover:underline',
}

const SIZES = {
  xs: 'h-8 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  icon: 'h-10 w-10',
  'icon-sm': 'h-9 w-9',
  'icon-xs': 'h-8 w-8',
}

/**
 * Primary action element used across the whole app.
 *
 * @param {'primary'|'secondary'|'outline'|'ghost'|'subtle'|'danger'|'success'|'link'} variant
 * @param {'xs'|'sm'|'md'|'lg'|'icon'|'icon-sm'|'icon-xs'} size
 * @param {boolean} loading  swaps the leading icon for a spinner and disables input
 * @param {boolean} fullWidth
 * @param {ElementType} as  render as another element (e.g. as={Link} to="/jobs")
 *                          — non-button tags skip the native type attribute, and
 *                          `disabled` is enforced by blocking the click instead
 *                          of relying on the (link-only) aria-disabled state
 */
const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    onClick,
    ...props
  },
  ref,
) {
  const isButton = Tag === 'button'
  const isDisabled = disabled || loading

  // A <Link>/<a> ignores the native `disabled` attribute, so an unguarded click
  // would still navigate. Drop the handler instead so the element stays inert.
  function handleClick(event) {
    if (isDisabled && !isButton) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onClick?.(event)
  }

  return (
    <Tag
      ref={ref}
      type={isButton ? type : undefined}
      disabled={isButton ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      tabIndex={!isButton && isDisabled ? -1 : undefined}
      onClick={onClick ? handleClick : undefined}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-55',
        !isButton && isDisabled && 'pointer-events-none opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </Tag>
  )
})

export default Button
