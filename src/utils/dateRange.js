import { dateKeyOf } from './format.js'

// Date helpers shared by the Transactions presets and the dashboard month. All of them work on calendar days
// (YYYY-MM-DD) in the user's time zone; the backends receive those days plus the `timeZone`, so what the user
// sees as "this month" is exactly what gets filtered.
const parse = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const key = (date) => date.toISOString().slice(0, 10)
const addDays = (date, days) => new Date(date.getTime() + days * 86400000)

// The user's current calendar day / month in `timeZone` (undefined = the browser's)
export const todayKey = (timeZone) => dateKeyOf(new Date().toISOString(), timeZone)
export const currentMonth = (timeZone) => todayKey(timeZone).slice(0, 7)

// "2026-10" -> first and last day and the number of days
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0))
  return { from: key(new Date(Date.UTC(y, m - 1, 1))), to: key(last), days: last.getUTCDate() }
}

export const previousMonth = (month) => {
  const [y, m] = month.split('-').map(Number)
  return key(new Date(Date.UTC(y, m - 2, 1))).slice(0, 7)
}

// Preset id -> { from, to } for the Transactions page. `today` is the user's current day (todayKey).
export function resolveRange({ range, from, to }, today) {
  const t = parse(today)
  const y = t.getUTCFullYear()
  const m = t.getUTCMonth()
  switch (range) {
    case 'today':
      return { from: today, to: today }
    case 'last7':
      return { from: key(addDays(t, -6)), to: today }
    case 'thisMonth':
      return { from: key(new Date(Date.UTC(y, m, 1))), to: today }
    case 'lastMonth':
      return { from: key(new Date(Date.UTC(y, m - 1, 1))), to: key(new Date(Date.UTC(y, m, 0))) }
    case 'last3m':
      return { from: key(new Date(Date.UTC(y, m - 3, t.getUTCDate()))), to: today }
    case 'custom':
      return { from: from || null, to: to || null }
    default:
      return { from: null, to: null }
  }
}
