import { useAsync } from './useAsync.js'
import { useFormat } from './useFormat.js'
import { monthRange, previousMonth } from '../utils/dateRange.js'
import * as reportsApi from '../services/reportsApi.js'

// Real dashboard data for the selected month ("YYYY-MM"), measured in the user's time zone. Each section is its
// own request (parallel, independent loading and errors):
//   current / previous: income vs expenses of the month and of the month before (for the % change)
//   categories:         spending by category
//   daily:              spending per day (every day of the month present)
export function useDashboardData(month) {
  const { timeZone } = useFormat()
  const key = `${month}:${timeZone ?? 'browser'}`
  const rangeOf = (m) => ({ from: monthRange(m).from, to: monthRange(m).to, timeZone })

  const current = useAsync(() => reportsApi.getIncomeVsExpenses(rangeOf(month)), `income:${key}`)
  const previous = useAsync(() => reportsApi.getIncomeVsExpenses(rangeOf(previousMonth(month))), `income-prev:${key}`)
  const categories = useAsync(() => reportsApi.getSpendingSummary(rangeOf(month)), `categories:${key}`)
  const daily = useAsync(() => reportsApi.getDailySpending(rangeOf(month)), `daily:${key}`)

  return { current, previous, categories, daily }
}
