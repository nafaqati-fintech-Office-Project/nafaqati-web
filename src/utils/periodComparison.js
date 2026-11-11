// Pure helper of services/reportsApi.js getPeriodComparison (kept apart so it can be unit tested without the API client).
const num = (v) => Number(v ?? 0)
const round2 = (v) => Math.round(v * 100) / 100
// current - previous, and that as a percent of |previous| (null when previous is 0), like the service
const change = (current, previous) => ({
  amount: round2(current - previous),
  percent: previous === 0 ? null : round2(((current - previous) / Math.abs(previous)) * 100),
})

function totalsOf(income, spending, currency) {
  const flow = income?.currencies?.find((c) => c.currency === currency)
  const spent = spending?.currencies?.find((c) => c.currency === currency)
  const categories = (spent?.categories ?? [])
    .map((c) => ({ categoryCode: c.categoryCode ?? null, category: c.category, total: num(c.total), count: c.count ?? 0 }))
    .sort((a, b) => b.total - a.total)
  return {
    totalIncome: num(flow?.totalIncome),
    totalExpenses: num(flow?.totalExpenses),
    net: num(flow?.net ?? num(flow?.totalIncome) - num(flow?.totalExpenses)),
    categories,
  }
}

// Builds { currencies: [{ currency, current, previous, delta }] } for `period` against `previous` (both { from, to })
// from income-vs-expenses and spending-summary.
export function buildPeriodComparison({ income, spending, previousIncome, previousSpending }) {
  const currencies = [...new Set([income, spending, previousIncome, previousSpending].flatMap((r) => r?.currencies?.map((c) => c.currency) ?? []))].sort()
  return {
    currencies: currencies.map((currency) => {
      const current = totalsOf(income, spending, currency)
      const previous = totalsOf(previousIncome, previousSpending, currency)
      const codes = new Map()
      for (const c of [...current.categories, ...previous.categories]) codes.set(c.categoryCode ?? c.category, c)
      const totalIn = (list, c) => list.find((x) => (x.categoryCode ?? x.category) === (c.categoryCode ?? c.category))?.total ?? 0
      return {
        currency,
        current,
        previous,
        delta: {
          totalIncome: change(current.totalIncome, previous.totalIncome),
          totalExpenses: change(current.totalExpenses, previous.totalExpenses),
          net: change(current.net, previous.net),
          categories: [...codes.values()].map((c) => ({
            categoryCode: c.categoryCode,
            category: c.category,
            ...change(totalIn(current.categories, c), totalIn(previous.categories, c)),
          })),
        },
      }
    }),
  }
}

