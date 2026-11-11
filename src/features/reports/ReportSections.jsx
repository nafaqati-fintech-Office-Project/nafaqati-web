import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import SectionCard, { Sk } from '../analytics/SectionCard.jsx'
import { deltaTone, forCurrency, money, monthLabel, pct } from '../analytics/analyticsUtils.js'
import { categoryColor } from '../../config/categoryVisuals.js'
import { useCategories } from '../../hooks/useCategories.js'
import { MERCHANT_ROW_CAP } from '../../hooks/useReports.js'
import { useReportsText } from './useReportsText.js'
import { daysSoFar } from '../../utils/period.js'
import { clickableProps } from '../../utils/transactionLinks.js'
import {
  averagePerDay,
  biggestExpense,
  categoryRows,
  debtSummary,
  lifestyleGroup,
  lifestyleShares,
  merchantTotals,
  moneyMovement,
  paymentMethods,
  savingsRatePercent,
  spendingItems,
  weeklySpending,
} from './reportUtils.js'

const GROUP_COLOR = { essentials: '#1e6bff', lifestyle: '#7b3ff2', other: '#f59e0b' }
const lines = (n) => Array.from({ length: n }, (_, i) => <Sk key={i} h={16} />)
const TRANSFERS = 'TRANSFERS'
const CASH = 'CASH_WITHDRAWALS'
const LOANS = 'LOANS_EMI'

// Props that make a card/row/bar open its transactions; `what` names it for screen readers and the tooltip
function useDrill(open) {
  const { t } = useReportsText()
  return (filters, what) => clickableProps(open && (() => open(filters)), t.drill.open(what))
}

