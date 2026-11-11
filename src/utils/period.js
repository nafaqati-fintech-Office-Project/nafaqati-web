import { currentMonth, monthRange, todayKey } from './dateRange.js'

// A reporting period: inclusive calendar days { from, to } ('YYYY-MM-DD') in the user's time zone. It is either a whole
// calendar month (the month arrows, "This month", "Last month") or any custom range the user picked on the calendar.
// The reports service accepts at most MAX_DAYS days per request.
export const MAX_DAYS = 366

const DAY_MS = 86400000
const pad = (n) => String(n).padStart(2, '0')
const toUtc = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const keyOf = (ms) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
export const addDays = (key, days) => keyOf(toUtc(key) + days * DAY_MS)

// Inclusive number of days
export const periodDays = ({ from, to }) => Math.round((toUtc(to) - toUtc(from)) / DAY_MS) + 1

export const monthPeriod = (month) => {
  const { from, to } = monthRange(month)
  return { from, to }
}

export const currentMonthPeriod = (timeZone) => monthPeriod(currentMonth(timeZone))

// 'YYYY-MM' when the period is exactly one calendar month, else null
export function wholeMonth({ from, to }) {
  const month = from.slice(0, 7)
  const range = monthRange(month)
  return range.from === from && range.to === to ? month : null
}

// The period before: the previous month for a whole month, else the same number of days just before `from`
export function previousPeriod(period) {
  const month = wholeMonth(period)
  if (month) {
    const [y, m] = month.split('-').map(Number)
    return monthPeriod(keyOf(Date.UTC(y, m - 2, 1)).slice(0, 7))
  }
  const days = periodDays(period)
  return { from: addDays(period.from, -days), to: addDays(period.from, -1) }
}

// Arrows: a whole month moves a month; a custom range moves by its own length
export function shiftPeriod(period, direction) {
  const month = wholeMonth(period)
  if (month) {
    const [y, m] = month.split('-').map(Number)
    return monthPeriod(keyOf(Date.UTC(y, m - 1 + direction, 1)).slice(0, 7))
  }
  const days = periodDays(period) * direction
  return { from: addDays(period.from, days), to: addDays(period.to, days) }
}

// Days of the period that have happened (up to today), for per-day averages; at least 1
export function daysSoFar(period, timeZone) {
  const today = todayKey(timeZone)
  if (period.from > today) return 1
  return periodDays({ from: period.from, to: period.to < today ? period.to : today })
}

// "November 2026", or "3 Nov – 15 Nov 2026" / "20 Dec 2025 – 5 Jan 2026" for a custom range
export function periodLabel(period, locale = 'en-US') {
  const month = wholeMonth(period)
  const date = (key, options) => new Date(`${key}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', ...options })
  if (month) return date(period.from, { month: 'long', year: 'numeric' })
  if (period.from === period.to) return date(period.from, { day: 'numeric', month: 'short', year: 'numeric' })
  const sameYear = period.from.slice(0, 4) === period.to.slice(0, 4)
  const start = date(period.from, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
  return `${start} – ${date(period.to, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

// Quick picks of the calendar popover
export const PRESETS = ['thisMonth', 'lastMonth', 'last7', 'last30', 'last90', 'thisYear']

export function presetPeriod(preset, timeZone) {
  const today = todayKey(timeZone)
  switch (preset) {
    case 'thisMonth':
      return currentMonthPeriod(timeZone)
    case 'lastMonth':
      return previousPeriod(currentMonthPeriod(timeZone))
    case 'last7':
      return { from: addDays(today, -6), to: today }
    case 'last30':
      return { from: addDays(today, -29), to: today }
    case 'last90':
      return { from: addDays(today, -89), to: today }
    case 'thisYear':
      return { from: `${today.slice(0, 4)}-01-01`, to: today }
    default:
      return null
  }
}

// Problems with a typed range: 'missing', 'order' (to before from), 'tooLong' (over MAX_DAYS), 'future'; null = fine
export function rangeProblem({ from, to }, today) {
  if (!from || !to) return 'missing'
  if (to < from) return 'order'
  if (from > today) return 'future'
  if (periodDays({ from, to }) > MAX_DAYS) return 'tooLong'
  return null
}

// URL <-> period: ?from=&to= (both valid days, at most MAX_DAYS apart); anything else falls back
export function periodFromParams(params, fallback) {
  const from = params.get('from')
  const to = params.get('to')
  const valid = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '') && !Number.isNaN(toUtc(v))
  if (!valid(from) || !valid(to) || to < from || periodDays({ from, to }) > MAX_DAYS) return fallback
  return { from, to }
}
