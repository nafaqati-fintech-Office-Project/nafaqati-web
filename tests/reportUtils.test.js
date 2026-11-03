import test from 'node:test'
import assert from 'node:assert/strict'
import {
  averagePerDay,
  biggestExpense,
  categoryRows,
  daysCounted,
  lifestyleGroup,
  lifestyleShares,
  merchantTotals,
  savingsRatePercent,
} from '../src/features/reports/reportUtils.js'

const categories = [
  { categoryCode: 'ENTERTAINMENT', category: 'Entertainment', total: 300, count: 2 },
  { categoryCode: 'GROCERIES', category: 'Groceries', total: 600, count: 5 },
  { categoryCode: 'CHARITY', category: 'Charity', total: 100, count: 1 },
  { categoryCode: 'FUEL', category: 'Fuel', total: 0, count: 0 },
]

test('lifestyleGroup splits needs, wants and the rest', () => {
  assert.equal(lifestyleGroup('GROCERIES'), 'essentials')
  assert.equal(lifestyleGroup('SUBSCRIPTIONS'), 'lifestyle')
  assert.equal(lifestyleGroup('CHARITY'), 'other')
  assert.equal(lifestyleGroup(null), 'other')
})

test('categoryRows lists the largest first with shares and skips empty categories', () => {
  const rows = categoryRows(categories)
  assert.deepEqual(rows.map((r) => r.code), ['GROCERIES', 'ENTERTAINMENT', 'CHARITY'])
  assert.deepEqual(rows.map((r) => r.percent), [60, 30, 10])
  assert.deepEqual(categoryRows(undefined), [])
})

test('lifestyleShares always returns the three groups', () => {
  assert.deepEqual(lifestyleShares(categories), [
    { group: 'essentials', amount: 600, percent: 60 },
    { group: 'lifestyle', amount: 300, percent: 30 },
    { group: 'other', amount: 100, percent: 10 },
  ])
  assert.ok(lifestyleShares([]).every((s) => s.percent === 0))
})

const tx = (name, amount, categoryId = 'GROCERIES', currency = 'PKR') => ({ merchant: { name }, amount, currency, categoryId })

test('merchantTotals groups by shop, ignores other currencies and rows without a name', () => {
  const items = [tx('Panda', 500), tx('panda', 100), tx('Netflix', 300, 'ENTERTAINMENT'), tx('Other', 9999, 'TRAVEL', 'SAR'), tx('', 50)]
  const rows = merchantTotals(items, 'PKR')
  assert.deepEqual(rows.map((r) => [r.name, r.amount, r.count]), [['Panda', 600, 2], ['Netflix', 300, 1]])
  assert.equal(rows[0].categoryId, 'GROCERIES')
})

test('biggestExpense is the largest in the currency, or null', () => {
  assert.equal(biggestExpense([tx('A', 5), tx('B', 50), tx('C', 999, 'X', 'SAR')], 'PKR').merchant.name, 'B')
  assert.equal(biggestExpense([], 'PKR'), null)
})

test('daysCounted uses the days so far in the current month, all days in a past month', () => {
  assert.equal(daysCounted('2026-10', '2026-10-20'), 20)
  assert.equal(daysCounted('2026-09', '2026-10-20'), 30)
  assert.equal(daysCounted('2028-02', '2028-03-01'), 29)
})

test('averagePerDay and savingsRatePercent', () => {
  assert.equal(averagePerDay(1000, 20), 50)
  assert.equal(averagePerDay(1000, 0), 0)
  assert.equal(savingsRatePercent(2000, 1000), 50)
  assert.equal(savingsRatePercent(1000, -500), -50)
  assert.equal(savingsRatePercent(0, -500), null)
})
