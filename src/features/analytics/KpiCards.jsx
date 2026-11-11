import { ArrowDown, ArrowUp, CircleAlert, PiggyBank, Percent, ShoppingBag, Wallet } from 'lucide-react'
import { Sk } from './SectionCard.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import { deltaTone, forCurrency, money, pct } from './analyticsUtils.js'
import { previousMonth } from '../../utils/dateRange.js'
import './KpiCards.css'

// One KPI: label, value and the change vs the previous month. `change` null = unknown ("-").
function Kpi({ icon: Icon, tone, label, state, value, change, changeText, lowerIsBetter, onRetry }) {
  const { t } = useAnalyticsText()
  const direction = deltaTone(change, { lowerIsBetter })
  return (
    <section className="kpi" aria-busy={state.loading} aria-label={label}>
      <span className={`kpi-icon kpi-${tone}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="kpi-text">
        <span className="kpi-label">{label}</span>
        {state.loading && (
          <>
            <Sk w="70%" h={22} />
            <Sk w="55%" h={12} />
          </>
        )}
        {state.error && (
          <button type="button" className="kpi-retry" onClick={onRetry}>
            <CircleAlert size={14} aria-hidden="true" /> {t.retry}
          </button>
        )}
        {!state.loading && !state.error && (
          <>
            <strong className="kpi-value num">{value}</strong>
            <span className={`kpi-delta kpi-${direction}`}>
              {change != null && change !== 0 && (change > 0 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />)}
              <span className="num">{change == null ? t.kpi.noChange : changeText}</span>
              {change != null && <span className="kpi-vs">{t.kpi.fromLast}</span>}
            </span>
          </>
        )}
      </div>
    </section>
  )
}

// Share of income kept (ratio), null without income
const rateOf = (totals) => (totals && Number(totals.totalIncome) > 0 ? Number(totals.net) / Number(totals.totalIncome) : null)

// Income, Expenses, Net savings (from the comparison) and Savings rate: from monthly-trend for a calendar month,
// from the period's own totals for a custom range (`month` null)
export default function KpiCards({ comparison, trend, currency, month }) {
  const { t } = useAnalyticsText()
  const entry = forCurrency(comparison.data, currency)
  const cur = entry?.current
  const delta = entry?.delta
  const changeOf = (d) => (d ? d.percent : null) // percent is null when the previous month is 0

  const months = forCurrency(trend.data, currency)?.months ?? []
  const rate = month ? (months.find((m) => m.month === month)?.savingsRate ?? null) : rateOf(entry?.current)
  const prevRate = month ? (months.find((m) => m.month === previousMonth(month))?.savingsRate ?? null) : rateOf(entry?.previous)
  const rateState = month ? trend : comparison
  const rateChange = rate != null && prevRate != null ? (rate - prevRate) * 100 : null // percentage points

  const amount = (value) => money(value ?? 0, currency)
  const percentText = (c) => (c == null ? '' : pct(c))

  return (
    <div className="kpi-row">
      <Kpi icon={Wallet} tone="green" label={t.kpi.income} state={comparison} onRetry={comparison.retry}
        value={amount(cur?.totalIncome)} change={changeOf(delta?.totalIncome)} changeText={percentText(changeOf(delta?.totalIncome))} />
      <Kpi icon={ShoppingBag} tone="red" label={t.kpi.expenses} state={comparison} onRetry={comparison.retry} lowerIsBetter
        value={amount(cur?.totalExpenses)} change={changeOf(delta?.totalExpenses)} changeText={percentText(changeOf(delta?.totalExpenses))} />
      <Kpi icon={PiggyBank} tone="blue" label={t.kpi.net} state={comparison} onRetry={comparison.retry}
        value={amount(cur?.net)} change={changeOf(delta?.net)} changeText={percentText(changeOf(delta?.net))} />
      <Kpi icon={Percent} tone="purple" label={t.kpi.rate} state={rateState} onRetry={rateState.retry}
        value={rate == null ? t.kpi.noChange : pct(rate * 100)} change={rateChange} changeText={rateChange == null ? '' : `${Math.abs(Math.round(rateChange * 10) / 10)} ${t.kpi.points}`} />
    </div>
  )
}
