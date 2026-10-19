import { useContext } from 'react'
import { PreferencesContext } from '../context/PreferencesContext.js'

// { userId, prefs (null = not set up yet), loading, error, retry, setPreferences(prefs) }
export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
