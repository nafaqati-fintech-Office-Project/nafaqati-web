import { decimalsFor } from '../../constants/currencies.js'

export const BUDGET_CATEGORY_CODES = [
  'FOOD_AND_BEVERAGE',
  'GROCERIES',
  'CLOTHING_AND_SHOPPING',
  'TRANSPORTATION',
  'FUEL',
  'ENTERTAINMENT',
  'SUBSCRIPTIONS',
  'HEALTH',
  'EDUCATION',
  'TRAVEL',
  'UTILITIES',
  'INVESTMENTS',
  'HOUSING',
  'CHARITY',
  'LOANS_EMI',
]

const pad = (value) => String(value).padStart(2, '0')
const partsInZone = (date, timeZone) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  )

export function currentMonthKey(timeZone) {
  const parts = partsInZone(new Date(), timeZone)
  return `${parts.year}-${parts.month}`
}

export function monthPeriod(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const periodStart = `${year}-${pad(monthNumber)}-01`
  // periodEnd is the LAST day of the month, inclusive
  const periodEnd = `${year}-${pad(monthNumber)}-${pad(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate())}`
  return { periodStart, periodEnd }
}

// Months the backend accepts: the next one and the last 12 (counted in the budget's zone), newest first
export function budgetMonthWindow(current) {
  const [year, monthNumber] = current.split('-').map(Number)
  return Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(year, monthNumber - i, 1)).toISOString().slice(0, 7))
}

export function monthLabel(month, locale = 'en-US') {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function monthFromBudget(budget) {
  return budget?.periodStart?.slice(0, 7) ?? ''
}

export function samePeriodStart(budget, month) {
  return budget?.periodStart === monthPeriod(month).periodStart
}

export function amountError(value, currency, required = true) {
  const amount = String(value ?? '').trim()
  if (!amount) return required ? 'Enter an amount' : ''
  const max = decimalsFor(currency)
  if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) return 'Enter a positive amount'
  if ((amount.split('.')[1] ?? '').length > max) return `${currency} allows up to ${max} decimal places`
  return ''
}

// Spent that no category limit covers (UNCATEGORIZED, categories without a limit): counts toward the total only
export function uncoveredSpent(budget) {
  const covered = (budget?.categoryLimits ?? []).reduce((sum, limit) => sum + Number(limit.spentAmount ?? 0), 0)
  return Math.max(0, Number(budget?.totalSpent ?? 0) - covered)
}

export function normalizeMoney(value) {
  return Number(value ?? 0)
}

export function formatBudgetMoney(amount, currency) {
  const decimals = decimalsFor(currency)
  return `${currency} ${normalizeMoney(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function allowedBudgetCategories(categories) {
  const byCode = new Map(categories.map((category) => [category.code, category]))
  return BUDGET_CATEGORY_CODES.map((code) => byCode.get(code) ?? { id: code, code, kind: 'EXPENSE', name: code })
}

export function mapDetailsToFields(details = []) {
  const fields = {}
  details.forEach((detail) => {
    const [field, ...rest] = String(detail).split(':')
    if (field && rest.length) fields[field.trim()] = rest.join(':').trim()
  })
  return fields
}
