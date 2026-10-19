import { Navigate } from 'react-router-dom'
import { usePreferences } from '../hooks/usePreferences.js'
import { APP_TEXT } from '../constants/appText.js'
import AuthLoader from './AuthLoader.jsx'

// Everything in the app (except /onboarding) needs the user's country and currency first.
export default function RequirePreferences({ children }) {
  const { prefs, loading, error, retry } = usePreferences()

  if (loading) return <AuthLoader />
  if (error) {
    return (
      <div className="dc-state" role="alert" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <p>{error}</p>
        <button type="button" className="dc-retry" onClick={retry}>
          {APP_TEXT.common.retry}
        </button>
      </div>
    )
  }
  if (prefs === null) return <Navigate to="/onboarding" replace />
  return children
}
