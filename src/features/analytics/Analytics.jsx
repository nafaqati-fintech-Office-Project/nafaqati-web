import { useSearchParams } from 'react-router-dom'
import { useAnalytics } from '../../hooks/useAnalytics.js'
import { useFormat } from '../../hooks/useFormat.js'
import { currentMonthPeriod, periodFromParams, wholeMonth } from '../../utils/period.js'
import AnalyticsHeader from './AnalyticsHeader.jsx'
import KpiCards from './KpiCards.jsx'
import TrendChart from './TrendChart.jsx'
import CategoryBreakdown from './CategoryBreakdown.jsx'
import SpendingHeatmap from './SpendingHeatmap.jsx'
import WeekdayPattern from './WeekdayPattern.jsx'
import { AnalyticsRangeContext, useAnalyticsText } from './useAnalyticsText.js'
import './Analytics.css'

// The period lives in the URL (?from=&to=), so Back from a drill-down keeps it; default: this month
export default function Analytics() {
  const { timeZone } = useFormat()
  const [params, setParams] = useSearchParams()
  const period = periodFromParams(params, currentMonthPeriod(timeZone))
  const onPeriod = (next) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.set('from', next.from)
        p.set('to', next.to)
        return p
      },
      { replace: true },
    )
  return (
    <AnalyticsRangeContext.Provider value={!wholeMonth(period)}>
      <AnalyticsPage period={period} onPeriod={onPeriod} timeZone={timeZone} />
    </AnalyticsRangeContext.Provider>
  )
}

function AnalyticsPage({ period, onPeriod, timeZone }) {
  const { t, dir } = useAnalyticsText()
  const { comparison, trend, categories, daily, currencies, currency, setCurrency, range, month } = useAnalytics(period)

  // Currencies of this period that are not the selected one; their amounts are never mixed into the figures
  const others = currencies.filter((c) => c !== currency)

  return (
    <div className="analytics" dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'}>
      <AnalyticsHeader
        period={period}
        onPeriod={onPeriod}
        timeZone={timeZone}
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
