import api from '../lib/api.js'
import * as mock from './goalsApi.mock.js'

export const GOALS_MOCK_ACTIVE = import.meta.env.VITE_GOALS_MOCK === 'true'

const normalizeGoal = (goal) => {
  if (!goal || typeof goal !== 'object') return goal
  const targetAmount = Number(goal.targetAmount ?? goal.target ?? 0)
  const savedAmount = Number(goal.savedAmount ?? goal.currentAmount ?? goal.saved ?? 0)
  const progressPercentage = Number(
    goal.progressPercentage ?? (targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0),
  )

  return {
    ...goal,
    targetAmount,
    savedAmount,
    progressPercentage,
    category: goal.category ?? goal.goalCategory ?? 'custom',
    currency: goal.currency ?? 'SAR',
    targetDate: goal.targetDate ?? goal.target_date ?? null,
    status: goal.status ?? (savedAmount >= targetAmount ? 'COMPLETED' : 'ACTIVE'),
  }
}

const normalizeListResponse = (payload) => {
  const itemList = Array.isArray(payload) ? payload : payload?.items ?? payload?.goals ?? payload?.content ?? []
  return {
    ...(payload && typeof payload === 'object' ? payload : {}),
    items: Array.isArray(itemList) ? itemList.map(normalizeGoal) : [],
    planner: payload?.planner ?? null,
  }
}

const buildGoalPayload = (input = {}) => {
  const next = {
    name: input.name,
    description: input.description ?? '',
    targetAmount: Number(input.targetAmount),
    currency: input.currency ?? 'SAR',
    targetDate: input.targetDate ?? null,
  }
  if (input.category) next.category = input.category
  return next
}

const real = {
  listGoals: () => api.get('/api/goals').then((res) => normalizeListResponse(res.data)),
  getGoal: (id) => api.get(`/api/goals/${id}`).then((res) => normalizeGoal(res.data)),
  createGoal: (input) => api.post('/api/goals', buildGoalPayload(input)).then((res) => normalizeGoal(res.data)),
  updateGoal: (id, input) => api.put(`/api/goals/${id}`, buildGoalPayload(input)).then((res) => normalizeGoal(res.data)),
  deleteGoal: (id) => api.delete(`/api/goals/${id}`).then((res) => res.data ?? { id }),
  addContribution: (id, input) =>
    api.post(`/api/goals/${id}/contributions`, {
      ...input,
      requestId: input?.requestId ?? input?.request_id ?? globalThis.crypto?.randomUUID?.() ?? `contrib-${Date.now()}`,
      amount: Number(input?.amount ?? 0),
      note: input?.note ?? '',
      date: input?.date ?? null,
    }),
  listContributions: (id) => api.get(`/api/goals/${id}/contributions`).then((res) => res.data),
  getGoalSummary: (id) => api.get(`/api/goals/${id}/summary`).then((res) => res.data),
  completeGoal: (id) => api.post(`/api/goals/${id}/complete`).then((res) => res.data),
  reopenGoal: (id) => api.post(`/api/goals/${id}/reopen`).then((res) => res.data),
  cancelGoal: (id) => api.post(`/api/goals/${id}/cancel`).then((res) => res.data),
}

const impl = GOALS_MOCK_ACTIVE ? mock : real

export const listGoals = (...args) => impl.listGoals(...args)
export const getGoal = (...args) => impl.getGoal(...args)
export const createGoal = (...args) => impl.createGoal(...args)
export const updateGoal = (...args) => impl.updateGoal(...args)
export const deleteGoal = (...args) => impl.deleteGoal(...args)
export const addContribution = (...args) => impl.addContribution(...args)
export const listContributions = (...args) => impl.listContributions(...args)
export const getGoalSummary = (...args) => impl.getGoalSummary(...args)
export const completeGoal = (...args) => impl.completeGoal(...args)
export const reopenGoal = (...args) => impl.reopenGoal(...args)
export const cancelGoal = (...args) => impl.cancelGoal(...args)
