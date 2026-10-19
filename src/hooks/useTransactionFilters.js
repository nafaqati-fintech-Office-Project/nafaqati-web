import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveRange, todayKey } from '../utils/dateRange.js'

export const PAGE_SIZES = [10, 20, 50]
// TODO: add 'transfer' once the backend has transfers (no equivalent today: DEBIT / CREDIT only)
export const TYPES = ['expense', 'income']
export const STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']
export const RANGES = ['all', 'today', 'last7', 'thisMonth', 'lastMonth', 'last3m', 'custom']
export const DEFAULT_SORT = 'transactionDate,desc'
const SORTS = ['transactionDate,asc', 'transactionDate,desc', 'amount,asc', 'amount,desc']

// Params that make up "filters" (everything but sort/size and unrelated ones like ?new=)
const FILTER_KEYS = ['q', 'type', 'status', 'category', 'range', 'from', 'to', 'page']
const DEFAULTS = { sort: DEFAULT_SORT, size: 10, page: 1, range: 'all' }

// URL <-> state: reload and the Back button keep search, chip, filters, sort and page.
// TODO: an `account` filter once the backend has accounts.
export function useTransactionFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const type = params.get('type')
    const status = params.get('status')
    const range = params.get('range')
    const sort = params.get('sort')
    const size = Number(params.get('size'))
    return {
      q: params.get('q') ?? '',
      type: TYPES.includes(type) ? type : '',
      status: STATUSES.includes(status) ? status : '',
      category: params.get('category') ?? '',
      range: RANGES.includes(range) ? range : 'all',
      from: params.get('from') ?? '',
      to: params.get('to') ?? '',
      sort: SORTS.includes(sort) ? sort : DEFAULT_SORT,
      page: Math.max(1, Number(params.get('page')) || 1),
      size: PAGE_SIZES.includes(size) ? size : DEFAULTS.size,
    }
  }, [params])

  const setFilters = useCallback(
    (patch, { replace = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([key, value]) => {
            if (value === '' || value == null || value === DEFAULTS[key]) next.delete(key)
            else next.set(key, String(value))
          })
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace },
      )
    },
    [setParams],
  )

  const clearFilters = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      FILTER_KEYS.forEach((key) => next.delete(key))
      return next
    })
  }, [setParams])

  const hasActiveFilters = Boolean(filters.q || filters.type || filters.status || filters.category || filters.range !== 'all')

  return { filters, setFilters, clearFilters, hasActiveFilters }
}

// UI filters -> params for transactionApi.listTransactions (0-based page). Date presets are resolved on the
// user's calendar day in `timeZone` (from preferences; undefined = the browser's).
export function toApiParams(filters, timeZone) {
  const { from, to } = resolveRange(filters, todayKey(timeZone))
  return {
    search: filters.q || undefined,
    type: filters.type ? filters.type.toUpperCase() : undefined,
    status: filters.status || undefined,
    categoryId: filters.category || undefined,
    from: from || undefined,
    to: to || undefined,
    timeZone,
    sort: filters.sort,
    page: filters.page - 1,
    size: filters.size,
  }
}
