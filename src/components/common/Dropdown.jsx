import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEscapeKey } from '@/hooks/useOverlay'

/**
 * Lightweight action menu used in recruiter and admin tables.
 *
 * Items may render as a button (default) or as another element via `as`, e.g.
 * `<Dropdown.Item as={Link} to="/x">`. Any activation closes the menu.
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  panelClassName,
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false), open)

  function close() {
    setOpen(false)
  }

  useEscapeKey(open, close)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-1.5 animate-scale-in overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            width,
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}

const ITEM_BASE =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const ITEM_TONE = {
  default: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
  danger: 'text-danger-600 hover:bg-danger-50 hover:text-danger-700',
  brand: 'text-brand-700 hover:bg-brand-50',
}

function Item({
  as: Tag = 'button',
  icon: Icon,
  variant = 'default',
  children,
  className,
  onClick,
  disabled,
  ...props
}) {
  function handleClick(event) {
    if (disabled) return
    onClick?.(event)
  }

  return (
    <Tag
      role="menuitem"
      // Without this an item inside a <form> would submit it.
      type={Tag === 'button' ? 'button' : undefined}
      disabled={Tag === 'button' ? disabled : undefined}
      aria-disabled={Tag !== 'button' && disabled ? true : undefined}
      onClick={handleClick}
      className={cn(ITEM_BASE, ITEM_TONE[variant] ?? ITEM_TONE.default, className)}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Tag>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-ink-100" role="separator" />
}

Dropdown.Item = Item
Dropdown.Divider = Divider