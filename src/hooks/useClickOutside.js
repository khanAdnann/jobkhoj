import { useEffect, useRef } from 'react'

/**
 * Calls `handler` when a click/touch happens outside the returned ref.
 * Used to dismiss the notification dropdown and filter popovers.
 */
export function useClickOutside(handler, enabled = true) {
  const ref = useRef(null)
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return undefined

    function onPointerDown(event) {
      const node = ref.current
      if (node && !node.contains(event.target)) {
        savedHandler.current?.(event)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [enabled])

  return ref
}

export default useClickOutside
