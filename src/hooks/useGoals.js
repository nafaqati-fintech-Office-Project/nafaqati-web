import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as goalsApi from '../services/goalsApi.js'

export function useGoals() {
  const [attempt, setAttempt] = useState(0)
  const [quiet, setQuiet] = useState(0)
  const [state, setState] = useState({ id: null, items: [], planner: null, error: null })
  const requestRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestRef.current
    goalsApi
      .listGoals()
      .then((data) => {
        if (requestRef.current !== requestId) return
        const items = Array.isArray(data) ? data : data.items ?? []
        setState({ id: requestId, items, planner: data.planner ?? null, error: null })
      })
      .catch((error) => {
        if (requestRef.current === requestId) setState({ id: requestId, items: [], planner: null, error })
      })
  }, [attempt, quiet])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  const refetch = useCallback(() => setQuiet((value) => value + 1), [])
  const loading = state.id !== requestRef.current

  return useMemo(
    () => ({
      goals: loading ? [] : state.items,
      planner: loading ? null : state.planner,
      error: loading ? null : state.error,
      loading,
      retry,
      refetch,
    }),
    [loading, state, retry, refetch],
  )
}
