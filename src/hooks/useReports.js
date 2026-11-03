import { useState } from 'react'
import { useAsync } from './useAsync.js'
import { useFormat } from './useFormat.js'
import { monthRange } from '../utils/dateRange.js'
import * as reportsApi from '../services/reportsApi.js'
import { listAllTransactions } from '../services/transactionApi.js'

export const REPORT_TREND_MONTHS = 6
export const MERCHANT_ROW_CAP = 500

// Data of the Reports page for the selected month ("YYYY-MM"), in the user's time zone. Each source is its own
// request with its own loading/error/retry (a failing trend never hides the category report):
//   comparison: month vs the month before (summary, categories, lifestyle, savings, comparison)
//   trend:      the 6 months ending with the selected one
//   expenses:   the month's completed expenses (merchants, count, biggest); capped at MERCHANT_ROW_CAP rows
// Every response lists all currencies, so switching currency is a client-side selection.
export function useReports(month) {
  const { timeZone, currency: preferred } = useFormat()
  const key = `${month}:${timeZone}`
  const { from, to } = monthRange(month)

  const comparison = useAsync(() => reportsApi.getMonthlyComparison({ month, timeZone }), `rc:${key}`)
  const trend = useAsync(() => reportsApi.getMonthlyTrend({ endMonth: month, months: REPORT_TREND_MONTHS, timeZone }), `rt:${key}`)
  const expenses = useAsync(
    () => listAllTransactions({ type: 'EXPENSE', status: 'COMPLETED', from, to, timeZone, sort: 'transactionDate,desc' }, MERCHANT_ROW_CAP),
    `rx:${key}`,
  )

  const found = [comparison, trend].flatMap((s) => s.data?.currencies?.map((c) => c.currency) ?? [])
  const currencies = [...new Set([...found, ...(found.length === 0 && preferred ? [preferred] : [])])].sort()

  const [picked, setPicked] = useState(null)
  const currency = currencies.includes(picked) ? picked : currencies.includes(preferred) ? preferred : currencies[0]

  return { comparison, trend, expenses, currencies, currency, setCurrency: setPicked, timeZone }
}
