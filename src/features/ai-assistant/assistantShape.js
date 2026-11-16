import { categoryRows, lifestyleShares, merchantTotals, savingsRatePercent } from '../reports/reportUtils.js'

// Pure: turns service responses into the assistant's data (same shape as the mobile app's AssistantData) and
// that data into the summary sent to the server.

const MAX_ROWS = 8

// One month of one currency from a monthly-comparison side ({ totalIncome, totalExpenses, net, categories }).
export function monthFrom(month, currency, side, expenses) {
  const categories = categoryRows(side?.categories ?? []).map((c) => ({ code: c.code, name: c.label, amount: c.amount, percent: c.percent }))
  return {
    month,
    currency,
    income: Number(side?.totalIncome ?? 0),
    spent: Number(side?.totalExpenses ?? 0),
    net: Number(side?.net ?? 0),
    savingsRate: savingsRatePercent(side?.totalIncome ?? 0, side?.net ?? 0),
    categories,
    lifestyle: lifestyleShares(side?.categories ?? []),
    merchants: expenses ? merchantTotals(expenses.items, currency, 20).map((m) => ({ name: m.name, amount: m.amount, count: m.count })) : [],
    merchantsState: expenses ? 'ready' : 'unavailable',
    merchantsPartial: Boolean(expenses?.capped),
  }
}

const STATUS = { EXCEEDED: 'over', WARNING: 'warning' }

export function budgetFrom(raw, fallbackCurrency) {
  if (!raw) return null
  return {
    currency: raw.currency ?? fallbackCurrency,
    spent: Number(raw.totalSpent ?? 0),
    limit: Number(raw.totalLimit ?? 0),
    remaining: Number(raw.remainingAmount ?? 0),
    percent: Math.round(Number(raw.percentageUsed ?? 0)),
    categories: (raw.categoryLimits ?? []).map((c) => ({
      code: c.category,
      name: c.categoryName ?? c.category,
      spent: Number(c.spentAmount ?? 0),
      limit: Number(c.limitAmount ?? 0),
      percent: Math.round(Number(c.percentageUsed ?? 0)),
      status: STATUS[c.usageStatus] ?? 'ok',
    })),
  }
}

export const goalFrom = (g) => ({
  id: g.id,
  name: g.name,
  currency: g.currency,
  target: Number(g.targetAmount ?? 0),
  saved: Number(g.savedAmount ?? 0),
  targetDate: g.targetDate ? String(g.targetDate).slice(0, 10) : null,
})

// The compact summary sent with each question: totals only, no ids.
export function toContext(data, { firstName, language }) {
  return {
    firstName: firstName || null,
    language,
    currency: data.currency,
    today: data.today,
    months: data.months.map((m, i) => ({
      month: m.month,
      stillRunning: i === 0,
      currency: m.currency,
      income: m.income,
      spent: m.spent,
      net: m.net,
      savingsRatePercent: m.savingsRate,
      categories: m.categories.slice(0, MAX_ROWS).map((c) => ({ name: c.name, amount: c.amount, percent: c.percent })),
      essentialsVsLifestyle: m.lifestyle,
      topMerchants: m.merchants.slice(0, MAX_ROWS),
      merchantsPartial: m.merchantsPartial,
    })),
    budget: data.budget && {
      currency: data.budget.currency,
      spent: data.budget.spent,
      limit: data.budget.limit,
      percentUsed: data.budget.percent,
      categories: data.budget.categories.map((c) => ({ name: c.name, spent: c.spent, limit: c.limit, percentUsed: c.percent, status: c.status })),
    },
    goals: data.goals.slice(0, 10).map((g) => ({ name: g.name, currency: g.currency, target: g.target, saved: g.saved, targetDate: g.targetDate })),
    subscriptions: data.subscriptions.slice(0, 15),
  }
}
