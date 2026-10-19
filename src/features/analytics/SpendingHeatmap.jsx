import SectionCard, { Sk } from './SectionCard.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import { dayLabel, forCurrency, money, weekdayIndex, weekdayNames } from './analyticsUtils.js'
import { todayKey } from '../../utils/dateRange.js'
import './SpendingHeatmap.css'

const LEVELS = 4

// Calendar-style heatmap of the month (Monday first). Intensity = the day's spending relative to the month's busiest
// day. Data: daily-spending, which has one entry for every day of the month.
export default function SpendingHeatmap({ state, currency, timeZone }) {
  const { t, locale } = useAnalyticsText()
  const entry = forCurrency(state.data, currency)
  const days = (entry?.days ?? []).map((d) => ({ ...d, total: Number(d.total) }))
  const max = Math.max(0, ...days.map((d) => d.total))
  const today = todayKey(timeZone)
  const lead = days.length ? weekdayIndex(days[0].date) : 0
  const level = (total) => (total <= 0 ? 0 : Math.min(LEVELS, Math.ceil((total / max) * LEVELS)))

  return (
    <SectionCard
      title={t.heatmap.title}
      className="an-heat"
      state={state}
      skeleton={<Sk h={220} r={12} />}
      empty={state.data && max === 0 ? { title: t.heatmap.emptyTitle, body: t.heatmap.emptyBody } : null}
    >
      <div className="an-heat-grid">
        {weekdayNames(locale).map((name) => (
          <span key={name} className="an-heat-head">
            {name}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`pad${i}`} />
        ))}
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            className={`an-heat-cell level-${level(d.total)} ${d.date > today ? 'is-future' : ''}`}
            aria-label={t.heatmap.day(dayLabel(d.date, locale), money(d.total, currency), d.count)}
          >
            <span className="an-heat-day">{Number(d.date.slice(8))}</span>
            <span className="an-heat-tip" role="tooltip">
              <strong>{dayLabel(d.date, locale)}</strong>
              {money(d.total, currency)}
              <small>{t.categories.transactions(d.count)}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="an-heat-scale" aria-hidden="true">
        <span>{t.heatmap.less}</span>
        {Array.from({ length: LEVELS + 1 }, (_, i) => (
          <i key={i} className={`level-${i}`} />
        ))}
        <span>{t.heatmap.more}</span>
      </div>
    </SectionCard>
  )
}
