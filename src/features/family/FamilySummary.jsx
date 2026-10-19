import { available, money } from './familyUtils.js'
import './FamilySummary.css'

// The three cards of the design, now from the real dashboard: shared spending, the family budget, the members.
// Income and savings are NOT_AVAILABLE in the backend (expenses only), so no such card exists.
export default function FamilySummary({ t, dashboard, loading, failed, currency, monthLabel, memberCount, pendingCount }) {
  const skeleton = <span className="sk fam-sum-sk" aria-hidden="true" />
  const prev = dashboard?.previousMonth
  const budget = dashboard?.budget
  const budgetOk = budget?.state === 'AVAILABLE'
  const used = budgetOk ? Math.floor(Number(budget.utilizationPercent)) : null
  const left = budgetOk ? Number(budget.remainingAmount) : null

  return (
    <section className="family-summary" aria-label={t.title}>
      <div className="summary-card primary">
        <span>{t.summary.spending(monthLabel)}</span>
        {loading ? skeleton : failed ? <strong>{t.summary.unavailable}</strong> : <strong>{money(dashboard.totalSharedSpending, dashboard.currency ?? currency)}</strong>}
        <small>
          {!loading && !failed && prev && prev.changePercent != null ? t.summary.vsLast(Number(prev.changePercent)) : !loading && !failed ? t.summary.noComparison : ' '}
        </small>
      </div>
      <div className="summary-card soon-free">
        <span>{t.summary.budget}</span>
        {loading ? (
          skeleton
        ) : failed || (budget && budget.state === 'NOT_AVAILABLE' && budget.reason !== 'NO_ACTIVE_BUDGET') ? (
          <strong>{t.summary.unavailable}</strong>
        ) : budgetOk ? (
          <strong>{t.summary.budgetUsed(used)}</strong>
        ) : (
          <strong>{t.summary.noBudget}</strong>
        )}
        <small>
          {budgetOk ? (left >= 0 ? t.summary.budgetLeft(money(left, dashboard.currency)) : t.summary.budgetOver(money(-left, dashboard.currency))) : !loading && !failed ? t.summary.noBudgetHint : ' '}
        </small>
      </div>
      <div className="summary-card soon-free">
        <span>{t.summary.members}</span>
        {memberCount == null ? skeleton : <strong>{t.summary.membersValue(memberCount)}</strong>}
        <small>{pendingCount > 0 ? t.summary.pending(pendingCount) : ' '}</small>
      </div>
      {!loading && dashboard && !available(dashboard.income) && <p className="fam-sum-note">{t.summary.incomeNote}</p>}
    </section>
  )
}
