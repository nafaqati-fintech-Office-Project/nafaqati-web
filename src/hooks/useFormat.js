import { useMemo } from 'react'
import { usePreferences } from './usePreferences.js'
import { resolveTimeZone } from '../utils/timeZone.js'
import { dateKeyOf, formatCurrency, formatDate, formatDateTime, formatDayHeading } from '../utils/format.js'

// Money and date formatting bound to the user's preferences (currency and time zone).
// Inside the signed-in app preferences are always loaded (RequirePreferences gates the routes),
// so there is never a guessed currency: with no preferences, amounts render without a currency code.
export function useFormat() {
  const { prefs } = usePreferences()
  const currency = prefs?.currency
  const timeZone = resolveTimeZone(prefs?.timezone) // always an IANA region ID (browser zone as fallback)

  return useMemo(
    () => ({
      currency,
      timeZone,
      money: (amount, options) => formatCurrency(amount, currency, options),
      date: (iso) => formatDate(iso, timeZone),
      dateTime: (iso) => formatDateTime(iso, timeZone),
      dateKey: (iso) => dateKeyOf(iso, timeZone),
      dayHeading: (iso, now, labels) => formatDayHeading(iso, now, labels, timeZone),
    }),
    [currency, timeZone],
  )
}
