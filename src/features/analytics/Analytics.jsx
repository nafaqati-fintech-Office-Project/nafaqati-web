import { useState } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics.js'
import { useFormat } from '../../hooks/useFormat.js'
import { currentMonth } from '../../utils/dateRange.js'
import AnalyticsHeader from './AnalyticsHeader.jsx'
import KpiCards from './KpiCards.jsx'
import TrendChart from './TrendChart.jsx'
import CategoryBreakdown from './CategoryBreakdown.jsx'
import SpendingHeatmap from './SpendingHeatmap.jsx'
import WeekdayPattern from './WeekdayPattern.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import './Analytics.css'

const shiftMonth = (month, by) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + by, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export default function Analytics() {
  const { timeZone } = useFormat()
  const { t, dir } = useAnalyticsText()
  const maxMonth = currentMonth(timeZone)
  const [month, setMonth] = useState(maxMonth)
  const { comparison, trend, categories, daily, currencies, currency, setCurrency, range } = useAnalytics(month)

  // Currencies of this month that are not the selected one; their amounts are never mixed into the figures
  const others = currencies.filter((c) => c !== currency)

  return (
    <div className="analytics" dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'}>
      <AnalyticsHeader
        month={month}
        maxMonth={maxMonth}
        onPrev={() => setMonth((m) => shiftMonth(m, -1))}
        onNext={() => setMonth((m) => (m < maxMonth ? shiftMonth(m, 1) : m))}
        currencies={currencies}
        currency={currency}
        onCurrency={setCurrency}
      />
      {others.length > 0 && (
        <p className="analytics-note" role="note">
          {t.otherCurrencies(others.join(', '), currency)}
        </p>
      )}
      <KpiCards comparison={comparison} trend={trend} currency={currency} month={month} />
      <TrendChart state={trend} currency={currency} />
      <div className="analytics-grid">
        <CategoryBreakdown state={categories} comparison={comparison} currency={currency} range={range} />
        <div className="analytics-col">
          <SpendingHeatmap state={daily} currency={currency} timeZone={timeZone} />
          <WeekdayPattern state={daily} currency={currency} timeZone={timeZone} />
        </div>
      </div>
    </div>
  )
}
