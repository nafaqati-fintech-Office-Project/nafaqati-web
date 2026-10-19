// The backends only accept IANA region IDs ("Asia/Karachi", or "UTC"); offsets like "+05:00" or "UTC+5" get a 400.
// Every `timeZone` we send or format with goes through resolveTimeZone().
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

const isRegionId = (zone) => {
  if (typeof zone !== 'string' || !(zone.includes('/') || zone === 'UTC')) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

// preferences.timezone when it is a region ID, otherwise the browser's zone
export const resolveTimeZone = (preferred) => (isRegionId(preferred) ? preferred : browserZone())

// Offset (ms) of `timeZone` from UTC at the instant `ms`
function zoneOffset(ms, timeZone) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(new Date(ms))
      .map(({ type, value }) => [type, Number(value)]),
  )
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000
}

// "2026-10-13" -> ISO instant of 12:00 that calendar day in `timeZone` (noon stays on the chosen day across DST shifts)
export function noonInstantIso(dateKey, timeZone) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const wall = Date.UTC(y, m - 1, d, 12)
  const zone = resolveTimeZone(timeZone)
  let instant = wall - zoneOffset(wall, zone)
  instant = wall - zoneOffset(instant, zone)
  return new Date(instant).toISOString()
}
