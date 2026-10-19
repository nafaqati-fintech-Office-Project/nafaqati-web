import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './features/login/Login.jsx'
import Register from './features/register/Register.jsx'
import ForgotPassword from './features/forgot-password/ForgotPassword.jsx'
import ResetPassword from './features/reset-password/ResetPassword.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AuthLoader from './components/AuthLoader.jsx'
import RequirePreferences from './components/RequirePreferences.jsx'
import Onboarding from './features/onboarding/Onboarding.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import ComingSoon from './components/layout/ComingSoon.jsx'
import { NAV_ITEMS } from './config/navigation.js'
import { useAuth } from './context/AuthContext.jsx'

// Lazy so the charting library only loads once the user reaches the dashboard
const Dashboard = lazy(() => import('./features/dashboard/Dashboard.jsx'))
const Transactions = lazy(() => import('./features/transactions/Transactions.jsx'))
const Analytics = lazy(() => import('./features/analytics/Analytics.jsx'))
const Budgets = lazy(() => import('./features/budgets/Budgets.jsx'))
const Goals = lazy(() => import('./features/goals/Goals.jsx'))
const FamilyFinance = lazy(() => import('./features/family/FamilyFinance.jsx'))
const AiAssistant = lazy(() => import('./features/ai-assistant/AiAssistant.jsx'))
const Profile = lazy(() => import('./features/profile/Profile.jsx'))
const Notifications = lazy(() => import('./features/notifications/NotificationsPage.jsx'))
const Subscriptions = lazy(() => import('./features/subscriptions/Subscriptions.jsx'))
const Settings = lazy(() => import('./features/settings/Settings.jsx'))

function HomeRedirect() {
  const { isInitializing, isAuthenticated } = useAuth()
  if (isInitializing) return <AuthLoader />
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <RequirePreferences>
              <AppLayout />
            </RequirePreferences>
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/transactions"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Transactions />
            </Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Analytics />
            </Suspense>
          }
        />
        <Route
          path="/budgets"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Budgets />
            </Suspense>
          }
        />
        <Route
          path="/goals"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Goals />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Profile />
            </Suspense>
          }
        />
                <Route
          path="/notifications"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Notifications />
            </Suspense>
          }
        />
<Route
          path="/subscriptions"
          element={
            <Suspense fallback={<AuthLoader />}>
              <Subscriptions />
            </Suspense>
          }
        />
        <Route
  path="/family"
          element={
            <Suspense fallback={<AuthLoader />}>
      <FamilyFinance />
            </Suspense>
          }
        />
<Route
  path="/ai-assistant"
  element={
    <Suspense fallback={<AuthLoader />}>
      <AiAssistant />
    </Suspense>
  }
/>
<Route
  path="/settings"
  element={
    <Suspense fallback={<AuthLoader />}>
      <Settings />
    </Suspense>
  }
/>
{NAV_ITEMS.filter((item) => !['dashboard', 'transactions', 'analytics', 'budgets', 'goals', 'family', 'ai', 'subscriptions', 'settings'].includes(item.key)).map((item) => (
  <Route key={item.key} path={item.path} element={<ComingSoon />} />
))}
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
