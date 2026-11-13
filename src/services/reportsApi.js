import api from '../lib/api.js'
import { resolveTimeZone } from '../utils/timeZone.js'
import { buildPeriodComparison } from '../utils/periodComparison.js'

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

// ---- Any period (the calendar): the same shape as getMonthlyComparison, so pages show one either way ----

// A whole calendar month uses the service's own monthly-comparison; any other range is built from the range reports.
// `month` is the period's month when it is a whole one (utils/period.js wholeMonth), else null.
export async function getPeriodComparison({ period, previous, month, timeZone }) {
  if (month) return getMonthlyComparison({ month, timeZone })
  const [income, spending, previousIncome, previousSpending] = await Promise.all([
    getIncomeVsExpenses({ ...period, timeZone }),
    getSpendingSummary({ ...period, timeZone }),
    getIncomeVsExpenses({ ...previous, timeZone }),
    getSpendingSummary({ ...previous, timeZone }),
  ])
  return buildPeriodComparison({ income, spending, previousIncome, previousSpending })
}

// Premium: the server builds the PDF or Excel file (it checks the plan) and the browser saves it. A 403 means the plan
// does not include exports. kind: 'pdf' | 'xlsx'.
export async function downloadReportExport(kind, { from, to, timeZone }) {
  const res = await api.get(`/api/reports/export/${kind}`, {
    params: { startDate: from, endDate: to, timeZone: resolveTimeZone(timeZone) },
    responseType: 'blob',
    timeout: 60000,
  })
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `Nafaqati-Report-${from}-to-${to}.${kind}`
  link.click()
  URL.revokeObjectURL(url)
}
