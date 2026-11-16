// Financial Health score (0-100), worked out only from numbers the dashboard already loads from the backend.
// Each part gives 0..1 and has a weight; a part without data is left out and the rest are re-weighted.
//   savings rate   (50): (income - spending) / income; 20% or more of income saved = full marks
//   spending trend (25): spending vs the previous period; flat or lower = full, +50% or more = none
//   budget         (25): share of this month's budget used; up to 80% = full, 100% = half, over = none
const clamp = (n) => Math.min(1, Math.max(0, n))

export const HEALTH_LEVELS = [
  { min: 80, key: 'excellent', tone: 'green' },
  { min: 60, key: 'good', tone: 'teal' },
  { min: 40, key: 'fair', tone: 'orange' },
  { min: 0, key: 'poor', tone: 'red' },
]

export function financialHealth({ income, spending, prevSpending, comparable, budget }) {
  if (!(income > 0) && !(spending > 0)) return null // nothing to judge

  const parts = []
  if (income > 0) parts.push({ weight: 50, score: clamp((income - spending) / income / 0.2) })
  if (comparable && prevSpending > 0) parts.push({ weight: 25, score: clamp(1 - (spending / prevSpending - 1) / 0.5) })
  const limit = Number(budget?.totalLimit)
  if (limit > 0) {
    const used = 1 - Number(budget.remainingAmount) / limit
    parts.push({ weight: 25, score: used <= 0.8 ? 1 : used <= 1 ? 1 - ((used - 0.8) / 0.2) * 0.5 : 0 })
  }
  if (!parts.length) return null

  const total = parts.reduce((sum, p) => sum + p.weight, 0)
  const score = Math.round((parts.reduce((sum, p) => sum + p.weight * p.score, 0) / total) * 100)
  return { score, ...HEALTH_LEVELS.find((l) => score >= l.min) }
}
