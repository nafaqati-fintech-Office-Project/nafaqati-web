const LATENCY_MIN = 200
const LATENCY_MAX = 400
const ENABLE_ERRORS = import.meta.env.VITE_GOALS_MOCK_ERRORS === 'true'

const nowIso = () => new Date().toISOString()
const clone = (value) => JSON.parse(JSON.stringify(value))
const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN)))
const maybeFail = () => {
  if (ENABLE_ERRORS && Math.random() < 0.12) throw new Error('Demo goals service is temporarily unavailable')
}
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const seedGoals = [
  {
    id: 'goal-dubai-vacation',
    name: 'Dubai Vacation',
    category: 'travel',
    targetAmount: 7500,
    savedAmount: 4650,
    currency: 'SAR',
    targetDate: '2027-08-16',
    createdAt: '2026-02-11T10:00:00.000Z',
    status: 'ACTIVE',
    imageKey: 'dubai',
    contributions: [
      { id: 'contrib-dubai-1', amount: 1200, date: '2026-03-05', note: 'Initial savings' },
      { id: 'contrib-dubai-2', amount: 900, date: '2026-04-09', note: 'Monthly transfer' },
      { id: 'contrib-dubai-3', amount: 2550, date: '2026-05-12', note: 'Bonus allocation' },
    ],
  },
  {
    id: 'goal-new-car',
    name: 'New Car',
    category: 'car',
    targetAmount: 40000,
    savedAmount: 16000,
    currency: 'SAR',
    targetDate: '2029-06-12',
    createdAt: '2026-01-20T10:00:00.000Z',
    status: 'ACTIVE',
    imageKey: 'car',
    contributions: [{ id: 'contrib-car-1', amount: 16000, date: '2026-05-01', note: 'Car fund' }],
  },
  {
    id: 'goal-home-down-payment',
    name: 'Home Down Payment',
    category: 'home',
    targetAmount: 40000,
    savedAmount: 8000,
    currency: 'SAR',
    targetDate: '2030-01-15',
    createdAt: '2026-03-14T10:00:00.000Z',
    status: 'ACTIVE',
    imageKey: 'home',
    contributions: [{ id: 'contrib-home-1', amount: 8000, date: '2026-04-22', note: 'Savings account transfer' }],
  },
  {
    id: 'goal-education',
    name: 'Education',
    category: 'education',
    targetAmount: 12000,
    savedAmount: 3000,
    currency: 'SAR',
    targetDate: '2029-09-10',
    createdAt: '2026-04-02T10:00:00.000Z',
    status: 'ACTIVE',
    imageKey: 'education',
    contributions: [{ id: 'contrib-education-1', amount: 3000, date: '2026-05-03', note: 'Course savings' }],
  },
]

let goals = clone(seedGoals)

// TODO(backend): replace this planner placeholder with goal recommendations from the goals service.
const planner = {
  title: 'Goal Planner',
  prompt: 'I want to buy a car for SAR 80,000',
  plans: [
    { id: 'recommended', label: 'Recommended Plan', amountPerMonth: 2250, targetDate: '2029-06-01', tone: 'green' },
    { id: 'alternative', label: 'Alternative Plan', amountPerMonth: 2000, targetDate: '2029-08-01', tone: 'blue' },
  ],
}

const withComputedStatus = (goal) => ({
  ...goal,
  status: Number(goal.savedAmount) >= Number(goal.targetAmount) ? 'COMPLETED' : goal.status,
})

const response = async (value) => {
  await delay()
  maybeFail()
  return clone(value)
}

export async function listGoals() {
  return response({ items: goals.map(withComputedStatus), planner })
}

export async function getGoal(id) {
  const goal = goals.find((item) => item.id === id)
  if (!goal) throw new Error('Goal not found')
  return response(withComputedStatus(goal))
}

export async function createGoal(input) {
  const created = {
    id: makeId('goal'),
    name: input.name,
    category: input.category,
    targetAmount: Number(input.targetAmount),
    savedAmount: Number(input.savedAmount ?? 0),
    currency: input.currency,
    targetDate: input.targetDate || null,
    createdAt: nowIso(),
    status: input.status ?? 'ACTIVE',
    imageKey: input.imageKey || input.category || 'custom',
    autoSave: Boolean(input.autoSave),
    autoSaveKeyword: input.autoSaveKeyword ?? '',
    contributions: [],
  }
  goals = [created, ...goals]
  return response(withComputedStatus(created))
}

export async function updateGoal(id, input) {
  let updated = null
  goals = goals.map((goal) => {
    if (goal.id !== id) return goal
    updated = {
      ...goal,
      ...input,
      targetAmount: Number(input.targetAmount ?? goal.targetAmount),
      savedAmount: Number(input.savedAmount ?? goal.savedAmount),
      targetDate: input.targetDate || null,
    }
    return updated
  })
  if (!updated) throw new Error('Goal not found')
  return response(withComputedStatus(updated))
}

export async function deleteGoal(id) {
  goals = goals.filter((goal) => goal.id !== id)
  return response({ id })
}

export async function addContribution(id, input) {
  let contribution = null
  goals = goals.map((goal) => {
    if (goal.id !== id) return goal
    contribution = {
      id: makeId('contrib'),
      amount: Number(input.amount),
      date: input.date,
      note: input.note || '',
    }
    const savedAmount = Number(goal.savedAmount) + Number(input.amount)
    return {
      ...goal,
      savedAmount,
      status: savedAmount >= Number(goal.targetAmount) ? 'COMPLETED' : goal.status,
      contributions: [contribution, ...goal.contributions],
    }
  })
  if (!contribution) throw new Error('Goal not found')
  return response(contribution)
}

export async function listContributions(id) {
  const goal = goals.find((item) => item.id === id)
  if (!goal) throw new Error('Goal not found')
  return response(goal.contributions)
}
