import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as notificationApi from '../services/notificationApi.js'

// One page of notifications for `params` ({ page, size, unreadOnly, type }). Responses for outdated params are ignored.
// refetch() reloads quietly (keeps the current data); retry() shows the loading state again. `enabled: false` loads nothing.
export function useNotifications(params, { enabled = true } = {}) {
  const key = JSON.stringify(params)
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const [quiet, setQuiet] = useState(0)
  const paramsRef = useRef(params)
  const requestRef = useRef(0)

  useEffect(() => {
    paramsRef.current = params
  })

  useEffect(() => {
    if (!enabled) return
    const id = ++requestRef.current
    notificationApi
      .listNotifications(paramsRef.current)
      .then((data) => requestRef.current === id && setResult({ key: `${key}#${attempt}`, data, error: null }))
      .catch((error) => requestRef.current === id && setResult({ key: `${key}#${attempt}`, data: null, error }))
  }, [key, attempt, quiet, enabled])

  const loading = enabled && result.key !== `${key}#${attempt}`
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const refetch = useCallback(() => setQuiet((n) => n + 1), [])

  return useMemo(
    () => ({ data: loading ? null : result.data, error: loading ? null : result.error, loading, retry, refetch }),
    [loading, result.data, result.error, retry, refetch],
  )
}
