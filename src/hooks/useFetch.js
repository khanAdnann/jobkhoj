import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an async fetcher and exposes { data, error, loading, refetch }.
 *
 * Built so every list/detail page can show a skeleton while loading and an
 * error state on failure without each page re-implementing the same flags.
 *
 * A monotonically increasing request id makes sure a slow earlier response can
 * never overwrite the result of a newer request (search-as-you-type).
 *
 * @param {Function} fetcher  async (signal) => data
 * @param {Array}    deps     re-run when these change (like useEffect deps)
 * @param {Object}   options  { immediate = true, initialData = null }
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options

  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [refetching, setRefetching] = useState(false)

  const requestId = useRef(0)
  const mounted = useRef(true)
  const isFirstRun = useRef(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async () => {
    const id = requestId.current + 1
    requestId.current = id

    if (isFirstRun.current) setLoading(true)
    else setRefetching(true)
    setError(null)

    try {
      const result = await fetcherRef.current()
      if (!mounted.current || id !== requestId.current) return
      setData(result)
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return
      setError(err)
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false)
        setRefetching(false)
      }
      isFirstRun.current = false
    }
  }, [])

  useEffect(() => {
    if (immediate) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, refetching, refetch: run, setData }
}

export default useFetch
