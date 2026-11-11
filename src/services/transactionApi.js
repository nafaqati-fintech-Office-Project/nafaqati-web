import api from '../lib/api.js'
import { resolveTimeZone } from '../utils/timeZone.js'

// transaction-service through the gateway (GET/POST/PATCH/DELETE /api/transactions, GET /categories).
// The backend speaks DEBIT/CREDIT and `transactionDate`; the UI speaks expense/income and `occurredAt`.
// That translation lives here only, so components never see backend field names.
const BASE = '/api/transactions'
const EXPORT_PAGE_SIZE = 100
export const EXPORT_CAP = 1000

const TYPE_FROM_API = { DEBIT: 'EXPENSE', CREDIT: 'INCOME' }
const TYPE_TO_API = { EXPENSE: 'DEBIT', INCOME: 'CREDIT' }

export function toTransaction(t) {
  return {
    id: t.id,
    type: TYPE_FROM_API[t.type] ?? t.type,
    amount: Number(t.amount),
    currency: t.currency,
    merchant: { name: t.merchant || t.description },
    description: t.description,
    categoryId: t.categoryCode,
    status: t.status,
    source: t.source, // MANUAL | EXTERNAL
    reference: t.externalTransactionId,
    occurredAt: t.transactionDate,
    // Last 3-4 digits of the card / account it was made with (from the bank SMS); null when unknown
    cardLast4: t.cardLast4 ?? null,
  }
}

// filters: { search, type: 'EXPENSE'|'INCOME', status, categoryId, card (last digits), from, to (calendar days in `timeZone`),
//            timeZone, sort, page (0-based), size }
const toParams = (filters) => ({
  q: filters.search || undefined,
  type: filters.type ? TYPE_TO_API[filters.type] : undefined,
  category: filters.categoryId || undefined,
  card: filters.card || undefined,
  startDate: filters.from || undefined,
  endDate: filters.to || undefined,
  timeZone: resolveTimeZone(filters.timeZone),
  status: filters.status || undefined,
  sort: filters.sort,
  page: filters.page,
  size: filters.size,
})

export async function listTransactions(filters) {
  const { data } = await api.get(BASE, { params: toParams(filters) })
  return {
    items: data.content.map(toTransaction),
    page: data.page,
    size: data.size,
    totalItems: data.totalElements,
    totalPages: data.totalPages,
  }
}

// Everything matching the filters, page by page, up to `cap` rows. `capped` says there was more.
export async function listAllTransactions(filters, cap = EXPORT_CAP) {
  const items = []
  let page = 0
  let totalItems = 0
  for (;;) {
    const result = await listTransactions({ ...filters, page, size: EXPORT_PAGE_SIZE })
    totalItems = result.totalItems
    items.push(...result.items)
    page += 1
    if (page >= result.totalPages || items.length >= cap) break
  }
  return { items: items.slice(0, cap), capped: totalItems > cap, totalItems }
}

export const getCategories = () => api.get(`${BASE}/categories`).then((res) => res.data)

// The user's cards, most used first: [{ cardLast4, count, lastUsed, bank|null }]
export const getCards = () => api.get(`${BASE}/cards`).then((res) => res.data)

// data: { type: 'EXPENSE'|'INCOME', amount, currency, merchant?, description, categoryId?, occurredAt (ISO) }
export async function createTransaction(data) {
  const { data: created } = await api.post(BASE, {
    type: TYPE_TO_API[data.type],
    amount: data.amount,
    currency: data.currency,
    merchant: data.merchant || undefined,
    description: data.description,
    transactionDate: data.occurredAt,
    category: data.categoryId || undefined,
  })
  return toTransaction(created)
}

// PATCH only supports the category and the merchant
export async function updateTransaction(id, { categoryId, merchant }) {
  const { data } = await api.patch(`${BASE}/${id}`, { category: categoryId, merchant })
  return toTransaction(data)
}

export const updateCategory = (id, categoryId) => updateTransaction(id, { categoryId })

// Soft delete; only manually created transactions (409 otherwise)
export const deleteTransaction = (id) => api.delete(`${BASE}/${id}`).then(() => ({ id }))
