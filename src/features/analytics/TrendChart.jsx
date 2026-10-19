import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SectionCard, { Sk } from './SectionCard.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import { forCurrency, money, monthLabel, pct } from './analyticsUtils.js'
import { formatShortK } from '../../utils/format.js'
import './TrendChart.css'

const COLORS = { income: '#16A34A', expenses: '#7B3FF2', rate: '#1E6BFF' }

function TrendTooltip({ active, payload, currency, t }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="an-tip">
      <strong>{point.longLabel}</strong>
      <div><span className="an-dot" style={{ background: COLORS.income }} />{t.trend.income}<b className="num">{money(point.income, currency)}</b></div>
      <div><span className="an-dot" style={{ background: COLORS.expenses }} />{t.trend.expenses}<b className="num">{money(point.expenses, currency)}</b></div>
      <div><span className="an-dot" style={{ background: COLORS.rate }} />{t.trend.rate}<b className="num">{point.rate == null ? '-' : pct(point.rate)}</b></div>
    </div>
  )
}

// Income vs expenses per month (bars) and the savings rate (line, right axis) from GET /api/reports/monthly-trend
export default function TrendChart({ state, currency }) {
  const { t, locale, dir } = useAnalyticsText()
  const months = forCurrency(state.data, currency)?.months ?? []
  const points = months.map((m) => ({
    label: monthLabel(m.month, locale, { month: 'short' }),
    longLabel: monthLabel(m.month, locale, { month: 'long', year: 'numeric' }),
    income: Number(m.totalIncome),
    expenses: Number(m.totalExpenses),
    rate: m.savingsRate == null ? null : Number(m.savingsRate) * 100, // ratio -> percent
  }))
  const empty = state.data && points.every((p) => p.income === 0 && p.expenses === 0)

  return (
    <SectionCard
      title={t.trend.title}
      subtitle={t.trend.subtitle}
      className="an-trend"
      state={state}
      skeleton={<Sk h={280} r={12} />}
      empty={empty ? { title: t.trend.emptyTitle, body: t.trend.emptyBody } : null}
    >
      <ul className="an-legend">
        <li><span className="an-dot" style={{ background: COLORS.income }} />{t.trend.income}</li>
        <li><span className="an-dot" style={{ background: COLORS.expenses }} />{t.trend.expenses}</li>
        <li><span className="an-dot" style={{ background: COLORS.rate }} />{t.trend.rate}</li>
      </ul>
      <div className="an-chart" dir="ltr" role="img" aria-label={t.trend.summary(currency)}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={points} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="#e8edf6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} reversed={dir === 'rtl'} />
            <YAxis yAxisId="amount" tickFormatter={formatShortK} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={44} orientation={dir === 'rtl' ? 'right' : 'left'} />
            <YAxis yAxisId="rate" orientation={dir === 'rtl' ? 'left' : 'right'} tickFormatter={(v) => `${Math.round(v)}%`} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<TrendTooltip currency={currency} t={t} />} cursor={{ fill: 'rgba(30,107,255,0.06)' }} />
            <Bar yAxisId="amount" dataKey="income" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar yAxisId="amount" dataKey="expenses" fill={COLORS.expenses} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Line yAxisId="rate" dataKey="rate" stroke={COLORS.rate} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}
