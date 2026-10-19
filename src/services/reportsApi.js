import api from '../lib/api.js'
import { resolveTimeZone } from '../utils/timeZone.js'

// reports-analytics-service through the gateway. `range` is { from, to, timeZone }: calendar days (YYYY-MM-DD,
// inclusive) in the user's time zone. Amounts come back per currency; they are never added across currencies.
const get = (path, { from, to, timeZone }) =>
  api.get(`/api/reports/${path}`, { params: { startDate: from, endDate: to, timeZone: resolveTimeZone(timeZone) } }).then((res) => res.data)

// { currencies: [{ currency, totalIncome, totalExpenses, net, incomeCount, expenseCount }] }
export const getIncomeVsExpenses = (range) => get('income-vs-expenses', range)

// { currencies: [{ currency, totalSpent, transactionCount, categories: [{ category, categoryCode, total, count, percentage }] }] }
export const getSpendingSummary = (range) => get('spending-summary', range)

// { currencies: [{ currency, totalSpent, transactionCount, days: [{ date, total, count }] }] } (every day present)
export const getDailySpending = (range) => get('daily-spending', range)

// The entry of a per-currency list for `currency` (undefined when the user has nothing in that currency)
export const forCurrency = (report, currency) => report?.currencies.find((c) => c.currency === currency)

// Month-based reports take a month ("YYYY-MM") and the zone instead of dates (the service derives the local days).
const getMonthly = (path, params, timeZone) =>
  api.get(`/api/reports/${path}`, { params: { ...params, timeZone: resolveTimeZone(timeZone) } }).then((res) => res.data)

// { month, previousMonth, timeZone, currencies: [{ currency,
//     current/previous: { totalIncome, totalExpenses, net, categories: [{ categoryCode, category, total, count }] },
//     delta: { totalIncome|totalExpenses|net: { amount, percent|null }, categories: [{ categoryCode, category, amount, percent|null }] } }] }
export const getMonthlyComparison = ({ month, timeZone }) => getMonthly('monthly-comparison', { month }, timeZone)

// { endMonth, months, timeZone, currencies: [{ currency, months: [{ month, totalIncome, totalExpenses, net, savingsRate|null }] }] }
// savingsRate is a RATIO (0.25 = 25 %), null when the month has no income.
export const getMonthlyTrend = ({ endMonth, months = 12, timeZone }) => getMonthly('monthly-trend', { endMonth, months }, timeZone)
