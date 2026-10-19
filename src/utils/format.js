const MS_MINUTE = 60 * 1000
const MS_HOUR = 60 * MS_MINUTE
const MS_DAY = 24 * MS_HOUR

// "PKR 12,500"; decimals only when asked for or when the amount has a fraction.
// The currency is always passed in (from the user's preferences, see hooks/useFormat.js): there is no default.
export function formatCurrency(amount, currency, { decimals } = {}) {
  const digits = decimals ?? (Number.isInteger(amount) ? 0 : 2)
  const number = amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return currency ? `${currency} ${number}` : number
}

export const formatPercent = (value) => `${Math.abs(value)}%`

// 0 -> "0", 1000 -> "1K", 2500 -> "2.5K"
export function formatShortK(value) {
  if (Math.abs(value) < 1000) return String(value)
  return `${Number((value / 1000).toFixed(1))}K`
}

export function formatRelativeTime(iso, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`
  if (diff < MS_MINUTE) return 'Just now'
  if (diff < MS_HOUR) return plural(Math.floor(diff / MS_MINUTE), 'minute')
  if (diff < MS_DAY) return plural(Math.floor(diff / MS_HOUR), 'hour')
  return plural(Math.floor(diff / MS_DAY), 'day')
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export function formatDueDate(iso, { today: todayLabel, tomorrow: tomorrowLabel }, now = new Date()) {
  const due = new Date(iso)
  const days = Math.round((startOfDay(due) - startOfDay(now)) / MS_DAY)
  if (days === 0) return todayLabel
  if (days === 1) return tomorrowLabel
  return due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "2026-05" -> "May 2026"
export function formatMonthLabel(month) {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function toMonthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Current month first, then the 11 before it. `current` is the user's current month ("2026-10", see currentMonth()).
export function lastMonths(count = 12, current = toMonthValue(new Date())) {
  const [year, month] = current.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const value = toMonthValue(new Date(year, month - 1 - i, 1))
    return { value, label: formatMonthLabel(value) }
  })
}

export function getDayPeriod(timeZone, date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: timeZone || undefined }).format(date))
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

export const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1)

export function getInitials(user) {
  const source = user?.username || user?.email || ''
  return source.slice(0, 2).toUpperCase() || '?'
}

// YYYY-MM-DD for a Date in its local calendar
export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Time zone for display: the user's preference, falling back to the browser's (undefined = browser)
export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// YYYY-MM-DD of an ISO instant as seen in `timeZone`
export const dateKeyOf = (iso, timeZone) => new Date(iso).toLocaleDateString('en-CA', { timeZone: timeZone || undefined })

// "07 May 2026"
export const formatDate = (iso, timeZone) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: timeZone || undefined })

// "07 May 2026, 14:30"
export const formatDateTime = (iso, timeZone) =>
  `${formatDate(iso, timeZone)}, ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timeZone || undefined })}`

// "Today" / "Yesterday" / "05 May 2026"
export function formatDayHeading(iso, now, labels, timeZone) {
  const key = dateKeyOf(iso, timeZone)
  const today = dateKeyOf(now.toISOString(), timeZone)
  const yesterday = dateKeyOf(new Date(now.getTime() - 24 * MS_HOUR).toISOString(), timeZone)
  if (key === today) return labels.today
  if (key === yesterday) return labels.yesterday
  return formatDate(iso, timeZone)
}

// "HK" from first + last name; one name -> its first two letters; falls back to username/email
export function getProfileInitials(profile, user) {
  const first = profile?.firstName?.trim()
  const last = profile?.lastName?.trim()
  if (first && last) return (first[0] + last[0]).toUpperCase()
  if (first) return first.slice(0, 2).toUpperCase()
  return getInitials(user)
}

export const fullName = (profile) => [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
