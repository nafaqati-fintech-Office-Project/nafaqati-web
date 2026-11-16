import { useCallback, useMemo } from 'react'
import { PlanContext } from './PlanContext.js'
import { useAuth } from './AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getMe } from '../services/billingApi.js'
import { isAllowed } from '../features/plans/planUtils.js'

// Loads GET /api/billing/me once per signed-in user and shares it. The server decides what the user may do; pages only
// hide or explain what it refuses. While the answer is loading nothing is treated as allowed. If it cannot be loaded the
// user counts as Free (the server refuses Premium features anyway).
export default function PlanProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const userId = isAuthenticated ? user?.id : null
  const request = useAsync(() => (userId ? getMe() : Promise.resolve(null)), `plan:${userId ?? 'anonymous'}`)
  const { refetch } = request

  const me = userId ? request.data : null
  const loading = Boolean(userId) && request.loading
  const entitlements = useMemo(() => me?.entitlements ?? {}, [me])
  const can = useCallback((key) => isAllowed(entitlements[key]), [entitlements])
  const refresh = useCallback(() => refetch(), [refetch])

  const value = useMemo(
    () => ({ loading, plan: me?.plan ?? 'free', status: me?.status ?? 'FREE', entitlements, can, refresh }),
    [loading, me, entitlements, can, refresh],
  )
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
