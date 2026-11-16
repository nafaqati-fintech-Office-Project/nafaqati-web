import { Link } from 'react-router-dom'
import { CalendarDays, PieChart, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { APP_TEXT } from '../../../constants/appText.js'
import { useFormat } from '../../../hooks/useFormat.js'
import { useCategories } from '../../../hooks/useCategories.js'

const t = APP_TEXT.dashboard.insights

// Insights worked out from the report data the dashboard already loaded from the backend (income vs expenses,
// spending by category, daily spending), in the user's currency. Nothing is invented: a rule that lacks data is skipped.
export default function InsightsCard({ spending, prevSpending, comparable, categories, daily, states }) {
  const { money } = useFormat()
  const { nameOf } = useCategories()

  const loading = states.some((s) => s.loading)
  const failed = states.find((s) => s.error)

  let body
  if (loading) {
    body = (
      <div className="dc-skeleton">
        <span className="sk" style={{ width: '90%', height: 16, borderRadius: 8 }} />
        <span className="sk" style={{ width: '75%', height: 16, borderRadius: 8 }} />
        <span className="sk" style={{ width: '82%', height: 16, borderRadius: 8 }} />
      </div>
    )
  } else if (failed) {
    body = (
      <div className="dc-state">
        <Sparkles size={26} aria-hidden="true" />
        <strong>{t.error}</strong>
        <button type="button" className="dc-retry" onClick={() => states.forEach((s) => s.error && s.retry())}>
          {APP_TEXT.common.retry}
        </button>
      </div>
    )
  } else {
    const list = []

    if (comparable && prevSpending > 0 && spending > 0) {
      const change = Math.round(((spending - prevSpending) / prevSpending) * 100)
      if (change !== 0) {
        list.push({
          key: 'trend',
          icon: change > 0 ? TrendingUp : TrendingDown,
          tone: change > 0 ? 'red' : 'green',
          text: change > 0 ? t.spendingUp(change) : t.spendingDown(Math.abs(change)),
        })
      }
    }

    const top = categories?.items?.[0]
    if (top && categories.total > 0) {
      list.push({ key: 'top', icon: PieChart, tone: 'blue', text: t.topCategory(nameOf(top.key), Math.round(top.percent), money(top.amount)) })
    }

    const peak = (daily?.points ?? []).reduce((best, p) => (p.expenses > (best?.expenses ?? 0) ? p : best), null)
    if (peak && daily.total > 0 && peak.expenses / daily.total >= 0.25) {
      list.push({ key: 'peak', icon: CalendarDays, tone: 'orange', text: t.peakDay(peak.label, money(peak.expenses)) })
    }

    body = list.length ? (
      <ul className="insight-list">
        {list.map(({ key, icon: Icon, tone, text }) => (
          <li key={key} className="insight-row">
            <span className={`pay-icon tone-${tone}`}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    ) : (
      <div className="dc-state">
        <Sparkles size={26} aria-hidden="true" />
        <strong>{t.emptyTitle}</strong>
        <p>{t.empty}</p>
      </div>
    )
  }

  return (
    <section className="dc" aria-label={t.title}>
      <header className="dc-head">
        <h2>{t.title}</h2>
        <Link to="/ai-assistant">{t.ask}</Link>
      </header>
      {body}
    </section>
  )
}
