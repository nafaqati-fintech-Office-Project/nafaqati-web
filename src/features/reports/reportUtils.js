// Pure helpers for the Reports page. Amounts arrive as JSON numbers per currency and are never added across
// currencies; the sums here are for display shares only.

// Which spending is a need and which a want (category codes, as the services send them). Anything not listed
// (Charity, Investments, Uncategorized ...) is "other". The same split as the mobile app.
const ESSENTIALS = new Set(['GROCERIES', 'UTILITIES', 'HEALTH', 'EDUCATION', 'TRANSPORTATION', 'FUEL', 'HOUSING', 'LOANS_EMI'])
const LIFESTYLE = new Set(['FOOD_AND_BEVERAGE', 'CLOTHING_AND_SHOPPING', 'ENTERTAINMENT', 'TRAVEL', 'SUBSCRIPTIONS'])

export const lifestyleGroup = (code) => (ESSENTIALS.has(code) ? 'essentials' : LIFESTYLE.has(code) ? 'lifestyle' : 'other')

const percentOf = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// [{ code, label, amount, count, percent }] largest first; empty categories are left out
export function categoryRows(categories = []) {
  const rows = categories.filter((c) => Number(c.total) > 0)
  const whole = rows.reduce((sum, c) => sum + Number(c.total), 0)
  return rows
    .map((c) => ({ code: c.categoryCode ?? null, label: c.category, amount: Number(c.total), count: c.count ?? 0 }))
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({ ...c, percent: percentOf(c.amount, whole) }))
}

// Always essentials, lifestyle, other: [{ group, amount, percent }]
export function lifestyleShares(categories = []) {
  const sums = { essentials: 0, lifestyle: 0, other: 0 }
  for (const c of categories) if (Number(c.total) > 0) sums[lifestyleGroup(c.categoryCode)] += Number(c.total)
  const whole = sums.essentials + sums.lifestyle + sums.other
  return ['essentials', 'lifestyle', 'other'].map((group) => ({ group, amount: sums[group], percent: percentOf(sums[group], whole) }))
}

// Top shops of the rows (already expenses): [{ name, amount, count, categoryId }] largest first
export function merchantTotals(items = [], currency, limit = 10) {
  const groups = new Map()
  for (const item of items) {
    const name = item.merchant?.name
    if (item.currency !== currency || !name) continue
    const key = name.toLowerCase()
    const group = groups.get(key) ?? { name, amount: 0, count: 0, categories: new Map() }
    group.amount += item.amount
    group.count += 1
    group.categories.set(item.categoryId, (group.categories.get(item.categoryId) ?? 0) + 1)
    groups.set(key, group)
  }
  return [...groups.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((g) => ({
      name: g.name,
      amount: g.amount,
      count: g.count,
      categoryId: [...g.categories.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
}

export function biggestExpense(items = [], currency) {
  let top = null
  for (const item of items) if (item.currency === currency && (!top || item.amount > top.amount)) top = item
  return top
}

// Days the average is spread over: the whole month, or the days so far when it is the current month
export function daysCounted(month, today) {
  const [y, m] = month.split('-').map(Number)
  const inMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return today.slice(0, 7) === month ? Number(today.slice(8, 10)) : inMonth
}

export const averagePerDay = (total, days) => (days > 0 ? Number(total) / days : 0)

// Share of income kept, rounded; null when nothing came in
export const savingsRatePercent = (income, net) => (Number(income) > 0 ? Math.round((Number(net) / Number(income)) * 100) : null)
