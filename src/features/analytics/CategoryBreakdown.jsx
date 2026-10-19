import { ArrowDown, ArrowUp } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { useNavigate } from 'react-router-dom'
import SectionCard, { Sk } from './SectionCard.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import { deltaTone, forCurrency, money, pct, transactionsUrl } from './analyticsUtils.js'
import { categoryColor } from '../../config/categoryVisuals.js'
import { useCategories } from '../../hooks/useCategories.js'
import './CategoryBreakdown.css'

const SIZE = 200

// Donut + ranked list from spending-summary; the change vs last month comes from monthly-comparison (delta.categories).
// Clicking a row opens /transactions filtered by that category and the month's date range.
export default function CategoryBreakdown({ state, comparison, currency, range }) {
  const { t } = useAnalyticsText()
  const { nameOf } = useCategories()
  const navigate = useNavigate()
  const entry = forCurrency(state.data, currency)
  const items = (entry?.categories ?? []).map((c) => ({
    code: c.categoryCode,
    key: c.categoryCode ?? c.category,
    name: c.categoryCode ? nameOf(c.categoryCode) : c.category,
    amount: Number(c.total),
    percent: Number(c.percentage),
    count: c.count,
  }))
  const deltas = new Map((forCurrency(comparison.data, currency)?.delta?.categories ?? []).map((d) => [d.categoryCode, d.percent]))
  const empty = state.data && items.length === 0
  const open = (code) => navigate(transactionsUrl({ code, from: range.from, to: range.to }))

  return (
    <SectionCard
      title={t.categories.title}
      className="an-cats"
      state={state}
      skeleton={
        <>
          <Sk w={SIZE} h={SIZE} r={SIZE / 2} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk key={i} h={16} />
          ))}
        </>
      }
      empty={empty ? { title: t.categories.emptyTitle, body: t.categories.emptyBody } : null}
    >
      {entry && (
        <div className="an-cats-body">
          <div
            className="an-donut"
            dir="ltr"
            role="img"
            aria-label={t.categories.summary(items.map((i) => `${i.name} ${pct(i.percent)} ${money(i.amount, currency)}`).join(', '))}
          >
            <PieChart width={SIZE} height={SIZE}>
              <Pie data={items} dataKey="amount" innerRadius={66} outerRadius={94} paddingAngle={2} cornerRadius={4} stroke="none" startAngle={90} endAngle={-270}>
                {items.map((i) => (
                  <Cell key={i.key} fill={categoryColor(i.code)} />
                ))}
              </Pie>
            </PieChart>
            <div className="an-donut-center">
              <strong className="num">{money(entry.totalSpent, currency)}</strong>
              <span>{t.categories.total}</span>
            </div>
          </div>
          <ul className="an-cat-list">
            {items.map((i) => {
              const change = deltas.get(i.code)
              return (
                <li key={i.key}>
                  <button type="button" onClick={() => open(i.code)} disabled={!i.code} aria-label={t.categories.open(i.name)}>
                    <span className="an-dot" style={{ background: categoryColor(i.code) }} />
                    <span className="an-cat-name">
                      {i.name}
                      <small>{t.categories.transactions(i.count)}</small>
                    </span>
                    <span className={`an-cat-change an-${deltaTone(change, { lowerIsBetter: true })}`} title={t.categories.vsLast}>
                      {change != null && change !== 0 && (change > 0 ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
                      <span className="num">{change == null ? '-' : pct(change)}</span>
                    </span>
                    <span className="an-cat-pct num">{pct(i.percent)}</span>
                    <span className="an-cat-amount num">{money(i.amount, currency)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </SectionCard>
  )
}
