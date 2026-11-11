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

// ---- the pages added from the client's spending report ----
import {
  csvCell,
  debtSummary,
  moneyMovement,
  paymentMethods,
  reportCsv,
  spendingItems,
  weeklySpending,
} from '../src/features/reports/reportUtils.js'

const item = (iso, amount, categoryId, description = null, currency = 'SAR') => ({
  amount,
  currency,
  categoryId,
  description,
  merchant: { name: 'Shop' },
  occurredAt: iso,
})

test('spendingItems leaves out money moved between own accounts', () => {
  const rows = [item('2026-10-02T09:00:00Z', 10, 'GROCERIES'), item('2026-10-03T09:00:00Z', 500, 'INTERNAL_TRANSFERS')]
  assert.deepEqual(spendingItems(rows).map((r) => r.categoryId), ['GROCERIES'])
})

test('weeklySpending adds up everyday spending per Sunday-start week and marks a week that runs into another month', () => {
  // 1 Oct 2026 is a Thursday, so the first week starts on Sunday 27 Sep
  const weeks = weeklySpending(
    [
      item('2026-10-01T10:00:00Z', 10, 'GROCERIES'),
      item('2026-10-03T10:00:00Z', 20, 'FUEL'),
      item('2026-10-04T10:00:00Z', 5, 'GROCERIES'),
      item('2026-10-05T10:00:00Z', 400, 'TRANSFERS'),
    ],
    'SAR',
    '2026-10',
    'UTC',
  )
  assert.deepEqual(weeks, [
    { start: '2026-09-27', amount: 30, partial: true },
    { start: '2026-10-04', amount: 5, partial: false },
  ])
})

test('paymentMethods groups spending by the card in the description', () => {
  const methods = paymentMethods(
    [
      item('2026-10-02T10:00:00Z', 60, 'GROCERIES', 'SNB · card ****4821'),
      item('2026-10-03T10:00:00Z', 20, 'FUEL', 'SNB · card ****4821'),
      item('2026-10-04T10:00:00Z', 20, 'FUEL', null),
      item('2026-10-05T10:00:00Z', 900, 'TRANSFERS', 'SNB · card ****4821'),
    ],
    'SAR',
  )
  assert.deepEqual(methods, [
    { card: '4821', amount: 80, count: 2, percent: 80 },
    { card: null, amount: 20, count: 1, percent: 20 },
  ])
})

test('moneyMovement separates everyday spending from transfers and cash', () => {
  const categories = [
    { categoryCode: 'TRANSFERS', total: 300 },
    { categoryCode: 'CASH_WITHDRAWALS', total: 100 },
    { categoryCode: 'GROCERIES', total: 600 },
  ]
  assert.deepEqual(moneyMovement(categories, 1000, 1500), { dayToDay: 700, transfers: 300, cash: 100, income: 1500 })
})

test('debtSummary works out what loans take of income and spending', () => {
  const categories = [{ categoryCode: 'LOANS_EMI', total: 250 }]
  assert.deepEqual(debtSummary(categories, 1000, 2000), { loans: 250, percentOfIncome: 13, percentOfSpending: 25 })
  assert.equal(debtSummary(categories, 1000, 0).percentOfIncome, null)
  assert.equal(debtSummary([], 1000, 2000).loans, 0)
})

test('Personal care counts as lifestyle spending', () => {
  assert.equal(lifestyleGroup('PERSONAL_CARE'), 'lifestyle')
})

test('csvCell quotes special cells and stops Excel formulas', () => {
  assert.equal(csvCell('a,b'), '"a,b"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)")
  assert.equal(csvCell('Panda'), 'Panda')
})

test('reportCsv has a header, one line per row and the byte order mark Excel needs', () => {
  const labels = { date: 'Date', merchant: 'Merchant', description: 'Description', category: 'Category', amount: 'Amount', currency: 'Currency' }
  const rows = [{ ...item('2026-10-03T09:15:00Z', 28.5, 'GROCERIES', 'SNB · card ****4821'), merchant: { name: 'Panda, Riyadh' } }]
  const csv = reportCsv(rows, 'SAR', labels, () => 'Groceries', 'UTC')
  const lines = csv.split(String.fromCharCode(13, 10))
  assert.equal(csv.charCodeAt(0), 0xfeff)
  assert.equal(lines[0].slice(1), 'Date,Merchant,Description,Category,Amount,Currency')
  assert.equal(lines[1], '2026-10-03 09:15,"Panda, Riyadh",SNB · card ****4821,Groceries,28.5,SAR')
})
