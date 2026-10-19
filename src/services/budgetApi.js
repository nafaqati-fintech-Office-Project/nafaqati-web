import api from '../lib/api.js'

// budget-service through the gateway. Spend is applied server-side from transaction events: the browser never
// calls the /spending endpoints (the gateway answers 404 for them).
const BASE = '/api/budgets'

export const BUDGET_TRACKING = import.meta.env.VITE_BUDGET_TRACKING === 'true'

// The ACTIVE budget containing today in its own zone; 404 = none
export const getCurrentBudget = () => api.get(`${BASE}/current`).then((res) => res.data)

export const getBudget = (id) => api.get(`${BASE}/${id}`).then((res) => res.data)

// { content, page, size, totalElements, totalPages }, newest month first. month = 'YYYY-MM', size <= 50
export const listBudgets = ({ month, page = 0, size = 50 } = {}) =>
  api.get(BASE, { params: { month: month || undefined, page, size } }).then((res) => res.data)

export const createBudget = (data) => api.post(BASE, data).then((res) => res.data)

export const updateBudget = (id, data) => api.put(`${BASE}/${id}`, data).then((res) => res.data)

export const archiveBudget = (id) => api.patch(`${BASE}/${id}/archive`).then(() => ({ id }))

export const getBudgetAlerts = (id) => api.get(`${BASE}/${id}/alerts`).then((res) => res.data)
