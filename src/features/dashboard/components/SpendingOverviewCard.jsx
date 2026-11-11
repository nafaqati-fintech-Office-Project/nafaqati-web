import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DashCard, { Sk } from './DashCard.jsx'
import { useFormat } from '../../../hooks/useFormat.js'
import { APP_TEXT } from '../../../constants/appText.js'
import { formatShortK } from '../../../utils/format.js'

const COLORS = { expenses: '#7B3FF2', stroke: '#1E6BFF' }

function ChartTooltip({ active, payload, label }) {
  const { money } = useFormat()
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      <div className="chart-tip-row">
        <span className="legend-dot" style={{ background: COLORS.stroke }} />
        {APP_TEXT.dashboard.spending.expenses}
        <span className="num">{money(payload[0].value)}</span>
      </div>
    </div>
  )
}

// Round the top of the y-axis up to a "nice" step so ticks read 0, 1K, 2K ...
function niceAxis(max) {
  if (max <= 0) return { top: 100, ticks: [0, 25, 50, 75, 100] }
  const rough = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)
  return { top: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) }
}

// data: { points: [{ label, day ('YYYY-MM-DD'), expenses }], ticks: [label], total } built from GET /api/reports/daily-spending
export default function SpendingOverviewCard({ data, state, onAdd, onSelectDay }) {
  const { money } = useFormat()
  const t = APP_TEXT.dashboard.spending
  const axis = niceAxis(Math.max(0, ...(data?.points ?? []).map((p) => p.expenses)))
  const empty = data && data.total === 0

  return (
    <DashCard
      title={t.title}
      className="spend"
      state={state}
      empty={empty ? { title: t.emptyTitle, body: t.emptyBody, cta: { label: t.emptyCta, onClick: onAdd } } : null}
      skeleton={<Sk h={260} r={12} />}
    >
      {data && !empty && (
        <>
          <ul className="chart-legend">
            <li>
              <span className="legend-dot" style={{ background: COLORS.stroke }} />
              {t.expenses}
            </li>
          </ul>
          <div
            className={`chart-box${onSelectDay ? ' chart-clickable' : ''}`}
            role="img"
            aria-label={t.summary(money(data.total))}
            title={onSelectDay ? t.clickHint : undefined}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={data.points}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                onClick={
                  onSelectDay
                    ? (e) => {
                        const day = e?.activePayload?.[0]?.payload?.day ?? data.points[Number(e?.activeTooltipIndex)]?.day
                        if (day) onSelectDay(day)
                      }
                    : undefined
                }
              >
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.stroke} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={COLORS.expenses} stopOpacity={0.06} />
                  </linearGradient>
                  <linearGradient id="spendStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.stroke} />
                    <stop offset="100%" stopColor={COLORS.expenses} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8edf6" vertical={false} />
                <XAxis dataKey="label" ticks={data.ticks} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={0} />
                <YAxis
                  domain={[0, axis.top]}
                  ticks={axis.ticks}
                  tickFormatter={formatShortK}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="expenses" stroke="url(#spendStroke)" strokeWidth={3} fill="url(#spendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </DashCard>
  )
}
