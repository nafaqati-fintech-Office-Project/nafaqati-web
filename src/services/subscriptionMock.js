// In-memory stand-in for subscription-service with the SAME response shapes (see subscriptionTypes.js).
// Only used when VITE_SUBSCRIPTIONS_MOCK=true. Scenario: ?mock=multi (default) | empty | syncing | failed.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
const scenario = () => new URLSearchParams(window.location.search).get('mock') || 'multi'

const fail = (status, data = {}) => Promise.reject({ response: { status, data, headers: {} } })

const sub = (over) => ({
  source: 'DETECTED',
  confidence: 0.9,
  occurrenceCount: 3,
  overdue: false,
  ...over,
})

let store = null
let syncCalls = 0
const seed = () => {
  const s = scenario()
  if (s === 'empty' || s === 'syncing' || s === 'failed') return []
  return [
    sub({ id: 's1', merchantKey: 'netflix', displayName: 'Netflix', amount: 55, currency: 'SAR', cycle: 'MONTHLY', status: 'CONFIRMED', confidence: 0.95, firstChargeDate: '2026-02-08', lastChargeDate: '2026-10-08', nextExpectedDate: '2026-11-08', occurrenceCount: 9, monthlyCost: 55, yearlyCost: 660, previousAmount: 49, priceChangedAt: '2026-10-08' }),
    sub({ id: 's2', merchantKey: 'spotify', displayName: 'Spotify', amount: 24.99, currency: 'SAR', cycle: 'MONTHLY', status: 'CONFIRMED', firstChargeDate: '2026-03-10', lastChargeDate: '2026-10-10', nextExpectedDate: '2026-11-10', occurrenceCount: 8, monthlyCost: 24.99, yearlyCost: 299.88 }),
    sub({ id: 's3', merchantKey: 'microsoft365', displayName: 'Microsoft 365', amount: 1200, currency: 'PKR', cycle: 'YEARLY', status: 'CONFIRMED', source: 'MANUAL', confidence: 1, firstChargeDate: '2025-10-12', lastChargeDate: '2025-10-12', nextExpectedDate: '2026-10-12', occurrenceCount: 1, monthlyCost: 100, yearlyCost: 1200, overdue: true }),
    sub({ id: 's4', merchantKey: 'gym', displayName: 'Gym Membership', amount: 90, currency: 'SAR', cycle: 'MONTHLY', status: 'CONFIRMED', source: 'MANUAL', confidence: 1, firstChargeDate: '2026-05-20', lastChargeDate: '2026-10-20', nextExpectedDate: '2026-11-20', occurrenceCount: 6, monthlyCost: 90, yearlyCost: 1080 }),
    sub({ id: 's5', merchantKey: 'icloud', displayName: 'iCloud', amount: 12.99, currency: 'SAR', cycle: 'MONTHLY', status: 'DETECTED', confidence: 0.88, firstChargeDate: '2026-08-16', lastChargeDate: '2026-10-16', nextExpectedDate: '2026-11-16', monthlyCost: 12.99, yearlyCost: 155.88 }),
    sub({ id: 's6', merchantKey: 'unknown-shop', displayName: 'Al Noor Store', amount: 40, currency: 'PKR', cycle: 'MONTHLY', status: 'DETECTED', confidence: 0.55, firstChargeDate: '2026-07-30', lastChargeDate: '2026-09-30', nextExpectedDate: '2026-10-30', monthlyCost: 40, yearlyCost: 480 }),
    sub({ id: 's7', merchantKey: 'youtube', displayName: 'YouTube Premium', amount: 28, currency: 'SAR', cycle: 'MONTHLY', status: 'ENDED', firstChargeDate: '2026-01-15', lastChargeDate: '2026-08-15', nextExpectedDate: '2026-09-15', occurrenceCount: 8, monthlyCost: 28, yearlyCost: 336 }),
    sub({ id: 's8', merchantKey: 'hulu', displayName: 'Hulu', amount: 15, currency: 'PKR', cycle: 'MONTHLY', status: 'DISMISSED', firstChargeDate: '2026-06-01', lastChargeDate: '2026-08-01', nextExpectedDate: '2026-09-01', monthlyCost: 15, yearlyCost: 180 }),
  ]
}
const items = () => (store ??= seed())

