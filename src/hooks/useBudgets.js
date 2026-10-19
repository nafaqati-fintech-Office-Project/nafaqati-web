import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getErrorInfo } from '../lib/errors.js'
import * as budgetApi from '../services/budgetApi.js'
import { monthPeriod } from '../features/budgets/budgetUtils.js'

const MONTH_DEBOUNCE_MS = 300 // rapid month changes collapse into one request (gateway limit 20/s)
const POLL_MS = 3000
const POLL_MAX_MS = 2 * 60 * 1000

// The budget of `month` ("YYYY-MM"): GET /api/budgets?month=. ACTIVE wins over an archived one of the same month.
// While catchUpStatus is PENDING (existing transactions still being counted) the budget is polled every 3 s for at
// most 2 minutes; after that `catchUpTimedOut` is true until retryCatchUp().
export function useBudgets(month) {
  const [debouncedMonth, setDebouncedMonth] = useState(month)
  const [state, setState] = useState({ budget: null, error: null, loading: true })
  const [pollRound, setPollRound] = useState(0)
  const [catchUpTimedOut, setCatchUpTimedOut] = useState(false)
  const requestRef = useRef(0)

  useEffect(() => {
    if (month === debouncedMonth) return undefined
    const timer = setTimeout(() => setDebouncedMonth(month), MONTH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [month, debouncedMonth])

  const load = useCallback(
    (quiet = false) => {
      const requestId = ++requestRef.current
      if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
      const { periodStart } = monthPeriod(debouncedMonth)
      return budgetApi
        .listBudgets({ month: debouncedMonth, size: 50 })
        .then((page) => {
          if (requestRef.current !== requestId) return
          const inMonth = page.content.filter((b) => b.periodStart === periodStart)
          const budget = inMonth.find((b) => b.status === 'ACTIVE') ?? inMonth[0] ?? null
          setState({ budget, error: null, loading: false })
        })
        .catch((error) => {
          if (requestRef.current === requestId) setState({ budget: null, error, loading: false })
        })
    },
    [debouncedMonth],
  )

  useEffect(() => {
    load()
  }, [load])

  const budgetId = state.budget?.id
  const pending = state.budget?.catchUpStatus === 'PENDING' && state.budget?.status === 'ACTIVE'

  useEffect(() => {
    if (!pending) return undefined
    const startedAt = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - startedAt >= POLL_MAX_MS) {
        clearInterval(timer)
        setCatchUpTimedOut(true)
        return
      }
      budgetApi
        .getBudget(budgetId)
        .then((budget) => setState((s) => (s.budget?.id === budget.id ? { ...s, budget } : s)))
        .catch(() => {})
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [pending, budgetId, pollRound])

  const retryCatchUp = useCallback(() => {
    setCatchUpTimedOut(false)
    setPollRound((n) => n + 1)
  }, [])
  const retry = useCallback(() => load(false), [load])
  const refetch = useCallback(() => load(true), [load])

  return useMemo(
    () => ({
      ...state,
      loading: state.loading || month !== debouncedMonth,
      errorMessage: state.error ? getErrorInfo(state.error, 'budgets').message : '',
      catchUpPending: pending && !catchUpTimedOut,
      catchUpTimedOut: pending && catchUpTimedOut,
      retryCatchUp,
      retry,
      refetch,
    }),
    [state, month, debouncedMonth, pending, catchUpTimedOut, retryCatchUp, retry, refetch],
  )
}
