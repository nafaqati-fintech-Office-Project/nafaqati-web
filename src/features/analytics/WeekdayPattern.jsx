import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SectionCard, { Sk } from './SectionCard.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import { forCurrency, money, weekdayIndex, weekdayNames } from './analyticsUtils.js'
import { formatShortK } from '../../utils/format.js'
import { todayKey } from '../../utils/dateRange.js'
import './WeekdayPattern.css'

// Average spend per weekday, computed from daily-spending: for each weekday, the month's spending on that weekday
// divided by how many such days have passed (days after today are left out, so a running month is not diluted).
export default function WeekdayPattern({ state, currency, timeZone }) {
  const { t, locale, dir } = useAnalyticsText()
  const days = forCurrency(state.data, currency)?.days ?? []
  const today = todayKey(timeZone)
  const sums = Array(7).fill(0)
  const counts = Array(7).fill(0)
  days
    .filter((d) => d.date <= today)
    .forEach((d) => {
      const i = weekdayIndex(d.date)
      sums[i] += Number(d.total)
      counts[i] += 1
    })
  const points = weekdayNames(locale).map((name, i) => ({ name, average: counts[i] ? sums[i] / counts[i] : 0 }))
  const top = Math.max(...points.map((p) => p.average))

  return (
    <SectionCard
      title={t.weekday.title}
      subtitle={t.weekday.subtitle}
      className="an-weekday"
      state={state}
      skeleton={<Sk h={200} r={12} />}
      empty={state.data && top === 0 ? { title: t.weekday.emptyTitle, body: t.weekday.emptyBody } : null}
    >
      <div className="an-weekday-chart" dir="ltr">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={points} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} reversed={dir === 'rtl'} />
            <YAxis
              tickFormatter={formatShortK}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={44}
              orientation={dir === 'rtl' ? 'right' : 'left'}
            />
            <Tooltip
              cursor={{ fill: 'rgba(30,107,255,0.06)' }}
              formatter={(value) => [money(value, currency), t.weekday.average]}
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(15,27,61,0.18)', fontSize: 12 }}
            />
            <Bar dataKey="average" radius={[6, 6, 0, 0]} maxBarSize={28}>
              {points.map((p) => (
                <Cell key={p.name} fill={p.average === top ? '#1E6BFF' : '#9BC0FF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}
