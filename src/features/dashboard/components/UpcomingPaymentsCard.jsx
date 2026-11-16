import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { APP_TEXT } from '../../../constants/appText.js'
import { useAsync } from '../../../hooks/useAsync.js'
import { getSummary } from '../../../services/subscriptionApi.js'
import { formatCalendarDate, formatMoney } from '../../subscriptions/subscriptionUtils.js'

const MAX_ROWS = 4
const t = APP_TEXT.dashboard.payments

// Upcoming payments from subscription-service (GET /api/subscriptions/summary -> `upcoming`, next 30 days).
// Amounts keep their own currency; nothing is converted or added together.
export default function UpcomingPaymentsCard() {
  const state = useAsync(getSummary, 'dashboard-upcoming-payments')

  let body
  if (state.loading) {
    body = (
      <div className="dc-skeleton">
        <span className="sk" style={{ width: '70%', height: 18, borderRadius: 8 }} />
        <span className="sk" style={{ width: '55%', height: 18, borderRadius: 8 }} />
        <span className="sk" style={{ width: '62%', height: 18, borderRadius: 8 }} />
      </div>
    )
  } else if (state.error) {
    body = (
      <div className="dc-state">
        <CalendarClock size={26} aria-hidden="true" />
        <strong>{t.error}</strong>
        <button type="button" className="dc-retry" onClick={state.retry}>
          {APP_TEXT.common.retry}
        </button>
      </div>
    )
  } else {
    const items = [...(state.data?.upcoming ?? [])]
      .sort((a, b) => String(a.nextExpectedDate).localeCompare(String(b.nextExpectedDate)))
      .slice(0, MAX_ROWS)
    body = items.length ? (
      <ul className="pay-list">
        {items.map((u) => (
          <li key={u.id} className="pay-row">
            <span className="pay-icon tone-blue">
              <span className="pay-letter">{(u.displayName || '?').charAt(0).toUpperCase()}</span>
            </span>
            <span className="pay-text">
              <strong>{u.displayName}</strong>
              <span>{formatCalendarDate(u.nextExpectedDate)}</span>
            </span>
            <span className="pay-amount">{formatMoney(u.amount, u.currency)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <div className="dc-state">
        <CalendarClock size={26} aria-hidden="true" />
        <strong>{t.emptyTitle}</strong>
        <p>{t.empty}</p>
      </div>
    )
  }

  return (
    <section className="dc" aria-label={t.title}>
      <header className="dc-head">
        <h2>{t.title}</h2>
        <Link to="/subscriptions">{t.viewAll}</Link>
      </header>
      {body}
    </section>
  )
}
