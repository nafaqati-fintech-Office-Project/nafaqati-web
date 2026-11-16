import test from 'node:test'
import assert from 'node:assert/strict'
import { answerQuestion, cutOptions, detectIntent, findGoal, freeCashFlow, planGoal } from '../src/features/ai-assistant/assistantFacts.js'
import { budgetFrom, monthFrom, toContext } from '../src/features/ai-assistant/assistantShape.js'
import { ASSISTANT_TEXT } from '../src/constants/appText.js'

const side = (overrides = {}) => ({
  totalIncome: 5450,
  totalExpenses: 4250,
  net: 1200,
  categories: [
    { categoryCode: 'HOUSING', category: 'Housing', total: 1500, count: 1 },
    { categoryCode: 'GROCERIES', category: 'Groceries', total: 980, count: 9 },
    { categoryCode: 'FOOD_AND_BEVERAGE', category: 'Food & Beverage', total: 720, count: 20 },
    { categoryCode: 'ENTERTAINMENT', category: 'Entertainment', total: 200, count: 3 },
  ],
  ...overrides,
})

const expenses = {
  capped: false,
  items: [
    ...Array.from({ length: 14 }, () => ({ currency: 'SAR', amount: 28, merchant: { name: 'Starbucks' }, categoryId: 'FOOD_AND_BEVERAGE' })),
    { currency: 'SAR', amount: 980, merchant: { name: 'Panda' }, categoryId: 'GROCERIES' },
  ],
}

const data = (overrides = {}) => ({
  currency: 'SAR',
  today: '2026-11-03',
  months: [monthFrom('2026-11', 'SAR', side(), expenses), monthFrom('2026-10', 'SAR', side(), expenses), monthFrom('2026-09', 'SAR', side(), null)],
  budget: null,
  goals: [{ id: 'g1', name: 'Dubai vacation', currency: 'SAR', target: 6000, saved: 2500, targetDate: '2026-12-03' }],
  subscriptions: [{ name: 'Netflix', currency: 'SAR', monthlyCost: 45, cycle: 'MONTHLY' }],
  ...overrides,
})

const env = {
  text: ASSISTANT_TEXT.en,
  nameOf: (code) => code,
  format: (amount, currency) => `${currency} ${amount.toFixed(2)}`,
  monthLabel: (month) => month,
}

test('intents match the mobile app', () => {
  assert.equal(detectIntent('How much did I spend on coffee last month?'), 'spendOn')
  assert.equal(detectIntent('What are my top 5 expenses?'), 'topExpenses')
  assert.equal(detectIntent('Where can I cut expenses?'), 'cut')
  assert.equal(detectIntent('I want to go to Dubai on vacation in a month'), 'goal')
  assert.equal(detectIntent('ما أكبر 5 مصروفات لدي؟'), 'topExpenses')
})

test('coffee last month adds up coffee shops', () => {
  const answer = answerQuestion('How much did I spend on coffee last month?', data(), env)
  assert.equal(answer.facts[0], 'Spent at Starbucks in 2026-10: SAR 392.00 over 14 payments.')
})

test('top expenses lists merchants largest first', () => {
  const answer = answerQuestion('top 2 expenses', data(), env)
  assert.equal(answer.facts[0], 'Top 2 merchants by spending in 2026-11: 1. Panda SAR 980.00; 2. Starbucks SAR 392.00')
})

test('cuts: lifestyle trimmed by a quarter plus subscriptions, biggest first', () => {
  assert.deepEqual(
    cutOptions(data()).map((c) => [c.name, c.saving]),
    [['Food & Beverage', 18000], ['Entertainment', 5000], ['Netflix', 4500]],
  )
})

test('Dubai goal: the same maths as the mobile app', () => {
  assert.equal(freeCashFlow(data()), 120000)
  const plan = planGoal(data().goals[0], data())
  assert.equal(plan.daysLeft, 30)
  assert.equal(plan.perDay, 11667)
  assert.equal(plan.perWeek, 81667)
  assert.equal(plan.realistic, false)
  assert.equal(plan.gap, 230000)
  assert.deepEqual(plan.cuts.map((c) => c.name), ['Food & Beverage', 'Entertainment', 'Netflix'])
  const answer = answerQuestion('Can I afford the Dubai trip?', data(), env)
  assert.deepEqual(answer.actions[0], { id: 'add_to_goal', goalId: 'g1', goalName: 'Dubai vacation' })
  assert.ok(answer.facts.includes('Needed: SAR 116.67 a day, SAR 816.67 a week, SAR 3500.00 a month.'))
})

test('findGoal picks a named goal or the only one', () => {
  const goals = [data().goals[0], { id: 'g2', name: 'New car' }]
  assert.equal(findGoal('Dubai please', goals).id, 'g1')
  assert.equal(findGoal('my goal', goals), null)
})

test('budget statuses map to over / warning / ok', () => {
  const budget = budgetFrom(
    { totalSpent: 900, totalLimit: 1000, remainingAmount: 100, percentageUsed: 90, categoryLimits: [{ category: 'FOOD_AND_BEVERAGE', limitAmount: 300, spentAmount: 330, percentageUsed: 110, usageStatus: 'EXCEEDED' }] },
    'SAR',
  )
  assert.equal(budget.categories[0].status, 'over')
  const answer = answerQuestion('How is my budget?', data({ budget }), env)
  assert.match(answer.fallback, /Over the limit: FOOD_AND_BEVERAGE \(110%\)/)
})

test('the summary sent to the server has no ids', () => {
  const text = JSON.stringify(toContext(data(), { firstName: 'Sara', language: 'en' }))
  assert.ok(!text.includes('g1'))
  assert.ok(text.includes('"stillRunning":true'))
})

test('Arabic fallback text', () => {
  const answer = answerQuestion('أين يمكنني تقليل المصروفات؟', data(), { ...env, text: ASSISTANT_TEXT.ar })
  assert.match(answer.fallback, /توفر/)
})
