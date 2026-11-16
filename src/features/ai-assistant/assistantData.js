import * as budgetApi from '../../services/budgetApi.js'
import * as goalsApi from '../../services/goalsApi.js'
import * as reportsApi from '../../services/reportsApi.js'
import { listSubscriptions } from '../../services/subscriptionApi.js'
import { listAllTransactions } from '../../services/transactionApi.js'
import { monthRange, previousMonth, todayKey } from '../../utils/dateRange.js'
import { budgetFrom, goalFrom, monthFrom } from './assistantShape.js'

// What the assistant answers from, loaded in the browser with the same endpoints as the Reports, Budgets, Goals and
// Subscriptions pages. Only totals: no SMS text, card or account numbers. Same shape as the mobile app's AssistantData.

export const MERCHANT_ROW_CAP = 500

export async function loadAssistantData({ timeZone, currency: preferred }) {
  const today = todayKey(timeZone)
  const thisMonth = today.slice(0, 7)
  const lastMonth = previousMonth(thisMonth)
  const expensesOf = (month) => {
    const { from, to } = monthRange(month)
    return listAllTransactions({ type: 'EXPENSE', status: 'COMPLETED', from, to, timeZone, sort: 'transactionDate,desc' }, MERCHANT_ROW_CAP).catch(() => null)
  }

  // The same shape as the monthly comparison, built from the basic range reports (the monthly one is Premium).
  const comparisonOf = (month) =>
    reportsApi.getPeriodComparison({ period: monthRange(month), previous: monthRange(previousMonth(month)), month: null, timeZone })

  // This month's comparison is required (it also holds last month); the rest only adds detail.
  const [now, earlier, expNow, expLast, budget, goals, subs] = await Promise.all([
    comparisonOf(thisMonth),
    comparisonOf(lastMonth).catch(() => null),
    expensesOf(thisMonth),
    expensesOf(lastMonth),
    budgetApi.getCurrentBudget().catch(() => null),
    goalsApi.listGoals().catch(() => []),
    listSubscriptions(['CONFIRMED']).catch(() => null),
  ])

  const currencies = now.currencies ?? []
  const currency =
    (preferred && currencies.some((c) => c.currency === preferred) && preferred) ||
    [...currencies].sort((a, b) => Number(b.current?.totalExpenses ?? 0) - Number(a.current?.totalExpenses ?? 0))[0]?.currency ||
    preferred ||
    'SAR'
  const entry = reportsApi.forCurrency(now, currency)
  const before = reportsApi.forCurrency(earlier, currency)
  const months = [monthFrom(thisMonth, currency, entry?.current, expNow), monthFrom(lastMonth, currency, entry?.previous, expLast)]
  if (before?.previous) months.push(monthFrom(previousMonth(lastMonth), currency, before.previous, null))

  const goalItems = Array.isArray(goals) ? goals : (goals?.items ?? [])
  return {
    currency,
    today,
    months,
    budget: budgetFrom(budget, currency),
    goals: goalItems.filter((g) => g.status === 'ACTIVE').map(goalFrom),
    subscriptions: (subs?.items ?? [])
      .filter((s) => s.status === 'CONFIRMED')
      .map((s) => ({ name: s.displayName, currency: s.currency, monthlyCost: Number(s.monthlyCost ?? 0), cycle: s.cycle })),
  }
}
