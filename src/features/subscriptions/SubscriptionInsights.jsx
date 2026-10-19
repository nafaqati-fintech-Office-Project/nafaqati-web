import { BadgeAlert, CalendarClock, CircleCheck, ClipboardCheck, TrendingUp } from 'lucide-react'
import { formatCalendarDate, formatMoney } from './subscriptionUtils.js'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionInsights.css'

// "Subscription insights": only what the API really says (needs review, due soon, overdue, price changes)
export default function SubscriptionInsights({ summary, items }) {
  const { t, lang } = useSubscriptionText()
  const list = []
  if (summary?.needsReview > 0) list.push({ key: 'review', icon: ClipboardCheck, tone: 'amber', text: t.insights.review(summary.needsReview) })
  items
    .filter((s) => s.status === 'CONFIRMED' && s.overdue)
    .slice(0, 2)
    .forEach((s) => list.push({ key: `o${s.id}`, icon: BadgeAlert, tone: 'rose', text: t.insights.overdue(s.displayName) }))
  items
    .filter((s) => s.status === 'CONFIRMED' && s.previousAmount != null)
    .slice(0, 2)
    .forEach((s) =>
      list.push({ key: `p${s.id}`, icon: TrendingUp, tone: 'blue', text: t.insights.price(s.displayName, formatMoney(s.previousAmount, s.currency), formatMoney(s.amount, s.currency)) }),
    )
  ;(summary?.upcoming ?? [])
    .slice(0, 3)
    .forEach((u) =>
      list.push({ key: `u${u.id}`, icon: CalendarClock, tone: 'blue', text: t.insights.upcoming(`${u.displayName} (${formatMoney(u.amount, u.currency)})`, formatCalendarDate(u.nextExpectedDate, lang)) }),
    )

  return (
    <aside className="subs-insights" aria-label={t.insights.title}>
      <h2>{t.insights.title}</h2>
      {list.length === 0 ? (
        <p className="subs-insights-ok">
          <CircleCheck size={18} aria-hidden="true" /> {t.insights.allGood}
        </p>
      ) : (
        <ul>
          {list.map(({ key, icon: Icon, tone, text }) => (
            <li key={key}>
              <span className={`subs-insight-icon is-${tone}`} aria-hidden="true">
                <Icon size={15} />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
