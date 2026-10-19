import { ShieldCheck } from 'lucide-react'
import { currencyRows, formatMoney } from './subscriptionUtils.js'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionSummaryCard.css'

// "You're paying SAR 286 / month": CONFIRMED subscriptions only, one line per currency (currencies are never added together)
export default function SubscriptionSummaryCard({ summary, loading, failed }) {
  const { t } = useSubscriptionText()
  const rows = currencyRows(summary)

  return (
    <section className="subs-summary" aria-label={t.summary.paying} aria-busy={loading}>
      <span className="subs-summary-icon" aria-hidden="true">
        <ShieldCheck size={30} />
      </span>
      <div className="subs-summary-body">
        <p className="subs-summary-label">{t.summary.paying}</p>
        {loading || (!summary && !failed) ? (
          <span className="sk subs-summary-sk" />
        ) : rows.length === 0 ? (
          <>
            <p className="subs-summary-empty">{t.summary.none}</p>
            <p className="subs-summary-sub">{t.summary.noneHint}</p>
          </>
        ) : (
          <ul className="subs-summary-rows">
            {rows.map((row) => (
              <li key={row.currency}>
                <strong>
                  {formatMoney(row.monthlyTotal, row.currency)} <span>{t.summary.perMonth}</span>
                </strong>
                <small>
                  {t.summary.active(row.activeCount)} · {t.summary.yearly(formatMoney(row.yearlyTotal, row.currency))}
                </small>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 1 && <p className="subs-summary-note">{t.summary.separateNote}</p>}
      </div>
    </section>
  )
}
