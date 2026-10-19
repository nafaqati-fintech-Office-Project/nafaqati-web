import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UserContext } from './UserContext.js'
import { useAuth } from './AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getErrorInfo } from '../lib/errors.js'
import * as userApi from '../services/userApi.js'

// While the first name is still a placeholder, the registration event may not have arrived yet:
// poll a few times, then give up (old accounts never get an event).
const NAME_RETRIES = 3
const NAME_RETRY_DELAY_MS = 2000
const FOCUS_REFETCH_MIN_GAP_MS = 5000

// Loads GET /api/users/me once per signed-in user (including on app start, once the session is
// restored) and shares it. The key changes with the user, so logging out drops the profile.
export default function UserProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const userId = isAuthenticated ? user?.id : null
  const request = useAsync(() => (userId ? userApi.getMe() : Promise.resolve(null)), `profile:${userId ?? 'anonymous'}`)
  const [saved, setSaved] = useState(null)
  const [retries, setRetries] = useState({ userId: null, count: 0 })
  const lastFocusFetch = useRef(0)

  // After a successful PUT the response replaces the cached profile (no refetch needed)
  const updateProfile = useCallback((profile) => setSaved({ userId, profile }), [userId])

  const refresh = request.retry
  const { refetch } = request
  const profile = userId ? (saved?.userId === userId && saved.profile ? saved.profile : request.data) : null
  const provisional = Boolean(profile?.nameProvisional)
  const attempts = retries.userId === userId ? retries.count : 0
  // true while we are still waiting for the real name to arrive
  const nameResolving = provisional && attempts < NAME_RETRIES

  // Poll /me up to NAME_RETRIES times; every refetch that is still provisional yields a new data
  // object, which re-runs this effect for the next attempt.
  useEffect(() => {
    if (!nameResolving) return undefined
    const timer = setTimeout(() => {
      setRetries({ userId, count: attempts + 1 })
      refetch()
    }, NAME_RETRY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [nameResolving, attempts, userId, refetch, request.data])

  // Coming back to the tab: check once more if the name is still a placeholder
  useEffect(() => {
    if (!provisional) return undefined
    const onFocus = () => {
      const now = Date.now()
      if (now - lastFocusFetch.current < FOCUS_REFETCH_MIN_GAP_MS) return
      lastFocusFetch.current = now
      refetch()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [provisional, refetch])

  const value = useMemo(
    () => ({
      profile,
      loading: Boolean(userId) && request.loading,
      error: userId && request.error ? getErrorInfo(request.error, 'profile').message : null,
      nameProvisional: provisional,
      nameResolving,
      refresh,
      updateProfile,
    }),
    [userId, profile, request.loading, request.error, provisional, nameResolving, refresh, updateProfile],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
