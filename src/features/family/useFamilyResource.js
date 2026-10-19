import { useCallback, useEffect, useMemo, useState } from 'react'

// Loads `load(signal)` whenever `key` changes and cancels the request that is no longer needed (family or month switched).
// reload() refetches quietly (data stays on screen); retry() shows the loading state again. enabled=false loads nothing.
export function useFamilyResource(load, key, { enabled = true } = {}) {
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const [quiet, setQuiet] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    const tag = `${key}#${attempt}`
    load(controller.signal)
      .then((data) => !controller.signal.aborted && setResult({ key: tag, data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return
        setResult({ key: tag, data: null, error })
      })
    return () => controller.abort()
    // `load` is a new closure every render: the key says when to refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt, quiet, enabled])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const reload = useCallback(() => setQuiet((n) => n + 1), [])
  const loading = enabled && result.key !== `${key}#${attempt}`
  return useMemo(
    () => ({ data: loading ? null : result.data, error: loading ? null : result.error, loading, retry, reload }),
    [loading, result.data, result.error, retry, reload],
  )
}
