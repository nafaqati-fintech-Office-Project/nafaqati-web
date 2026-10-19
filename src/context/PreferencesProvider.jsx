import { useCallback, useEffect, useMemo, useState } from 'react'
import { PreferencesContext } from './PreferencesContext.js'
import { useAuth } from './AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { setApiLanguage } from '../lib/api.js'
import { getErrorInfo } from '../lib/errors.js'
import * as userApi from '../services/userApi.js'

// Loads GET /api/users/me/preferences once per signed-in user.
// prefs === null means "not set up yet" (the API's 404): the app sends the user to /onboarding.
export default function PreferencesProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const userId = isAuthenticated ? user?.id : null
  const request = useAsync(
    () => (userId ? userApi.getPreferences() : Promise.resolve(null)),
    `preferences:${userId ?? 'anonymous'}`,
  )
  const [saved, setSaved] = useState(null)

  // After a successful POST/PUT the response replaces the cached preferences
  const setPreferences = useCallback((prefs) => setSaved({ userId, prefs }), [userId])
  const prefs = saved?.userId === userId && saved.prefs ? saved.prefs : request.data

  const language = userId ? prefs?.language : null
  useEffect(() => {
    setApiLanguage(language)
  }, [language])

  const value = useMemo(
    () => ({
      userId,
      prefs: userId ? prefs : null,
      loading: Boolean(userId) && request.loading,
      error: userId && request.error ? getErrorInfo(request.error, 'preferences').message : null,
      retry: request.retry,
      setPreferences,
    }),
    [userId, prefs, request.loading, request.error, request.retry, setPreferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
