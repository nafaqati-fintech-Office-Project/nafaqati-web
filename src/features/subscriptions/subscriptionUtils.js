// Pure helpers for the Subscriptions feature (no React): formatting, grouping, sync and error rules.
// Statuses, cycles and sync states are exactly the backend enum names (subscription-service API.md).

export const STATUSES = ['DETECTED', 'CONFIRMED', 'ENDED', 'DISMISSED']
export const CYCLES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']

// "SAR 55.00": code + 2 decimals (the API's money has 2 decimals), Western digits in every language
export function formatMoney(amount, currency) {
  const number = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${currency} ${number}` : number
}

// "2026-05-08" is a calendar day (the service counts days in Asia/Riyadh): show it as that day, never shifted by a zone
export function formatCalendarDate(ymd, lang = 'en') {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// 0.00..1.00 -> a word, never the raw decimal
export function confidenceLevel(confidence) {
  const value = Number(confidence)
  if (value >= 0.8) return 'high'
  if (value >= 0.6) return 'medium'
  return 'low'
}

// The tabs: Active = CONFIRMED, Cancelled = ENDED + DISMISSED, review = DETECTED (needs the user's decision)
export function splitSubscriptions(items = []) {
  return {
    review: items.filter((s) => s.status === 'DETECTED'),
    active: items.filter((s) => s.status === 'CONFIRMED'),
    cancelled: items.filter((s) => s.status === 'ENDED' || s.status === 'DISMISSED'),
  }
}

// Summary rows per currency (never added together), biggest first; empty when nothing is confirmed
export function currencyRows(summary) {
  return [...(summary?.currencies ?? [])].sort((a, b) => b.monthlyTotal - a.monthlyTotal)
}

// Replace one subscription in a list with its fresh copy from a response
export const replaceItem = (items, fresh) => items.map((s) => (s.id === fresh.id ? fresh : s))

// Sync: only DONE is final. Anything else must never look like an empty account.
export const SYNC_RETRY_DELAYS_MS = [4000, 8000, 16000, 30000]
export function syncDelay(attempt) {
  return SYNC_RETRY_DELAYS_MS[attempt] ?? null // null = stop polling, offer a manual retry
}
export function syncView(syncStatus, attempts) {
  if (!syncStatus || syncStatus === 'DONE') return 'done'
  if (syncDelay(attempts) === null) return 'timedOut'
  return syncStatus === 'FAILED' ? 'failed' : 'syncing'
}

// Error -> the key of a friendly message in SUBSCRIPTION_TEXT.errors. Server messages are never shown.
export function errorKey(error, action) {
  const status = error?.response?.status ?? 0
  const detail = String(error?.response?.data?.detail ?? '')
  if (status === 0) return error?.code === 'ECONNABORTED' ? 'slow' : 'network'
  if (status === 401) return 'session'
  if (status === 404) return 'notFound'
  if (status === 429) return 'rateLimited'
  if (status === 422) return 'endDate'
  if (status === 409) {
    if (/modified concurrently/i.test(detail)) return 'concurrent'
    if (action === 'confirm' && /DISMISSED/.test(detail)) return 'dismissedConfirm'
    return 'notAllowed'
  }
  return 'generic'
}

// POST 409 for a duplicate carries the id of the existing subscription
export const existingIdOf = (error) =>
  error?.response?.status === 409 ? error.response.data?.existingSubscriptionId ?? null : null

// Amount rule of the API: greater than 0, at most 2 decimals
export function validAmount(value) {
  const text = String(value ?? '').trim()
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0
}
