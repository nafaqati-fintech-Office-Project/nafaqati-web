import api from '../lib/api.js'
import { withBackoff } from './backoff.js'

// Family Portal requests, all through the gateway (family-service, budget-service, transaction-service and
// reports-analytics-service routes under /api/families/** and /api/transactions/{id}/shares).
// The caller's identity is the JWT: nothing identifying (user id, internal token) is ever sent from here.
// Every function takes an optional AbortSignal so switching family cancels what is no longer needed.
const F = '/api/families'
const TIMEOUT_MS = 30000 // the gateway cuts responses at about 30 s

const send = (config) => withBackoff(() => api.request({ timeout: TIMEOUT_MS, ...config }).then((res) => res.data))
const get = (url, params, signal) => send({ method: 'get', url, params, signal })

// ---- families (family-service)
export const listFamilies = (signal) => get(F, undefined, signal)
export const getFamily = (id, signal) => get(`${F}/${id}`, undefined, signal)
// { name, description?, currency, timeZone? }
export const createFamily = (body) => send({ method: 'post', url: F, data: body })
// { name?, description?, currency?, timeZone?, version? }
export const updateFamily = (id, body) => send({ method: 'patch', url: `${F}/${id}`, data: body })
export const deleteFamily = (id) => send({ method: 'delete', url: `${F}/${id}` })

// ---- members
export const listMembers = (familyId, signal) => get(`${F}/${familyId}/members`, undefined, signal)
export const removeMember = (familyId, memberId) => send({ method: 'delete', url: `${F}/${familyId}/members/${memberId}` })
export const changeMemberRole = (familyId, memberId, role) => send({ method: 'patch', url: `${F}/${familyId}/members/${memberId}/role`, data: { role } })
export const leaveFamily = (familyId) => send({ method: 'post', url: `${F}/${familyId}/leave` })
export const transferOwnership = (familyId, newOwnerMemberId) => send({ method: 'post', url: `${F}/${familyId}/transfer-ownership`, data: { newOwnerMemberId } })

// ---- invitations (by registered user id: the backend has no e-mail invitations)
export const listFamilyInvitations = (familyId, status, signal) => get(`${F}/${familyId}/invitations`, { status }, signal)
export const listMyInvitations = (status, signal) => get(`${F}/invitations/me`, { status }, signal)
export const createInvitation = (familyId, invitedUserId, role) => send({ method: 'post', url: `${F}/${familyId}/invitations`, data: { invitedUserId, role } })
export const acceptInvitation = (invitationId) => send({ method: 'post', url: `${F}/invitations/${invitationId}/accept` })
export const declineInvitation = (invitationId) => send({ method: 'post', url: `${F}/invitations/${invitationId}/decline` })
export const revokeInvitation = (familyId, invitationId) => send({ method: 'post', url: `${F}/${familyId}/invitations/${invitationId}/revoke` })

// ---- family budgets (budget-service). Spending is computed by the backend from what members shared.
export const listFamilyBudgets = (familyId, { status, page = 0, size = 20 } = {}, signal) => get(`${F}/${familyId}/budgets`, { status, page, size }, signal)
// { periodStart, periodEnd, currency, timeZone, totalLimit, categoryLimits: [{ category, limitAmount }] }
export const createFamilyBudget = (familyId, body) => send({ method: 'post', url: `${F}/${familyId}/budgets`, data: body })
// { totalLimit, categoryLimits }
export const updateFamilyBudget = (familyId, budgetId, body) => send({ method: 'put', url: `${F}/${familyId}/budgets/${budgetId}`, data: body })
export const archiveFamilyBudget = (familyId, budgetId) => send({ method: 'patch', url: `${F}/${familyId}/budgets/${budgetId}/archive` })
export const getFamilyBudgetUtilization = (familyId, budgetId, signal) => get(`${F}/${familyId}/budgets/${budgetId}/utilization`, undefined, signal)

// ---- opt-in transaction sharing (transaction-service)
export const shareTransaction = (transactionId, familyId) => send({ method: 'post', url: `/api/transactions/${transactionId}/shares`, data: { familyId } })
export const listTransactionShares = (transactionId, signal) => get(`/api/transactions/${transactionId}/shares`, undefined, signal)
export const unshareTransaction = (transactionId, familyId) => send({ method: 'delete', url: `/api/transactions/${transactionId}/shares/${familyId}` })
// { content, page, size, totalElements, totalPages }: only what members explicitly shared
export const listFamilyTransactions = (familyId, { page = 0, size = 10 } = {}, signal) => get(`${F}/${familyId}/transactions`, { page, size }, signal)

// ---- dashboard and reports (reports-analytics-service); month = yyyy-MM, currency defaults to the family's
export const getFamilyDashboard = (familyId, { month, currency } = {}, signal) => get(`${F}/${familyId}/dashboard`, { month, currency }, signal)
export const getMonthlySpending = (familyId, { endMonth, months = 6, currency } = {}, signal) => get(`${F}/${familyId}/reports/monthly-spending`, { endMonth, months, currency }, signal)
export const getCategorySpending = (familyId, { startDate, endDate, currency }, signal) => get(`${F}/${familyId}/reports/category-spending`, { startDate, endDate, currency }, signal)
export const getMerchantSpending = (familyId, { startDate, endDate, currency }, signal) => get(`${F}/${familyId}/reports/merchant-spending`, { startDate, endDate, currency }, signal)
export const getSpendingTrend = (familyId, { startDate, endDate, currency }, signal) => get(`${F}/${familyId}/reports/spending-trend`, { startDate, endDate, currency }, signal)
export const getBudgetVsActual = (familyId, { month, currency } = {}, signal) => get(`${F}/${familyId}/reports/budget-vs-actual`, { month, currency }, signal)
export const getMonthlyComparison = (familyId, { month, currency } = {}, signal) => get(`${F}/${familyId}/reports/monthly-comparison`, { month, currency }, signal)
