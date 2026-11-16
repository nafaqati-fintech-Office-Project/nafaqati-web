import test from 'node:test'
import assert from 'node:assert/strict'
import { FEATURE_ROWS, cellFor, monthsFree, pickPrices } from '../src/features/plans/planUtils.js'

const row = (id) => FEATURE_ROWS.find((r) => r.id === id)

test('standard features are on every plan', () => {
  assert.deepEqual(cellFor(row('budgets'), {}), { kind: 'yes' })
})

test('on/off, limited and unlimited entitlements', () => {
  assert.deepEqual(cellFor(row('receiptOcr'), { 'receipt.ocr': true }), { kind: 'yes' })
  assert.deepEqual(cellFor(row('receiptOcr'), { 'receipt.ocr': false }), { kind: 'no' })
  assert.deepEqual(cellFor(row('history'), { 'history.days': 90 }), { kind: 'limit', value: 90 })
  assert.deepEqual(cellFor(row('history'), { 'history.days': 'unlimited' }), { kind: 'unlimited' })
  assert.deepEqual(cellFor(row('smsImport'), undefined), { kind: 'no' })
})

test('picks the prices for a currency and falls back to the first one offered', () => {
  const prices = [
    { interval: 'MONTHLY', currency: 'SAR', amount: 19 },
    { interval: 'YEARLY', currency: 'SAR', amount: 190 },
    { interval: 'MONTHLY', currency: 'PKR', amount: 999 },
    { interval: 'YEARLY', currency: 'PKR', amount: 9999 },
  ]
  assert.deepEqual(pickPrices(prices, 'PKR'), { currency: 'PKR', monthly: 999, yearly: 9999 })
  assert.equal(pickPrices(prices, 'USD').currency, 'SAR')
  assert.equal(pickPrices([], 'SAR'), null)
})

test('works out the months saved by paying yearly', () => {
  assert.equal(monthsFree({ monthly: 19, yearly: 190 }), 2)
  assert.equal(monthsFree({ monthly: 10, yearly: 120 }), 0)
  assert.equal(monthsFree(null), 0)
})
