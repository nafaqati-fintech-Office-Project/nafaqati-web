// The comparison rows, in display order. `key` is the server's entitlement key (billing-service plan data); rows without a
// key are standard features every plan has.
export const FEATURE_ROWS = [
  { id: 'transactions', key: null },
  { id: 'history', key: 'history.days', unit: 'days' },
  { id: 'budgets', key: null },
  { id: 'goals', key: null },
  { id: 'reports', key: null },
  { id: 'advancedReports', key: 'reports.advanced' },
  { id: 'smsImport', key: 'sms.initial_import.limit', unit: 'messages' },
  { id: 'receiptOcr', key: 'receipt.ocr' },
  { id: 'cardFilter', key: 'transactions.card_filter' },
  { id: 'export', key: 'reports.export' },
  { id: 'family', key: 'family.module' },
]

// What one cell shows: { kind: 'yes' | 'no' | 'unlimited' | 'limit', value? }.
export function cellFor(row, entitlements) {
  if (!row.key) return { kind: 'yes' }
  const value = entitlements?.[row.key]
  if (value === 'unlimited') return { kind: 'unlimited' }
  if (typeof value === 'number') return value > 0 ? { kind: 'limit', value } : { kind: 'no' }
  return value === true ? { kind: 'yes' } : { kind: 'no' }
}

// The price of the plan for a currency and interval, falling back to the first currency on offer.
export function pickPrices(prices, currency) {
  const list = Array.isArray(prices) ? prices : []
  const code = list.some((p) => p.currency === currency) ? currency : list[0]?.currency
  const find = (interval) => list.find((p) => p.currency === code && p.interval === interval)
  const monthly = find('MONTHLY')
  const yearly = find('YEARLY')
  return code && monthly && yearly ? { currency: code, monthly: monthly.amount, yearly: yearly.amount } : null
}

// Whole months the yearly price saves over twelve monthly payments.
export function monthsFree(price) {
  if (!price || !(price.monthly > 0)) return 0
  return Math.max(0, Math.floor((price.monthly * 12 - price.yearly) / price.monthly))
}

// Whether an entitlement value lets the user use the feature: on, unlimited, or a limit above zero.
export const isAllowed = (value) => value === true || value === 'unlimited' || (typeof value === 'number' && value > 0)
