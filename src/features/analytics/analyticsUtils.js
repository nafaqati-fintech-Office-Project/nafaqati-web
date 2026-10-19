import { decimalsFor } from '../../constants/currencies.js'
import { formatCurrency } from '../../utils/format.js'

// Amounts arrive as JSON numbers; shown with the currency's own decimals (2, or 3 for KWD/BHD/OMR)
export const money = (amount, currency) => formatCurrency(Number(amount), currency, { decimals: decimalsFor(currency) })

// 12.34 -> "12.3%"; the sign is shown by the arrow, not the text
export const pct = (value) => `${Math.abs(Math.round(Number(value) * 10) / 10)}%`

// Tone of a change: up is good for income/net/rate, bad for expenses; no change is neutral
export function deltaTone(change, { lowerIsBetter = false } = {}) {
  if (change == null || change === 0) return 'neutral'
  return (change > 0) !== lowerIsBetter ? 'good' : 'bad'
}

export const forCurrency = (report, currency) => report?.currencies?.find((c) => c.currency === currency)

// "2026-10" -> "Oct" / "October 2026" in the page language (calendar months do not depend on a time zone)
export const monthLabel = (month, locale, options) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', ...options })

// "2026-10-13" -> "Tue, 13 Oct"
export const dayLabel = (dateKey, locale) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })

// Monday = 0 ... Sunday = 6 for a calendar day
export const weekdayIndex = (dateKey) => (new Date(`${dateKey}T00:00:00Z`).getUTCDay() + 6) % 7

// Weekday names Monday..Sunday (2024-01-01 was a Monday)
export const weekdayNames = (locale, width = 'short') =>
  Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale, { timeZone: 'UTC', weekday: width }))

// The /transactions URL for a category (or all) within a month's date range
export const transactionsUrl = ({ code, from, to }) => {
  const params = new URLSearchParams({ range: 'custom', from, to })
  if (code) params.set('category', code)
  return `/transactions?${params}`
}
