import { useState } from 'react'
import { useAsync } from './useAsync.js'
import { useFormat } from './useFormat.js'
import { previousPeriod, wholeMonth } from '../utils/period.js'
import * as reportsApi from '../services/reportsApi.js'

// Real analytics data for the selected period ({ from, to }: a calendar month or any custom days), measured in the
// user's time zone. Each section is its own request (parallel, independent loading/error/retry). useAsync ignores a
// response whose key (period + zone) is no longer current, so a slow answer never overwrites the new one.
//   comparison: the period vs the period before (KPIs and category deltas); a custom range is built from the range
//               reports in the same shape as monthly-comparison
//   trend:      the 12 months ending with the period's last month
//   categories: spending by category of the period
//   daily:      spending per day of the period
// Every response lists all currencies, so switching currency is a client-side selection (no refetch).
export function useAnalytics(period) {
  const { timeZone, currency: preferred } = useFormat()
  const key = `${period.from}:${period.to}:${timeZone}`
  const month = wholeMonth(period)
  const range = { from: period.from, to: period.to, timeZone }
  const previous = previousPeriod(period)

  const comparison = useAsync(
    () => reportsApi.getPeriodComparison({ period, previous, month, timeZone }),
    `comparison:${key}`,
  )
  const trend = useAsync(
    () => reportsApi.getMonthlyTrend({ endMonth: period.to.slice(0, 7), months: 12, timeZone }),
    `trend:${period.to.slice(0, 7)}:${timeZone}`,
  )
  const categories = useAsync(() => reportsApi.getSpendingSummary(range), `categories:${key}`)
  const daily = useAsync(() => reportsApi.getDailySpending(range), `daily:${key}`)

  // Currencies present in whatever has loaded so far (sorted); the preferred one is offered even before data arrives
  const found = [comparison, trend, categories, daily].flatMap((s) => s.data?.currencies?.map((c) => c.currency) ?? [])
  const currencies = [...new Set([...found, ...(found.length === 0 && preferred ? [preferred] : [])])].sort()

  const [picked, setPicked] = useState(null)
  const currency = currencies.includes(picked) ? picked : currencies.includes(preferred) ? preferred : currencies[0]

  return { comparison, trend, categories, daily, currencies, currency, setCurrency: setPicked, range, timeZone, month }
}
