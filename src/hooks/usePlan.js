import { useContext } from 'react'
import { PlanContext } from '../context/PlanContext.js'

// const { can, loading } = usePlan(); can('reports.advanced')
export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
  return ctx
}
