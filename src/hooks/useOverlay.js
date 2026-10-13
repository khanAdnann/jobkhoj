import { useEffect } from 'react'

/**
 * Locks body scroll while an overlay is open, compensating for the removed
 * scrollbar width so the page underneath doesn't shift horizontally.
 */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [locked])
}

/** Calls `onEscape` when Escape is pressed while `active`. */
export function useEscapeKey(active, onEscape) {
  useEffect(() => {
    if (!active) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') onEscape?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, onEscape])
}
