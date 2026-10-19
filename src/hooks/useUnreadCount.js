import { useCallback, useEffect, useRef, useState } from 'react'
import * as notificationApi from '../services/notificationApi.js'

const POLL_MS = 45 * 1000
const BACKOFF_MS = 3 * 60 * 1000
const MIN_GAP_MS = 5 * 1000 // focus + visibilitychange fire together: one request, not two

// The bell's unread count.
// - polls every 45 s, only while the tab is visible; refetches when the tab becomes visible / the window gets focus
// - after an error the interval is 3 min until a request succeeds; a 401 (session over) stops it for good
// - one request at a time: refresh() while one is running schedules exactly one more afterwards
// - onIncrease(count, previous) is called at most once per poll/focus request whose count went up (never for refresh())
export function useUnreadCount({ onIncrease } = {}) {
  const [state, setState] = useState({ count: null, error: false })
  const stateRef = useRef({ count: null, failures: 0, stopped: false, last: 0, timer: null })
  const onIncreaseRef = useRef(onIncrease)

  useEffect(() => {
    onIncreaseRef.current = onIncrease
  })

  const run = useRef(null)

  useEffect(() => {
    const s = stateRef.current
    s.stopped = false
    s.failures = 0
    let alive = true
    let inFlight = false // per effect run: a StrictMode remount must not inherit an abandoned request
    let again = false
    const visible = () => document.visibilityState !== 'hidden'

    const schedule = () => {
      clearTimeout(s.timer)
      if (!alive || s.stopped || !visible()) return
      s.timer = setTimeout(() => run.current('poll'), s.failures > 0 ? BACKOFF_MS : POLL_MS)
    }

    run.current = async (source) => {
      if (!alive || s.stopped) return
      if (inFlight) {
        if (source === 'refresh') again = true
        return
      }
      inFlight = true
      s.last = Date.now()
      try {
        const count = await notificationApi.getUnreadCount()
        if (!alive) return
        const previous = s.count
        s.count = count
        s.failures = 0
        setState({ count, error: false })
        if (source !== 'refresh' && previous !== null && count > previous) onIncreaseRef.current?.(count, previous)
      } catch (error) {
        if (!alive) return
        if (error?.response?.status === 401) s.stopped = true
        else s.failures += 1
        setState((cur) => ({ ...cur, error: true }))
      } finally {
        inFlight = false
        if (alive && again && !s.stopped) {
          again = false
          run.current('refresh')
        } else {
          schedule()
        }
      }
    }

    const wake = () => {
      if (!visible() || s.stopped) return
      if (Date.now() - s.last >= MIN_GAP_MS) run.current('focus')
      else schedule()
    }
    const onVisibility = () => {
      if (visible()) wake()
      else clearTimeout(s.timer)
    }

    run.current('initial')
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', wake)
    return () => {
      alive = false
      clearTimeout(s.timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', wake)
    }
  }, [])

  // Call after any mutation (read, unread, delete, read-all)
  const refresh = useCallback(() => run.current?.('refresh'), [])
  return { count: state.count ?? 0, loaded: state.count !== null, error: state.error, refresh }
}
