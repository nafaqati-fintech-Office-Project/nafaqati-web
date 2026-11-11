import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_DAYS,
  periodDays,
  periodFromParams,
  periodLabel,
  previousPeriod,
  rangeProblem,
  shiftPeriod,
  wholeMonth,
} from '../src/utils/period.js'
import { buildPeriodComparison } from '../src/utils/periodComparison.js'
import { weeklySpending } from '../src/features/reports/reportUtils.js'

test('a whole calendar month is recognised; any other range is not', () => {
  assert.equal(wholeMonth({ from: '2026-02-01', to: '2026-02-28' }), '2026-02')
  assert.equal(wholeMonth({ from: '2026-02-01', to: '2026-02-27' }), null)
  assert.equal(wholeMonth({ from: '2026-11-03', to: '2026-11-30' }), null)
})

test('the previous period is the previous month, or the same number of days just before', () => {
  assert.deepEqual(previousPeriod({ from: '2026-03-01', to: '2026-03-31' }), { from: '2026-02-01', to: '2026-02-28' })
  assert.deepEqual(previousPeriod({ from: '2026-01-01', to: '2026-01-31' }), { from: '2025-12-01', to: '2025-12-31' })
  assert.deepEqual(previousPeriod({ from: '2026-11-08', to: '2026-11-14' }), { from: '2026-11-01', to: '2026-11-07' })
  assert.deepEqual(previousPeriod({ from: '2026-03-01', to: '2026-03-10' }), { from: '2026-02-19', to: '2026-02-28' })
})

test('the arrows move a month by a month and a range by its own length', () => {
  assert.deepEqual(shiftPeriod({ from: '2026-12-01', to: '2026-12-31' }, 1), { from: '2027-01-01', to: '2027-01-31' })
  assert.deepEqual(shiftPeriod({ from: '2026-11-01', to: '2026-11-07' }, -1), { from: '2026-10-25', to: '2026-10-31' })
})

test('days are inclusive', () => {
  assert.equal(periodDays({ from: '2026-11-11', to: '2026-11-11' }), 1)
  assert.equal(periodDays({ from: '2024-01-01', to: '2024-12-31' }), 366)
})

test('typed ranges are checked: order, future start, at most 366 days', () => {
  const today = '2026-11-11'
  assert.equal(rangeProblem({ from: '2026-11-01', to: '2026-11-10' }, today), null)
  assert.equal(rangeProblem({ from: '2026-11-10', to: '2026-11-01' }, today), 'order')
  assert.equal(rangeProblem({ from: '2026-12-01', to: '2026-12-05' }, today), 'future')
  assert.equal(rangeProblem({ from: '2025-01-01', to: '2026-11-01' }, today), 'tooLong')
  assert.equal(rangeProblem({ from: '', to: '2026-11-01' }, today), 'missing')
  assert.equal(MAX_DAYS, 366)
})

test('the URL keeps a valid period and falls back otherwise', () => {
  const fallback = { from: '2026-11-01', to: '2026-11-30' }
  const of = (q) => periodFromParams(new URLSearchParams(q), fallback)
  assert.deepEqual(of('from=2026-10-05&to=2026-10-20'), { from: '2026-10-05', to: '2026-10-20' })
  assert.deepEqual(of('from=2026-10-20&to=2026-10-05'), fallback)
  assert.deepEqual(of('from=nope&to=2026-10-05'), fallback)
  assert.deepEqual(of(''), fallback)
})

test('labels read as a month or as a range', () => {
  assert.equal(periodLabel({ from: '2026-11-01', to: '2026-11-30' }), 'November 2026')
  assert.equal(periodLabel({ from: '2026-11-03', to: '2026-11-15' }), 'Nov 3 – Nov 15, 2026')
  assert.equal(periodLabel({ from: '2026-11-05', to: '2026-11-05' }), 'Nov 5, 2026')
})

test('a custom range comparison has the monthly-comparison shape', () => {
  const report = buildPeriodComparison({
    income: { currencies: [{ currency: 'PKR', totalIncome: 1000, totalExpenses: 600, net: 400 }] },
    spending: {
      currencies: [{ currency: 'PKR', totalSpent: 600, categories: [{ category: 'Groceries', categoryCode: 'GROCERIES', total: 400, count: 3 }, { category: 'Fuel', categoryCode: 'FUEL', total: 200, count: 1 }] }],
    },
    previousIncome: { currencies: [{ currency: 'PKR', totalIncome: 0, totalExpenses: 300, net: -300 }] },
    previousSpending: { currencies: [{ currency: 'PKR', totalSpent: 300, categories: [{ category: 'Fuel', categoryCode: 'FUEL', total: 300, count: 2 }] }] },
  })
  const pkr = report.currencies[0]
  assert.equal(pkr.currency, 'PKR')
  assert.deepEqual(pkr.current.categories.map((c) => c.categoryCode), ['GROCERIES', 'FUEL'])
  assert.deepEqual(pkr.delta.totalExpenses, { amount: 300, percent: 100 })
  assert.deepEqual(pkr.delta.totalIncome, { amount: 1000, percent: null }) // nothing to compare with
  const fuel = pkr.delta.categories.find((c) => c.categoryCode === 'FUEL')
  assert.equal(fuel.percent, -33.33)
  const groceries = pkr.delta.categories.find((c) => c.categoryCode === 'GROCERIES')
  assert.equal(groceries.percent, null)
})

test('weekly spending marks weeks that run outside a custom range', () => {
  const items = [
    { currency: 'PKR', amount: 100, categoryId: 'GROCERIES', occurredAt: '2026-11-03T10:00:00Z' },
    { currency: 'PKR', amount: 50, categoryId: 'GROCERIES', occurredAt: '2026-11-10T10:00:00Z' },
  ]
  const weeks = weeklySpending(items, 'PKR', { from: '2026-11-01', to: '2026-11-14' }, 'UTC')
  assert.deepEqual(weeks.map((w) => [w.start, w.amount, w.partial]), [
    ['2026-11-01', 100, false],
    ['2026-11-08', 50, false],
  ])
  const partial = weeklySpending(items, 'PKR', { from: '2026-11-03', to: '2026-11-12' }, 'UTC')
  assert.ok(partial.every((w) => w.partial))
})
