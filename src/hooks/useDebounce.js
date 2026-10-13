import { useEffect, useState } from 'react'

/**
 * Debounce a rapidly changing value.
 * Used for search inputs so we don't filter on every keystroke.
 */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebounce
