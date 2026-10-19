import { useState } from 'react'
import { useAsync } from './useAsync.js'
import { useFormat } from './useFormat.js'
import { monthRange } from '../utils/dateRange.js'
import * as reportsApi from '../services/reportsApi.js'

// Real analytics data for the selected month ("YYYY-MM"), measured in the user's time zone. Each section is its
// own request (parallel, independent loading/error/retry). useAsync ignores a response whose key (month + zone)
// is no longer current, so a slow answer for an old month never overwrites the new one.
//   comparison: month vs the month before (KPIs and category deltas)
//   trend:      the 12 months ending with the selected one
//   categories: spending by category of the month
//   daily:      spending per day of the month
// Every response lists all currencies, so switching currency is a client-side selection (no refetch).
export function useAnalytics(month) {
  const { timeZone, currency: preferred } = useFormat()
  const key = `${month}:${timeZone}`
  const { from, to } = monthRange(month)
  const range = { from, to, timeZone }

  const comparison = useAsync(() => reportsApi.getMonthlyComparison({ month, timeZone }), `comparison:${key}`)
  const trend = useAsync(() => reportsApi.getMonthlyTrend({ endMonth: month, months: 12, timeZone }), `trend:${key}`)
  const categories = useAsync(() => reportsApi.getSpendingSummary(range), `categories:${key}`)
  const daily = useAsync(() => reportsApi.getDailySpending(range), `daily:${key}`)

  // Currencies present in whatever has loaded so far (sorted); the preferred one is offered even before data arrives
  const found = [comparison, trend, categories, daily].flatMap((s) => s.data?.currencies?.map((c) => c.currency) ?? [])
  const currencies = [...new Set([...found, ...(found.length === 0 && preferred ? [preferred] : [])])].sort()

  const [picked, setPicked] = useState(null)
  const currency = currencies.includes(picked) ? picked : currencies.includes(preferred) ? preferred : currencies[0]

  return { comparison, trend, categories, daily, currencies, currency, setCurrency: setPicked, range, timeZone }
}
