import { ArrowDown, ArrowUp } from 'lucide-react'
import SectionCard, { Sk } from '../analytics/SectionCard.jsx'
import { deltaTone, forCurrency, money, monthLabel, pct } from '../analytics/analyticsUtils.js'
import { categoryColor } from '../../config/categoryVisuals.js'
import { useCategories } from '../../hooks/useCategories.js'
import { MERCHANT_ROW_CAP } from '../../hooks/useReports.js'
import { useReportsText } from './useReportsText.js'
import { averagePerDay, biggestExpense, categoryRows, daysCounted, lifestyleShares, merchantTotals, savingsRatePercent } from './reportUtils.js'

const GROUP_COLOR = { essentials: '#1e6bff', lifestyle: '#7b3ff2', other: '#f59e0b' }
const lines = (n) => Array.from({ length: n }, (_, i) => <Sk key={i} h={16} />)

// A change vs last month: arrow, and a colour that says whether it is good news (null = nothing to compare)
function Change({ value, lowerIsBetter = false }) {
  const tone = deltaTone(value, { lowerIsBetter })
  return (
    <span className={`rp-change rp-${tone}`}>
      {value != null && value !== 0 && (value > 0 ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
      <span className="num">{value == null ? '-' : pct(value)}</span>
    </span>
  )
}

// Monthly spending report: the month at a glance
export function SummarySection({ comparison, expenses, currency, month, today }) {
  const { t } = useReportsText()
  const entry = forCurrency(comparison.data, currency)
  const cur = entry?.current
  const rows = (expenses.data?.items ?? []).filter((i) => i.currency === currency)
  const biggest = biggestExpense(rows, currency)
  const empty = comparison.data && !cur?.totalExpenses && !cur?.totalIncome
  const avg = averagePerDay(cur?.totalExpenses ?? 0, daysCounted(month, today))
  const tiles = [
    [t.summary.spent, money(cur?.totalExpenses ?? 0, currency), true],
    [t.summary.income, money(cur?.totalIncome ?? 0, currency)],
    [t.summary.net, money(cur?.net ?? 0, currency)],
    [t.summary.avgDaily, money(avg, currency)],
    ...(expenses.data ? [[t.summary.transactions, String(rows.length)]] : []),
    ...(biggest ? [[`${t.summary.biggest} (${biggest.merchant.name})`, money(biggest.amount, currency)]] : []),
  ]

  return (
    <SectionCard
      title={t.summary.title}
      className="rp-wide"
      state={comparison}
      skeleton={lines(3)}
      empty={empty ? { title: t.summary.emptyTitle, body: t.summary.emptyBody } : null}
    >
      <dl className="rp-tiles">
        {tiles.map(([label, value, hero]) => (
          <div key={label} className={hero ? 'rp-tile rp-hero' : 'rp-tile'}>
            <dt>{label}</dt>
            <dd className="num">{value}</dd>
          </div>
        ))}
      </dl>
      {expenses.data?.capped && <p className="rp-note">{t.summary.partial(MERCHANT_ROW_CAP)}</p>}
    </SectionCard>
  )
}

// Category analysis: every category with its amount and share
export function CategorySection({ comparison, currency }) {
  const { t } = useReportsText()
  const { nameOf } = useCategories()
  const entry = forCurrency(comparison.data, currency)
  const rows = categoryRows(entry?.current?.categories)
  const empty = comparison.data && rows.length === 0

  return (
    <SectionCard
      title={t.categories.title}
      state={comparison}
      skeleton={lines(5)}
      empty={empty ? { title: t.categories.emptyTitle, body: t.categories.emptyBody } : null}
    >
      <ul className="rp-list">
        {rows.map((r) => {
          const name = r.code ? nameOf(r.code) : r.label
          return (
            <li key={r.code ?? r.label} aria-label={t.categories.row(name, money(r.amount, currency), r.percent)}>
              <div className="rp-line">
                <span>{name}</span>
                <span className="num">{`${money(r.amount, currency)} · ${r.percent}%`}</span>
              </div>
              <div className="rp-track">
                <span style={{ width: `${r.percent}%`, background: categoryColor(r.code) }} />
              </div>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

// Merchant analysis: top shops of the month
export function MerchantSection({ expenses, currency }) {
  const { t } = useReportsText()
  const { nameOf } = useCategories()
  const rows = merchantTotals(expenses.data?.items, currency)
  const empty = expenses.data && rows.length === 0

  return (
    <SectionCard
      title={t.merchants.title}
      subtitle={t.merchants.subtitle}
      state={expenses}
      skeleton={lines(5)}
      empty={empty ? { title: t.merchants.emptyTitle, body: t.merchants.emptyBody } : null}
    >
      <ol className="rp-merchants">
        {rows.map((r, i) => (
          <li key={r.name}>
            <span className="rp-rank">{i + 1}</span>
            <span className="rp-merchant">
              {r.name}
              <small>{`${r.categoryId ? nameOf(r.categoryId) : ''} · ${t.merchants.payments(r.count)}`}</small>
            </span>
            <span className="num">{money(r.amount, currency)}</span>
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

// Lifestyle spending: needs against wants
export function LifestyleSection({ comparison, currency }) {
  const { t } = useReportsText()
  const entry = forCurrency(comparison.data, currency)
  const shares = lifestyleShares(entry?.current?.categories)
  const empty = comparison.data && shares.every((s) => s.percent === 0)

  return (
    <SectionCard
      title={t.lifestyle.title}
      subtitle={t.lifestyle.subtitle}
      state={comparison}
      skeleton={lines(3)}
      empty={empty ? { title: t.lifestyle.emptyTitle, body: t.lifestyle.emptyBody } : null}
    >
      <div className="rp-split" dir="ltr" aria-hidden="true">
        {shares.filter((s) => s.percent > 0).map((s) => (
          <span key={s.group} style={{ flex: s.percent, background: GROUP_COLOR[s.group] }} />
        ))}
      </div>
      <ul className="rp-list">
        {shares.map((s) => (
          <li key={s.group} className="rp-line">
            <span className="rp-legend">
              <i style={{ background: GROUP_COLOR[s.group] }} />
              {t.lifestyle[s.group]}
            </span>
            <span className="num">{`${money(s.amount, currency)} · ${s.percent}%`}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

// Savings: what was kept and how it compares with last month
export function SavingsSection({ comparison, currency }) {
  const { t } = useReportsText()
  const entry = forCurrency(comparison.data, currency)
  const net = entry?.current?.net ?? 0
  const rate = savingsRatePercent(entry?.current?.totalIncome ?? 0, net)
  const summary = rate === null ? t.savings.noIncome : net >= 0 ? t.savings.kept(rate) : t.savings.over(Math.abs(rate))

  return (
    <SectionCard title={t.savings.title} state={comparison} skeleton={lines(3)}>
      <div className="rp-line">
        <strong className={`rp-big num ${net >= 0 ? 'rp-good' : 'rp-bad'}`}>{money(net, currency)}</strong>
        <Change value={entry?.delta?.net?.percent ?? null} />
      </div>
      <p className="rp-note">{summary}</p>
      <div className="rp-line">
        <span>{t.savings.lastMonth}</span>
        <span className="num">{money(entry?.previous?.net ?? 0, currency)}</span>
      </div>
    </SectionCard>
  )
}

// Comparative monthly report: this month against last, plus the last months of spending
export function ComparisonSection({ comparison, trend, currency, locale }) {
  const { t } = useReportsText()
  const entry = forCurrency(comparison.data, currency)
  const rows = [
    ['income', t.summary.income, 'totalIncome', false],
    ['expenses', t.summary.spent, 'totalExpenses', true],
    ['net', t.summary.net, 'net', false],
  ]
  const months = forCurrency(trend.data, currency)?.months ?? []
  const peak = Math.max(0, ...months.map((m) => Number(m.totalExpenses)))

  return (
    <SectionCard title={t.comparison.title} className="rp-wide" state={comparison} skeleton={lines(4)}>
      <table className="rp-table">
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">{t.comparison.thisMonth}</th>
            <th scope="col">{t.comparison.lastMonth}</th>
            <th scope="col">{t.comparison.change}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, label, field, lowerIsBetter]) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              <td className="num">{money(entry?.current?.[field] ?? 0, currency)}</td>
              <td className="num">{money(entry?.previous?.[field] ?? 0, currency)}</td>
              <td>
                <Change value={entry?.delta?.[field]?.percent ?? null} lowerIsBetter={lowerIsBetter} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="rp-sub">{t.comparison.trend(months.length || 6)}</h3>
      {trend.loading ? (
        <div className="rp-bars">{lines(1)}</div>
      ) : trend.error ? (
        <div className="rp-note">
          {t.comparison.trendUnavailable}{' '}
          <button type="button" className="an-retry" onClick={trend.retry}>
            {t.retry}
          </button>
        </div>
      ) : (
        <div className="rp-bars" dir="ltr" role="img" aria-label={months.map((m) => `${monthLabel(m.month, locale, { month: 'long' })} ${money(m.totalExpenses, currency)}`).join(', ')}>
          {months.map((m) => (
            <div key={m.month} className="rp-bar">
              <div className="rp-bar-track">
                <span style={{ height: `${peak > 0 ? Math.max((Number(m.totalExpenses) / peak) * 100, Number(m.totalExpenses) > 0 ? 4 : 0) : 0}%` }} title={money(m.totalExpenses, currency)} />
              </div>
              <small>{monthLabel(m.month, locale, { month: 'short' })}</small>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
