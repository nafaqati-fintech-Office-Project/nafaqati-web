import { createContext } from 'react'

// { loading, plan, status, entitlements, can(key), refresh() }: what the signed-in user may do, from billing-service.
export const PlanContext = createContext(null)
