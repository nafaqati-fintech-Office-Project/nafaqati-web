import test from 'node:test'
import assert from 'node:assert/strict'
import {
  confidenceLevel,
  currencyRows,
  errorKey,
  existingIdOf,
  formatCalendarDate,
  formatMoney,
  replaceItem,
  splitSubscriptions,
  syncDelay,
  syncView,
  validAmount,
} from '../src/features/subscriptions/subscriptionUtils.js'
import { withBackoff } from '../src/services/backoff.js'

const err = (status, data = {}, headers = {}) => ({ response: { status, data, headers } })

test('formatMoney: code + 2 decimals, Western digits', () => {
  assert.equal(formatMoney(55, 'SAR'), 'SAR 55.00')
  assert.equal(formatMoney(1234.5, 'PKR'), 'PKR 1,234.50')
  assert.equal(formatMoney(0.1 + 0.2, 'SAR'), 'SAR 0.30')
})

test('formatCalendarDate: a calendar day is never shifted by a time zone', () => {
  assert.equal(formatCalendarDate('2026-11-08', 'en'), '8 Nov 2026')
  assert.equal(formatCalendarDate('2026-01-01', 'en'), '1 Jan 2026')
  assert.match(formatCalendarDate('2026-11-08', 'ar'), /2026|٢٠٢٦/)
  assert.equal(formatCalendarDate(undefined), '')
})

test('confidenceLevel: words, thresholds 0.8 and 0.6', () => {
  assert.equal(confidenceLevel(1), 'high')
  assert.equal(confidenceLevel(0.8), 'high')
  assert.equal(confidenceLevel(0.79), 'medium')
  assert.equal(confidenceLevel(0.6), 'medium')
  assert.equal(confidenceLevel(0.55), 'low')
})

test('splitSubscriptions: review / active / cancelled (ended + dismissed)', () => {
  const items = [
    { id: 1, status: 'DETECTED' },
    { id: 2, status: 'CONFIRMED' },
    { id: 3, status: 'ENDED' },
    { id: 4, status: 'DISMISSED' },
  ]
  const g = splitSubscriptions(items)
  assert.deepEqual(g.review.map((s) => s.id), [1])
  assert.deepEqual(g.active.map((s) => s.id), [2])
  assert.deepEqual(g.cancelled.map((s) => s.id), [3, 4])
  assert.deepEqual(splitSubscriptions(), { review: [], active: [], cancelled: [] })
})

test('currencyRows: one row per currency, never added together', () => {
  const rows = currencyRows({
    currencies: [
      { currency: 'SAR', monthlyTotal: 8.33, yearlyTotal: 100, activeCount: 1 },
      { currency: 'PKR', monthlyTotal: 73.33, yearlyTotal: 880, activeCount: 2 },
    ],
  })
  assert.equal(rows.length, 2)
  assert.deepEqual(rows.map((r) => r.currency), ['PKR', 'SAR'])
  assert.equal(rows[0].monthlyTotal, 73.33)
  assert.deepEqual(currencyRows(null), [])
})

test('replaceItem swaps only the matching subscription', () => {
  const next = replaceItem([{ id: 'a', status: 'DETECTED' }, { id: 'b', status: 'DETECTED' }], { id: 'a', status: 'CONFIRMED' })
  assert.deepEqual(next.map((s) => s.status), ['CONFIRMED', 'DETECTED'])
})

test('sync states: only DONE is final, polling backs off and then stops', () => {
  assert.equal(syncView('DONE', 0), 'done')
  assert.equal(syncView(undefined, 0), 'done')
  assert.equal(syncView('IN_PROGRESS', 0), 'syncing')
  assert.equal(syncView('NOT_STARTED', 1), 'syncing')
  assert.equal(syncView('FAILED', 2), 'failed')
  assert.equal(syncView('FAILED', 4), 'timedOut')
  assert.deepEqual([0, 1, 2, 3, 4].map(syncDelay), [4000, 8000, 16000, 30000, null])
})

test('errorKey: friendly keys, never the server text', () => {
  assert.equal(errorKey(err(409, { detail: 'Cannot confirm a subscription that is DISMISSED' }), 'confirm'), 'dismissedConfirm')
  assert.equal(errorKey(err(409, { detail: 'Cannot end a subscription that is DETECTED' }), 'end'), 'notAllowed')
  assert.equal(errorKey(err(409, { detail: 'The subscription was modified concurrently; please retry' }), 'confirm'), 'concurrent')
  assert.equal(errorKey(err(404), 'get'), 'notFound')
  assert.equal(errorKey(err(422), 'end'), 'endDate')
  assert.equal(errorKey(err(429), 'confirm'), 'rateLimited')
  assert.equal(errorKey(err(401), 'list'), 'session')
  assert.equal(errorKey(err(500, { detail: 'java.lang.NullPointerException at ...' }), 'list'), 'generic')
  assert.equal(errorKey(err(503), 'list'), 'generic')
  assert.equal(errorKey({}, 'list'), 'network')
  assert.equal(errorKey({ code: 'ECONNABORTED' }, 'list'), 'slow')
})

test('existingIdOf: only a 409 carries the existing subscription id', () => {
  assert.equal(existingIdOf(err(409, { existingSubscriptionId: 'abc' })), 'abc')
  assert.equal(existingIdOf(err(409, { detail: 'Cannot confirm' })), null)
  assert.equal(existingIdOf(err(400, { existingSubscriptionId: 'abc' })), null)
})

test('validAmount: > 0 with at most 2 decimals', () => {
  for (const ok of ['1', '12.5', '0.01', '1200.00']) assert.equal(validAmount(ok), true, ok)
  for (const bad of ['', '0', '0.00', '-1', '1.234', 'abc', '1,5']) assert.equal(validAmount(bad), false, bad)
})

test('withBackoff: retries 429 with growing waits, then succeeds', async () => {
  const waits = []
  let calls = 0
  const value = await withBackoff(
    async () => {
      calls += 1
      if (calls < 3) throw err(429)
      return 'ok'
    },
    { wait: async (ms) => waits.push(ms) },
  )
  assert.equal(value, 'ok')
  assert.equal(calls, 3)
  assert.deepEqual(waits, [1000, 2000])
})

test('withBackoff: honours Retry-After, gives up after 3 retries, never retries other errors', async () => {
  const waits = []
  let calls = 0
  await assert.rejects(
    withBackoff(
      async () => {
        calls += 1
        throw err(429, {}, { 'retry-after': '2' })
      },
      { wait: async (ms) => waits.push(ms) },
    ),
    (e) => e.response.status === 429,
  )
  assert.equal(calls, 4)
  assert.deepEqual(waits, [2000, 2000, 2000])

  let other = 0
  await assert.rejects(
    withBackoff(
      async () => {
        other += 1
        throw err(500)
      },
      { wait: async () => {} },
    ),
  )
  assert.equal(other, 1)
})
