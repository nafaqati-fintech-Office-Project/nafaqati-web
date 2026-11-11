import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Cloud, Flag, HeartPulse, Moon, PiggyBank, Plus, ScanLine, Search, ShoppingBag, Sparkles, Sun, Sunset, Users, Wallet } from 'lucide-react'
import { useUser } from '../../hooks/useUser.js'
import { useFormat } from '../../hooks/useFormat.js'
import { useDashboardData } from '../../hooks/useDashboardData.js'
import { APP_TEXT } from '../../constants/appText.js'
import { formatMonthLabel, getDayPeriod, lastMonths } from '../../utils/format.js'
import { currentMonth, monthRange, todayKey } from '../../utils/dateRange.js'
import { forCurrency } from '../../services/reportsApi.js'
import { BUDGET_TRACKING, getCurrentBudget } from '../../services/budgetApi.js'
import { decimalsFor } from '../../constants/currencies.js'
import { getErrorInfo } from '../../lib/errors.js'
import { useAsync } from '../../hooks/useAsync.js'
import { clickableProps, transactionsLink } from '../../utils/transactionLinks.js'
import StatCard from './components/StatCard.jsx'
import SpendingOverviewCard from './components/SpendingOverviewCard.jsx'
import QuickActions from './components/QuickActions.jsx'
import TopCategoriesCard from './components/TopCategoriesCard.jsx'
import ComingSoonCard from './components/ComingSoonCard.jsx'
import './Dashboard.css'

const GREETING_ICONS = {
  morning: { icon: Sun, color: '#F59E0B' },
  afternoon: { icon: Cloud, color: '#38BDF8' },
  evening: { icon: Sunset, color: '#F97316' },
  night: { icon: Moon, color: '#7B3FF2' },
}

const t = APP_TEXT.dashboard
// Only actions without backend support are labelled "Coming soon"
const QUICK_ACTIONS = [
  { id: 'add-expense', label: t.quickActions.addExpense, icon: Plus, tone: 'green' },
  { id: 'scan-receipt', label: t.quickActions.scanReceipt, icon: ScanLine, tone: 'blue', disabled: true },
  { id: 'ask', label: t.quickActions.askNafaqati, icon: Sparkles, tone: 'purple', disabled: true },
  { id: 'set-budget', label: t.quickActions.setBudget, icon: Wallet, tone: 'orange' },
  { id: 'new-goal', label: t.quickActions.newGoal, icon: Flag, tone: 'violet' },
  { id: 'manage-family', label: t.quickActions.manageFamily, icon: Users, tone: 'blue', disabled: true },
]

// % change vs the previous month; hidden (null) when the previous value is zero
const percentChange = (current, previous) => (previous === 0 ? null : Math.round(((current - previous) / Math.abs(previous)) * 100))
const tone = (good) => (good ? 'green' : 'red')
const dateToTime = (key) => new Date(`${key}T00:00:00Z`).getTime()
// Days left in the budget period, counted in the BUDGET's own zone and inclusive of today and the last day
const daysLeft = (periodEnd, timeZone) => {
  const today = todayKey(timeZone)
  return Math.max(1, Math.round((dateToTime(periodEnd) - dateToTime(today)) / 86400000) + 1)
}

