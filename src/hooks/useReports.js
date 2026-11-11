import { useState } from 'react'
import { useAsync } from './useAsync.js'
import { useFormat } from './useFormat.js'
import { previousPeriod, wholeMonth } from '../utils/period.js'
import * as reportsApi from '../services/reportsApi.js'
import { listAllTransactions } from '../services/transactionApi.js'

export const REPORT_TREND_MONTHS = 6
export const MERCHANT_ROW_CAP = 500

// Data of the Reports page for the selected period ({ from, to }: a calendar month or any custom days), in the user's
// time zone. Each source is its own request with its own loading/error/retry (a failing trend never hides the rest):
//   comparison: the period vs the period before (a month: monthly-comparison; a custom range: built from the range
//               reports in the same shape)
//   trend:      the 6 months ending with the period's last month
//   expenses:   the period's completed expenses (merchants, count, biggest); capped at MERCHANT_ROW_CAP rows
// Every response lists all currencies, so switching currency is a client-side selection.
export function useReports(period) {
  const { timeZone, currency: preferred } = useFormat()
  const key = `${period.from}:${period.to}:${timeZone}`
  const month = wholeMonth(period)
  const { from, to } = period

  const comparison = useAsync(
    () => reportsApi.getPeriodComparison({ period, previous: previousPeriod(period), month, timeZone }),
    `rc:${key}`,
  )
  const trend = useAsync(
    () => reportsApi.getMonthlyTrend({ endMonth: to.slice(0, 7), months: REPORT_TREND_MONTHS, timeZone }),
    `rt:${to.slice(0, 7)}:${timeZone}`,
  )
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
