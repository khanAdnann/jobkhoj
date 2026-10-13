import { useCallback, useEffect, useState } from 'react'
import { storage } from '@/utils/storage'

/**
 * useState backed by localStorage.
 * Every write persists immediately, and a `storage` event listener keeps
 * duplicate tabs in sync.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => storage.get(key, initialValue))

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        storage.set(key, resolved)
        return resolved
      })
    },
    [key],
  )

  const remove = useCallback(() => {
    storage.remove(key)
    setValue(initialValue)
  }, [key, initialValue])

  useEffect(() => {
    function onStorage(event) {
      // Only react to keys this hook owns.
      if (event.key && !event.key.endsWith(`:${key}`)) return
      setValue(storage.get(key, initialValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, initialValue])

  return [value, set, remove]
}

export default useLocalStorage
