import { useCallback, useEffect, useRef, useState } from 'react'

// Loads data whenever `key` changes. Responses for an outdated key are ignored.
// - retry():   reload and show the loading state again
// - refetch(): reload quietly, keeping the current data on screen
export function useAsync(load, key) {
  const [attempt, setAttempt] = useState(0)
  const [quiet, setQuiet] = useState(0)
  const [result, setResult] = useState({ id: null, data: null, error: null })
  const loadRef = useRef(load)
  const requestId = `${key}#${attempt}`

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let active = true
    loadRef
      .current()
      .then((data) => active && setResult({ id: requestId, data, error: null }))
      .catch((error) => active && setResult({ id: requestId, data: null, error }))
    return () => {
      active = false
    }
  }, [requestId, quiet])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const refetch = useCallback(() => setQuiet((n) => n + 1), [])
  const loading = result.id !== requestId
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    retry,
    refetch,
  }
}