const syncStatus = () => {
  const s = scenario()
  if (s === 'failed') return 'FAILED'
  if (s === 'syncing') return syncCalls >= 4 ? 'DONE' : 'IN_PROGRESS'
  return 'DONE'
}

const find = (id) => items().find((s) => s.id === id)

const buildSummary = () => {
  const rows = new Map()
  items()
    .filter((s) => s.status === 'CONFIRMED')
    .forEach((s) => {
      const r = rows.get(s.currency) ?? { currency: s.currency, monthlyTotal: 0, yearlyTotal: 0, activeCount: 0 }
      r.monthlyTotal = Math.round((r.monthlyTotal + s.monthlyCost) * 100) / 100
      r.yearlyTotal = Math.round((r.yearlyTotal + s.yearlyCost) * 100) / 100
      r.activeCount += 1
      rows.set(s.currency, r)
    })
  const counts = { DETECTED: 0, CONFIRMED: 0, DISMISSED: 0, ENDED: 0 }
  items().forEach((s) => (counts[s.status] += 1))
  return {
    currencies: [...rows.values()],
    countsByStatus: counts,
    needsReview: counts.DETECTED,
    upcoming: items()
      .filter((s) => s.status === 'CONFIRMED')
      .sort((a, b) => a.nextExpectedDate.localeCompare(b.nextExpectedDate))
      .slice(0, 3)
      .map(({ id, displayName, amount, currency, nextExpectedDate }) => ({ id, displayName, amount, currency, nextExpectedDate })),
    syncStatus: syncStatus(),
  }
}

export async function list(statuses) {
  await delay(scenario() === 'syncing' ? 1500 : 300)
  syncCalls += 1
  const wanted = statuses?.length ? statuses : ['DETECTED', 'CONFIRMED', 'ENDED']
  return { syncStatus: syncStatus(), items: items().filter((s) => wanted.includes(s.status)) }
}
export async function getSummaryMock() {
  await delay()
  return buildSummary()
}
export { getSummaryMock as summary }

export async function get(id) {
  await delay()
  return find(id) ?? fail(404, { detail: 'Subscription not found' })
}
export async function create(body) {
  await delay(400)
  const key = body.displayName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!key) return fail(400, { fieldErrors: [{ field: 'displayName', message: 'unusable' }] })
  const existing = items().find((s) => s.merchantKey.replace(/[^a-z0-9]/g, '') === key && s.currency === body.currency)
  if (existing) return fail(409, { detail: 'A subscription for this merchant and currency already exists', existingSubscriptionId: existing.id })
  const monthly = { WEEKLY: (body.amount * 52) / 12, MONTHLY: body.amount, QUARTERLY: body.amount / 3, YEARLY: body.amount / 12 }[body.cycle]
  const created = sub({ id: `m${Date.now()}`, merchantKey: key, displayName: body.displayName.trim(), amount: body.amount, currency: body.currency, cycle: body.cycle, status: 'CONFIRMED', source: 'MANUAL', confidence: 1, firstChargeDate: body.startDate, lastChargeDate: body.startDate, nextExpectedDate: body.startDate, occurrenceCount: 1, monthlyCost: Math.round(monthly * 100) / 100, yearlyCost: Math.round(monthly * 1200) / 100 })
  items().push(created)
  return created
}
export async function update(id, body) {
  await delay()
  const s = find(id)
  if (!s) return fail(404, { detail: 'Subscription not found' })
  if (s.status === 'ENDED' || s.status === 'DISMISSED') return fail(409, { detail: `Cannot change a subscription that is ${s.status}` })
  if (body.amount != null && body.amount !== s.amount) {
    s.previousAmount = s.amount
    s.priceChangedAt = '2026-10-14'
  }
  Object.assign(s, body)
  return s
}
const transition = (id, from, to, verb) => async () => {
  await delay()
  const s = find(id)
  if (!s) return fail(404, { detail: 'Subscription not found' })
  if (s.status === to) return s
  if (!from.includes(s.status)) return fail(409, { detail: `Cannot ${verb} a subscription that is ${s.status}` })
  s.status = to
  return s
}
export const confirm = (id) => transition(id, ['DETECTED'], 'CONFIRMED', 'confirm')()
export const dismiss = (id) => transition(id, ['DETECTED', 'CONFIRMED'], 'DISMISSED', 'dismiss')()
export const end = (id) => transition(id, ['CONFIRMED'], 'ENDED', 'end')()
