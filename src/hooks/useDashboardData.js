import { useAsync } from './useAsync.js'
import { useFormat } from './useFormat.js'
import { previousPeriod } from '../utils/period.js'
import * as reportsApi from '../services/reportsApi.js'

// Real dashboard data for the selected period ({ from, to }: a calendar month or any custom days), measured in the
// user's time zone. Each section is its own request (parallel, independent loading and errors):
//   current / previous: income vs expenses of the period and of the period before (for the % change)
//   categories:         spending by category
//   daily:              spending per day (every day of the period present)
export function useDashboardData(period) {
  const { timeZone } = useFormat()
  const key = `${period.from}:${period.to}:${timeZone ?? 'browser'}`
  const before = previousPeriod(period)

  const current = useAsync(() => reportsApi.getIncomeVsExpenses({ ...period, timeZone }), `income:${key}`)
  const previous = useAsync(() => reportsApi.getIncomeVsExpenses({ ...before, timeZone }), `income-prev:${key}`)
  const categories = useAsync(() => reportsApi.getSpendingSummary({ ...period, timeZone }), `categories:${key}`)
  const daily = useAsync(() => reportsApi.getDailySpending({ ...period, timeZone }), `daily:${key}`)

  return { current, previous, categories, daily }
}
