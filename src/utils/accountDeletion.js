// Account deletion helpers (no React, no network): tested in tests/accountDeletion.test.js.

// Typed to confirm. One fixed word, the same as in the mobile app.
export const CONFIRM_WORD = 'DELETE'

export const isConfirmed = (typed) => String(typed ?? '').trim().toUpperCase() === CONFIRM_WORD

// The request the user can still cancel (status REQUESTED), from the newest-first list; null when none.
export function openRequest(requests) {
  if (!Array.isArray(requests)) return null
  return requests.find((request) => request?.status === 'REQUESTED') ?? null
}

// "12 December 2026"; the raw value if it is not a date.
export function deletionDate(purgeAfter, locale = 'en-GB') {
  const date = new Date(purgeAfter)
  if (Number.isNaN(date.getTime())) return String(purgeAfter ?? '')
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
