import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from '@/context/toastContext'

const DEFAULT_DURATION = 4000

let counter = 0
const nextId = () => {
  counter += 1
  return `toast-${counter}`
}

/**
 * Holds toast state and auto-dismiss timers.
 *
 * Mount once at the app root (inside the router) and render
 * <ToastViewport /> alongside it. Toasts are then pushed from anywhere via
 * `useToast()`:
 *
 *   const toast = useToast()
 *   toast.success('Application submitted')
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, { tone = 'info', title, duration = DEFAULT_DURATION } = {}) => {
      const id = nextId()
      setToasts((prev) => [...prev, { id, message, tone, title, duration }])

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }

      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      push,
      success: (message, options) => push(message, { ...options, tone: 'success' }),
      error: (message, options) => push(message, { ...options, tone: 'error' }),
      info: (message, options) => push(message, { ...options, tone: 'info' }),
      warning: (message, options) => push(message, { ...options, tone: 'warning' }),
    }),
    [toasts, dismiss, push],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