const pad2 = (n) => String(n).padStart(2, '0')
const addDaysKey = (key, days) => {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

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
export function SummarySection({ comparison, expenses, currency, period, timeZone, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const entry = forCurrency(comparison.data, currency)
  const cur = entry?.current
  // Money moved between the person's own accounts is not spending
  const rows = spendingItems(expenses.data?.items).filter((i) => i.currency === currency)
  const biggest = biggestExpense(rows, currency)
  const empty = comparison.data && !cur?.totalExpenses && !cur?.totalIncome
  // Spread over the period's days so far (a running month or a range ending today is not diluted)
  const avg = averagePerDay(cur?.totalExpenses ?? 0, daysSoFar(period, timeZone))
  const tiles = [
    [t.summary.spent, money(cur?.totalExpenses ?? 0, currency), true, { type: 'expense' }],
    [t.summary.income, money(cur?.totalIncome ?? 0, currency), false, { type: 'income' }],
    [t.summary.net, money(cur?.net ?? 0, currency), false, {}],
    [t.summary.avgDaily, money(avg, currency), false, { type: 'expense' }],
    ...(expenses.data ? [[t.summary.transactions, String(rows.length), false, { type: 'expense' }]] : []),
    ...(biggest
      ? [[`${t.summary.biggest} (${biggest.merchant.name})`, money(biggest.amount, currency), false, { type: 'expense', q: biggest.merchant.name }]]
      : []),
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
        {tiles.map(([label, value, hero, filters]) => (
          <div key={label} className={hero ? 'rp-tile rp-hero' : 'rp-tile'} {...drill(filters, label)}>
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
export function CategorySection({ comparison, currency, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
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
            <li
              key={r.code ?? r.label}
              aria-label={t.categories.row(name, money(r.amount, currency), r.percent)}
              {...(r.code ? drill({ type: 'expense', category: r.code }, name) : {})}
            >
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
export function MerchantSection({ expenses, currency, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const { nameOf } = useCategories()
  const rows = merchantTotals(spendingItems(expenses.data?.items), currency)
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
          <li key={r.name} {...drill({ type: 'expense', q: r.name }, r.name)}>
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

// Weekly report: everyday spending week by week, so a heavy week stands out
export function WeeklySection({ expenses, currency, period, timeZone, locale, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const monthFirst = period.from
  const monthLast = period.to
  // Only the week's days inside the period, the same days its total counts
  const weekRange = (start) => {
    const end = addDaysKey(start, 6)
    return { from: start < monthFirst ? monthFirst : start, to: end > monthLast ? monthLast : end }
  }
  const weeks = weeklySpending(spendingItems(expenses.data?.items), currency, period, timeZone)
  const peak = Math.max(0, ...weeks.map((w) => w.amount)) // bar scale only
  const label = (start) => new Date(`${start}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', month: 'short', day: 'numeric' })
  const empty = expenses.data && weeks.length === 0

  return (
    <SectionCard
      title={t.weekly.title}
      subtitle={t.weekly.subtitle}
      state={expenses}
      skeleton={lines(4)}
      empty={empty ? { title: t.weekly.emptyTitle, body: t.weekly.emptyBody } : null}
    >
      <ul className="rp-list">
        {weeks.map((w) => (
          <li
            key={w.start}
            aria-label={t.weekly.row(label(w.start), money(w.amount, currency))}
            {...drill({ type: 'expense', ...weekRange(w.start) }, label(w.start))}
          >
            <div className="rp-line">
              <span>{`${label(w.start)}${w.partial ? ' *' : ''}`}</span>
              <span className="num">{money(w.amount, currency)}</span>
            </div>
            <div className="rp-track">
              <span style={{ width: `${peak > 0 ? Math.max((w.amount / peak) * 100, 2) : 0}%`, background: '#1e6bff' }} />
            </div>
          </li>
        ))}
      </ul>
      {weeks.some((w) => w.partial) && <p className="rp-note">{`* ${t.weekly.partialWeek}`}</p>}
    </SectionCard>
  )
}

// How it was paid: everyday spending by card
export function PaymentMethodsSection({ expenses, currency, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const rows = paymentMethods(spendingItems(expenses.data?.items), currency)
  const empty = expenses.data && rows.length === 0

  return (
    <SectionCard
      title={t.methods.title}
      subtitle={t.methods.subtitle}
      state={expenses}
      skeleton={lines(3)}
      empty={empty ? { title: t.methods.emptyTitle, body: t.methods.emptyBody } : null}
    >
      <ul className="rp-list">
        {rows.map((r) => (
          <li key={r.card ?? 'other'} {...(r.card ? drill({ type: 'expense', card: r.card }, t.methods.card(r.card)) : {})}>
            <div className="rp-line">
              <span>{r.card ? t.methods.card(r.card) : t.methods.other}</span>
              <span className="num">{`${money(r.amount, currency)} · ${r.percent}%`}</span>
            </div>
            <div className="rp-track">
              <span style={{ width: `${r.percent}%`, background: '#7b3ff2' }} />
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

// Money movement: everyday spending, transfers to others and cash out, against what came in
export function MovementSection({ comparison, currency, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const entry = forCurrency(comparison.data, currency)
  const m = moneyMovement(entry?.current?.categories, entry?.current?.totalExpenses, entry?.current?.totalIncome)
  const rows = [
    [t.movement.dayToDay, m.dayToDay, { type: 'expense' }],
    [t.movement.transfers, m.transfers, { type: 'expense', category: TRANSFERS }],
    [t.movement.cash, m.cash, { type: 'expense', category: CASH }],
    [t.movement.income, m.income, { type: 'income' }],
  ]

  return (
    <SectionCard title={t.movement.title} state={comparison} skeleton={lines(4)}>
      <ul className="rp-list">
        {rows.map(([label, value, filters]) => (
          <li key={label} className="rp-line" {...drill(filters, label)}>
            <span>{label}</span>
            <span className="num">{money(value, currency)}</span>
          </li>
        ))}
      </ul>
      <p className="rp-note">{t.movement.note}</p>
    </SectionCard>
  )
}

// Debt report: what went to loans and instalments
export function DebtSection({ comparison, currency, open }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const entry = forCurrency(comparison.data, currency)
  const d = debtSummary(entry?.current?.categories, entry?.current?.totalExpenses, entry?.current?.totalIncome)
  const none = d.loans <= 0

  return (
    <SectionCard title={t.debt.title} state={comparison} skeleton={lines(3)}>
      <strong className="rp-big num" {...drill({ type: 'expense', category: LOANS }, t.debt.title)}>
        {money(d.loans, currency)}
      </strong>
      {none ? (
        <p className="rp-note">{t.debt.none}</p>
      ) : (
        <ul className="rp-list">
          {d.percentOfIncome !== null && (
            <li className="rp-line">
              <span>{t.debt.ofIncome}</span>
              <span className="num">{`${d.percentOfIncome}%`}</span>
            </li>
          )}
          <li className="rp-line">
            <span>{t.debt.ofSpending}</span>
            <span className="num">{`${d.percentOfSpending}%`}</span>
          </li>
        </ul>
      )}
    </SectionCard>
  )
}

// Lifestyle spending: needs against wants
export function LifestyleSection({ comparison, currency, open }) {
  const { t } = useReportsText()
  const { nameOf } = useCategories()
  const drill = useDrill(open)
  const [expanded, setExpanded] = useState(null)
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
        {shares.map((s) => {
          const members = categoryRows(entry?.current?.categories).filter((r) => r.code && lifestyleGroup(r.code) === s.group)
          const isOpen = expanded === s.group
          return (
            <li key={s.group}>
              <div
                className="rp-line"
                {...(open && members.length > 0
                  ? {
                      ...clickableProps(() => setExpanded(isOpen ? null : s.group), t.lifestyle[s.group]),
                      'aria-expanded': isOpen,
                    }
                  : {})}
              >
                <span className="rp-legend">
                  <i style={{ background: GROUP_COLOR[s.group] }} />
                  {t.lifestyle[s.group]}
                  {open && members.length > 0 && <ChevronDown size={14} className={`rp-chevron${isOpen ? ' rp-open' : ''}`} aria-hidden="true" />}
                </span>
                <span className="num">{`${money(s.amount, currency)} · ${s.percent}%`}</span>
              </div>
              {isOpen && (
                <ul className="rp-sublist">
                  {members.map((r) => (
                    <li key={r.code} className="rp-line" {...drill({ type: 'expense', category: r.code }, nameOf(r.code))}>
                      <span>{nameOf(r.code)}</span>
                      <span className="num">{money(r.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

// Savings: what was kept and how it compares with last month
export function SavingsSection({ comparison, currency, open, previous }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const entry = forCurrency(comparison.data, currency)
  const net = entry?.current?.net ?? 0
  const rate = savingsRatePercent(entry?.current?.totalIncome ?? 0, net)
  const summary = rate === null ? t.savings.noIncome : net >= 0 ? t.savings.kept(rate) : t.savings.over(Math.abs(rate))

  return (
    <SectionCard title={t.savings.title} state={comparison} skeleton={lines(3)}>
      <div className="rp-line">
        <strong className={`rp-big num ${net >= 0 ? 'rp-good' : 'rp-bad'}`} {...drill({}, t.savings.title)}>
          {money(net, currency)}
        </strong>
        <Change value={entry?.delta?.net?.percent ?? null} />
      </div>
      <p className="rp-note">{summary}</p>
      <div className="rp-line" {...drill({ from: previous.from, to: previous.to }, t.savings.lastMonth)}>
        <span>{t.savings.lastMonth}</span>
        <span className="num">{money(entry?.previous?.net ?? 0, currency)}</span>
      </div>
    </SectionCard>
  )
}

// Comparative monthly report: this month against last, plus the last months of spending
export function ComparisonSection({ comparison, trend, currency, locale, open, previous }) {
  const { t } = useReportsText()
  const drill = useDrill(open)
  const entry = forCurrency(comparison.data, currency)
  const rows = [
    ['income', t.summary.income, 'totalIncome', false, { type: 'income' }],
    ['expenses', t.summary.spent, 'totalExpenses', true, { type: 'expense' }],
    ['net', t.summary.net, 'net', false, {}],
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
          {rows.map(([key, label, field, lowerIsBetter, filters]) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              <td className="num" {...drill(filters, `${label} · ${t.comparison.thisMonth}`)}>
                {money(entry?.current?.[field] ?? 0, currency)}
              </td>
              <td className="num" {...drill({ ...filters, from: previous.from, to: previous.to }, `${label} · ${t.comparison.lastMonth}`)}>
                {money(entry?.previous?.[field] ?? 0, currency)}
              </td>
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
            <div
              key={m.month}
              className="rp-bar"
              {...drill({ type: 'expense', month: m.month }, `${monthLabel(m.month, locale, { month: 'long', year: 'numeric' })} · ${money(m.totalExpenses, currency)}`)}
            >
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
