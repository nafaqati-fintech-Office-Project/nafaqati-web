import { formatDate } from './format.js'

const UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

// "5 minutes ago" / "منذ 5 دقائق" in the app language; older than a week: the date in the user's time zone
export function formatRelative(iso, { lang = 'en', timeZone, justNow = 'Just now', now = Date.now() } = {}) {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000)
  if (seconds < 45) return justNow
  if (seconds >= 7 * 86400) return formatDate(iso, timeZone)
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return rtf.format(-Math.floor(seconds / size), unit)
  }
  return rtf.format(-1, 'minute')
}
