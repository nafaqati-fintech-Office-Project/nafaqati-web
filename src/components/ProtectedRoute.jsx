import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLoader from './AuthLoader.jsx'

export default function ProtectedRoute({ children }) {
  const { isInitializing, isAuthenticated, sessionExpired } = useAuth()
  const location = useLocation()

  if (isInitializing) return <AuthLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location, expired: sessionExpired }} />
  }

  return children
}