// remaining / days left, both in the budget's own currency and time zone; nothing is invented when over budget
function SafeValue({ budget }) {
  const remaining = Number(budget.remainingAmount)
  const days = daysLeft(budget.periodEnd, budget.timeZone)
  const decimals = decimalsFor(budget.currency)
  const fmt = (amount) => `${budget.currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  return (
    <>
      <div className="safe-value">{remaining > 0 ? fmt(remaining / days) : fmt(0)}</div>
      <p className="safe-desc">
        {remaining > 0
          ? `per day for the next ${days} ${days === 1 ? 'day' : 'days'} (${fmt(remaining)} left this month).`
          : 'You have reached this month’s budget.'}
      </p>
    </>
  )
}

function SafeToSpendCard({ state, onSetBudget, onOpen }) {
  if (state.loading) {
    return (
      <section className="dc safe-card" aria-label={t.safeToSpend.title}>
        <div className="dc-skeleton">
          <span className="sk" style={{ width: '44%', height: 18, borderRadius: 8 }} />
          <span className="sk" style={{ width: '70%', height: 34, borderRadius: 10 }} />
          <span className="sk" style={{ width: '55%', height: 14, borderRadius: 8 }} />
        </div>
      </section>
    )
  }
  if (state.error) {
    return (
      <section className="dc safe-card" aria-label={t.safeToSpend.title}>
        <div className="dc-head">
          <h2>{t.safeToSpend.title}</h2>
        </div>
        <div className="dc-state">
          <Wallet size={28} aria-hidden="true" />
          <strong>{getErrorInfo(state.error, 'budgets').message}</strong>
          <button type="button" className="dc-retry" onClick={state.retry}>
            {APP_TEXT.common.retry}
          </button>
        </div>
      </section>
    )
  }
  if (!state.data) {
    return (
      <section className="dc safe-card" aria-label={t.safeToSpend.title}>
        <div className="dc-head">
          <h2>{t.safeToSpend.title}</h2>
        </div>
        <div className="dc-state">
          <Wallet size={28} aria-hidden="true" />
          <strong>Set a budget</strong>
          <p>Create this month’s budget to see how much you can safely spend.</p>
          <button type="button" className="dc-retry" onClick={onSetBudget}>
            Set a budget
          </button>
        </div>
      </section>
    )
  }
  return (
    <section className="dc safe-card" aria-label={t.safeToSpend.title}>
      <div className="safe-top" {...clickableProps(onOpen && (() => onOpen(state.data)), t.safeToSpend.viewSpending)}>
        <span className="icon-circle tone-green">
          <Wallet size={24} aria-hidden="true" />
        </span>
        <div className="safe-text">
          <div className="safe-title-row">
            <h2>{t.safeToSpend.title}</h2>
            <span className={`badge-${state.data.usageStatus === "EXCEEDED" ? "red" : state.data.usageStatus === "WARNING" ? "amber" : "green"}`}>{{ ON_TRACK: "On track", WARNING: "Warning", EXCEEDED: "Exceeded" }[state.data.usageStatus] ?? state.data.usageStatus}</span>
          </div>
          <SafeValue budget={state.data} />
        </div>
      </div>
    </section>
  )
}

export default function Dashboard() {
  const { profile, loading: profileLoading, nameProvisional, nameResolving } = useUser()
  const { currency, timeZone, money } = useFormat()
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const navigate = useNavigate()
  const months = useMemo(() => lastMonths(12, currentMonth(timeZone)), [timeZone])
  const [month, setMonth] = useState(() => currentMonth(timeZone))
  const [search, setSearch] = useState('')
  const { current, previous, categories, daily } = useDashboardData(month)
  const currentBudget = useAsync(
    () =>
      getCurrentBudget().catch((error) => {
        if (error?.response?.status === 404) return null
        throw error
      }),
    `dashboard-budget:${currency}:${timeZone}`,
  )

  const period = getDayPeriod(timeZone)
  const { icon: GreetingIcon, color: greetingColor } = GREETING_ICONS[period]
  // Real first name from GET /api/users/me. While it loads (or while a placeholder name is being replaced by
  // the registration event) we show a shimmer; a placeholder name (the username) is never shown.
  const firstName = profile && !nameProvisional ? profile.firstName : null
  const waitingForName = profileLoading || nameResolving
  const showNameNudge = Boolean(profile) && nameProvisional && !nameResolving && !nudgeDismissed

  const addTransaction = () => navigate('/transactions?new=expense')
  const onQuickAction = (id) => {
    if (id === 'add-expense') addTransaction()
    if (id === 'set-budget') navigate(currentBudget.data ? '/budgets' : '/budgets?create=1')
    if (id === 'new-goal') navigate('/goals')
  }
  // Drill-down from a tile/graph to the Transactions page, scoped to the selected month (or one day of it).
  // Transactions reads these straight from the URL (type / category / range=custom&from&to).
  const openTransactions = ({ day, ...filters } = {}) =>
    navigate(transactionsLink({ month, day: day ? `${month}-${String(day).padStart(2, '0')}` : undefined, ...filters }))
  const monthLabel = formatMonthLabel(month)

  const onSearch = (e) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/transactions?q=${encodeURIComponent(q)}` : '/transactions')
  }

  // ---- what the cards show: only the user's currency; other currencies are never mixed in ----
  const cur = forCurrency(current.data, currency)
  const prev = forCurrency(previous.data, currency)
  const income = cur ? Number(cur.totalIncome) : 0
  const spending = cur ? Number(cur.totalExpenses) : 0
  const savings = income - spending
  const prevIncome = prev ? Number(prev.totalIncome) : 0
  const prevSpending = prev ? Number(prev.totalExpenses) : 0
  const comparable = !previous.loading && !previous.error
  const trendOf = (now, before) => (comparable ? percentChange(now, before) : null)
  const incomeTrend = trendOf(income, prevIncome)
  const spendingTrend = trendOf(spending, prevSpending)
  const savingsTrend = trendOf(savings, prevIncome - prevSpending)

  const otherCurrencies = (current.data?.currencies ?? [])
    .filter((c) => c.currency !== currency && (Number(c.totalIncome) > 0 || Number(c.totalExpenses) > 0))
    .map((c) => c.currency)
  const noData = Boolean(current.data) && income === 0 && spending === 0 && otherCurrencies.length === 0

  const dailyEntry = forCurrency(daily.data, currency)
  const spendingData = useMemo(() => {
    if (!daily.data) return null
    const { days } = monthRange(month)
    const monthShort = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    const byDay = new Map((dailyEntry?.days ?? []).map((d) => [Number(d.date.slice(8, 10)), Number(d.total)]))
    const points = Array.from({ length: days }, (_, i) => ({ day: i + 1, label: `${i + 1} ${monthShort}`, expenses: byDay.get(i + 1) ?? 0 }))
    const tickDays = [1, 7, 14, 21, 28].filter((d) => d <= days)
    return { points, ticks: tickDays.map((d) => points[d - 1].label), total: points.reduce((sum, p) => sum + p.expenses, 0) }
  }, [daily.data, dailyEntry, month])

  const categoryEntry = forCurrency(categories.data, currency)
  const categoryData = useMemo(() => {
    if (!categories.data) return null
    return {
      total: categoryEntry ? Number(categoryEntry.totalSpent) : 0,
      items: (categoryEntry?.categories ?? []).map((c) => ({
        key: c.categoryCode ?? c.category,
        percent: Number(c.percentage),
        amount: Number(c.total),
      })),
    }
  }, [categories.data, categoryEntry])

  return (
    <div className="dash">
      <div className="dash-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">
              {t.greetings[period]}
              {firstName ? `, ${firstName}!` : waitingForName ? <span className="sk greeting-sk" aria-hidden="true" /> : '!'}{' '}
              <GreetingIcon size={28} color={greetingColor} fill={period === 'morning' ? greetingColor : 'none'} aria-hidden="true" />
            </h1>
            <p className="dash-sub">{t.overview(formatMonthLabel(month))}</p>
            {showNameNudge && (
              <p className="name-nudge" role="status">
                <Link to="/profile">{t.nameNudge.cta}</Link> {t.nameNudge.body}
                <button type="button" onClick={() => setNudgeDismissed(true)} aria-label={t.nameNudge.dismiss}>
                  ×
                </button>
              </p>
            )}
          </div>
          <div className="dash-tools">
            <form className="dash-search" onSubmit={onSearch} role="search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchLabel}
              />
            </form>
            <div className="dash-month">
              <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label={t.monthLabel}>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>
        </div>

        {otherCurrencies.length > 0 && (
          <p className="dash-note" role="note">
            {t.otherCurrencies(otherCurrencies.join(', '), currency)}
          </p>
        )}
        {noData && (
          <div className="dash-empty" role="status">
            <p>{t.noData(formatMonthLabel(month))}</p>
            <button type="button" className="btn btn-primary" onClick={addTransaction}>
              <Plus size={16} aria-hidden="true" />
              {t.addFirst}
            </button>
          </div>
        )}

        <div className="dash-stats">
          <StatCard
            state={current}
            icon={Wallet}
            tone="green"
            label={t.stats.income}
            value={money(income)}
            trend={incomeTrend}
            trendTone={tone((incomeTrend ?? 0) >= 0)}
            onClick={() => openTransactions({ type: 'income' })}
            actionLabel={t.stats.viewIncome(monthLabel)}
          />
          <StatCard
            state={current}
            icon={ShoppingBag}
            tone="red"
            label={t.stats.spending}
            value={money(spending)}
            trend={spendingTrend}
            trendTone={tone((spendingTrend ?? 0) <= 0)}
            onClick={() => openTransactions({ type: 'expense' })}
            actionLabel={t.stats.viewSpending(monthLabel)}
          />
          <StatCard
            state={current}
            icon={PiggyBank}
            tone="green"
            label={t.stats.savings}
            value={money(savings)}
            trend={savingsTrend}
            trendTone={tone((savingsTrend ?? 0) >= 0)}
            onClick={() => openTransactions()}
            actionLabel={t.stats.viewSavings(monthLabel)}
          />
          <StatCard soon icon={HeartPulse} tone="teal" label={t.stats.health} />
        </div>

        <div className="dash-row2">
          <div className="area-safe">
            {BUDGET_TRACKING ? (
              <SafeToSpendCard
                state={currentBudget}
                onSetBudget={() => navigate('/budgets?create=1')}
                onOpen={(budget) =>
                  navigate(
                    budget.periodStart
                      ? transactionsLink({ from: budget.periodStart, to: budget.periodEnd, type: 'expense' })
                      : transactionsLink({ month: currentMonth(timeZone), type: 'expense' }),
                  )
                }
              />
            ) : (
              <ComingSoonCard title={t.safeToSpend.title} description={t.safeToSpend.soon} />
            )}
          </div>
          <div className="area-spend">
            <SpendingOverviewCard
              data={spendingData}
              state={daily}
              onAdd={addTransaction}
              onSelectDay={(day) => openTransactions({ type: 'expense', day })}
            />
          </div>
          <div className="area-insights">
            <ComingSoonCard title={t.insights.title} description={t.insights.soon} />
          </div>
        </div>

        <QuickActions title={t.quickActions.title} actions={QUICK_ACTIONS} onAction={onQuickAction} />
      </div>

      <div className="dash-side">
        <TopCategoriesCard
          data={categoryData}
          state={categories}
          onAdd={addTransaction}
          onViewAll={() => openTransactions({ type: 'expense' })}
          onViewDetails={() => openTransactions({ type: 'expense' })}
          onSelectCategory={(category) => category && openTransactions({ type: 'expense', category })}
        />
        <ComingSoonCard title={t.payments.title} description={t.payments.soon} />
      </div>
    </div>
  )
}
