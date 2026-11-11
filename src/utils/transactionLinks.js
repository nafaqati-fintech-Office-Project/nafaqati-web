import { monthRange } from './dateRange.js'

// Drill-down links into the Transactions page. Transactions reads its filters straight from the URL
// (see hooks/useTransactionFilters.js), so a link is all a card or chart needs to show "its" transactions.
//
// opts:
//   month     'YYYY-MM' - the whole month (ignored when from/to are given)
//   from, to  'YYYY-MM-DD' calendar days (inclusive) in the user's time zone
//   day       'YYYY-MM-DD' - a single day
//   type      'income' | 'expense'
//   category  category code (the Transactions category filter uses codes as ids)
//   q         free-text search over merchant and description
export function transactionsLink({ month, from, to, day, type, category, q } = {}) {
  const params = new URLSearchParams()
  const range = day ? { from: day, to: day } : from || to ? { from, to } : month ? monthRange(month) : null
  if (range) {
    params.set('range', 'custom')
    if (range.from) params.set('from', range.from)
    if (range.to) params.set('to', range.to)
  }
  if (type) params.set('type', type)
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  const query = params.toString()
  return query ? `/transactions?${query}` : '/transactions'
}

// Keyboard/mouse props that turn any element (a list row, a tile, a bar) into a link-like button.
// Returns {} when there is no handler, so non-clickable rows render exactly as before.
export function clickableProps(onActivate, label) {
  if (!onActivate) return {}
  return {
    role: 'button',
    tabIndex: 0,
    title: label,
    'aria-label': label,
    'data-clickable': '',
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onActivate()
      }
    },
  }
}
