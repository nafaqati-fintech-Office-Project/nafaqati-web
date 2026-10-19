import { CircleAlert, Info, TriangleAlert } from 'lucide-react'

export const NOTIFICATION_TYPES = ['TRANSACTION_ALERT', 'LARGE_TRANSACTION', 'BUDGET_THRESHOLD', 'BUDGET_EXCEEDED', 'FAMILY', 'SECURITY_ALERT', 'SYSTEM']
export const MANDATORY_TYPES = ['SECURITY_ALERT', 'SYSTEM']

export const SEVERITY_VISUAL = {
  INFO: { icon: Info, tone: 'info' },
  WARNING: { icon: TriangleAlert, tone: 'warning' },
  CRITICAL: { icon: CircleAlert, tone: 'critical' },
}

// Where a click on a notification goes; null = just mark it read. Only BUDGET is known today:
// /budgets, on the month of the budget when the alert says which month it was (params.periodEnd, yyyy-MM-dd).
export function deepLinkFor(notification) {
  // family-service notifications (invitations, role changes) and family budget alerts: the Family page
  if (notification.type === 'FAMILY' || String(notification.templateKey ?? '').startsWith('FAMILY_')) return '/family'
  if (notification.referenceType !== 'BUDGET') return null
  const periodEnd = notification.params?.periodEnd
  const month = typeof periodEnd === 'string' && /^\d{4}-\d{2}/.test(periodEnd) ? periodEnd.slice(0, 7) : ''
  return month ? `/budgets?month=${month}` : '/budgets'
}

export const badgeLabel = (count) => (count > 99 ? '99+' : String(count))
