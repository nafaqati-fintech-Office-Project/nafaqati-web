import { useEffect, useState } from 'react'
import { Bell, CircleAlert } from 'lucide-react'
import { getErrorInfo } from '../../lib/errors.js'
import { getBudgetAlerts } from '../../services/budgetApi.js'
import './AlertsPanel.css'

export default function AlertsPanel({ budget, byCode, onRetryKey = 0 }) {
  const [state, setState] = useState({ loading: false, error: null, alerts: [] })

  useEffect(() => {
    if (!budget?.id) return undefined
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))
    getBudgetAlerts(budget.id)
      .then((alerts) => active && setState({ loading: false, error: null, alerts }))
      .catch((error) => active && setState({ loading: false, error, alerts: [] }))
    return () => {
      active = false
    }
  }, [budget?.id, budget?.totalSpent, onRetryKey])

  return (
    <section className="budget-section budget-alerts" aria-label="Budget alerts">
      <div className="budget-section-head">
        <h2>Alerts</h2>
      </div>
      {state.loading ? (
        <div className="budget-alert-skeleton">
          <span className="sk" />
          <span className="sk" />
        </div>
      ) : state.error ? (
        <div className="dc-state">
          <CircleAlert size={26} aria-hidden="true" />
          <strong>Alerts could not load</strong>
          <p>{getErrorInfo(state.error, 'budgets').message}</p>
        </div>
      ) : state.alerts.length ? (
        <ul className="budget-alert-list">
          {state.alerts.map((alert) => (
            <li key={alert.id}>
              <Bell size={17} aria-hidden="true" />
              <div>
                <strong>{alert.threshold.replace('T', '')}% threshold</strong>
                <span>{alert.category ? byCode[alert.category]?.name ?? alert.category : 'Overall budget'}</span>
              </div>
              <time>{String(alert.triggeredAt).replace('T', ' ').slice(0, 16)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <div className="dc-state">
          <Bell size={26} aria-hidden="true" />
          <strong>No alerts yet</strong>
          <p>Alerts will appear when spending crosses a budget threshold.</p>
        </div>
      )}
    </section>
  )
}
