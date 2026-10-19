import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as subscriptionApi from '../../services/subscriptionApi.js'
import { replaceItem, splitSubscriptions, syncDelay, syncView } from './subscriptionUtils.js'

const LIST_STATUSES = ['DETECTED', 'CONFIRMED', 'ENDED', 'DISMISSED']

// The page's data: the list (all four statuses in one request) and then the summary, never in parallel, because
// the first call of a user runs the history catch-up and the second would only see IN_PROGRESS.
// - sync: while syncStatus is not DONE the list is reloaded after 4, 8, 16 and 30 s; then it stops and offers a retry
// - mutations return the fresh subscription: it replaces the old one at once, the summary is reloaded after
// - `busy` holds the ids with a request in flight, so a button can never be pressed twice
export function useSubscriptions() {
  const [state, setState] = useState({ list: null, summary: null, loading: true, error: null, summaryError: false })
  const [attempts, setAttempts] = useState(0)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(() => new Set())
  const busyRef = useRef(new Set())
  const requestRef = useRef(0)
  const quietRef = useRef(false)

  useEffect(() => {
    const id = ++requestRef.current
    const quiet = quietRef.current
    quietRef.current = false
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        const list = await subscriptionApi.listSubscriptions(LIST_STATUSES)
        if (requestRef.current !== id) return
        setState((s) => ({ ...s, list, loading: false, error: null }))
        try {
          const summary = await subscriptionApi.getSummary()
          if (requestRef.current === id) setState((s) => ({ ...s, summary, summaryError: false }))
        } catch {
          if (requestRef.current === id) setState((s) => ({ ...s, summaryError: true }))
        }
      } catch (error) {
        if (requestRef.current === id) setState((s) => ({ ...s, list: quiet ? s.list : null, loading: false, error }))
      }
    })()
  }, [reload])

  const syncStatus = state.list?.syncStatus
  const view = syncView(syncStatus, attempts)

  useEffect(() => {
    if (state.loading || state.error || view === 'done' || view === 'timedOut') return undefined
    const wait = syncDelay(attempts)
    const timer = setTimeout(() => {
      quietRef.current = true
      setAttempts((n) => n + 1)
      setReload((n) => n + 1)
    }, wait)
    return () => clearTimeout(timer)
  }, [state.loading, state.error, view, attempts])

  const retry = useCallback(() => {
    setAttempts(0)
    setReload((n) => n + 1)
  }, [])

  // quiet reload of list + summary (after a 404/409: the screen was out of date)
  const refresh = useCallback(() => {
    quietRef.current = true
    setReload((n) => n + 1)
  }, [])

  const refreshSummary = useCallback(async () => {
    try {
      const summary = await subscriptionApi.getSummary()
      setState((s) => ({ ...s, summary, summaryError: false }))
    } catch {
      setState((s) => ({ ...s, summaryError: true }))
    }
  }, [])

  // run(id, request): one request per id at a time; resolves { ok, value } or { ok: false, error }
  const run = useCallback(
    async (id, request) => {
      if (busyRef.current.has(id)) return { ok: false, skipped: true }
      busyRef.current.add(id)
      setBusy(new Set(busyRef.current))
      try {
        const value = await request()
        return { ok: true, value }
      } catch (error) {
        return { ok: false, error }
      } finally {
        busyRef.current.delete(id)
        setBusy(new Set(busyRef.current))
      }
    },
    [],
  )

  const applyFresh = useCallback(
    (fresh) => {
      setState((s) => (s.list ? { ...s, list: { ...s.list, items: replaceItem(s.list.items, fresh) } } : s))
      refreshSummary()
    },
    [refreshSummary],
  )

  const act = useCallback(
    async (id, request) => {
      const result = await run(id, request)
      if (result.ok) applyFresh(result.value)
      return result
    },
    [run, applyFresh],
  )

  const created = useCallback(async (request) => {
    const result = await run('create', request)
    if (result.ok) setReload((n) => n + 1) // new row + totals: one reload, quietly
    if (result.ok) quietRef.current = true
    return result
  }, [run])

  const groups = useMemo(() => splitSubscriptions(state.list?.items), [state.list])

  return {
    ...state,
    items: state.list?.items ?? [],
    groups,
    syncView: view,
    busy,
    retry,
    refresh,
    act,
    created,
    runAction: run,
  }
}
