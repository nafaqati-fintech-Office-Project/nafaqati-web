import { CalendarDays, CircleDollarSign, LoaderCircle, WalletCards } from 'lucide-react'
import { BUDGET_TRACKING } from '../../services/budgetApi.js'
import { formatBudgetMoney, normalizeMoney, uncoveredSpent } from './budgetUtils.js'
import './BudgetOverview.css'

const badgeClass = (status) => (status === 'EXCEEDED' ? 'is-danger' : status === 'WARNING' ? 'is-warning' : 'is-good')

const USAGE_LABEL = { ON_TRACK: 'On track', WARNING: 'Warning (80%+)', EXCEEDED: 'Exceeded' }

export default function BudgetOverview({ budget, currency, catchUp }) {
  if (!budget) return null
  const remaining = normalizeMoney(budget.remainingAmount)
  const other = uncoveredSpent(budget)
  const percent = Math.min(100, Math.max(0, normalizeMoney(budget.percentageUsed)))
  return (
    <section className="budget-overview" aria-label="Budget overview">
      <div className="budget-overview-main">
        <span className="budget-overview-icon">
          <WalletCards size={24} aria-hidden="true" />
        </span>
        <div>
          <span>Total limit</span>
          <strong>{formatBudgetMoney(budget.totalLimit, currency)}</strong>
        </div>
      </div>
      <dl className="budget-overview-facts">
        <div>
          <dt>
            <CircleDollarSign size={16} aria-hidden="true" />
            Currency
          </dt>
          <dd>{currency}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays size={16} aria-hidden="true" />
            Period
          </dt>
          <dd>
            {budget.periodStart} to {budget.periodEnd}
          </dd>
        </div>
        {BUDGET_TRACKING && (
          <>
            <div>
              <dt>Spent</dt>
              <dd>{formatBudgetMoney(budget.totalSpent, currency)}</dd>
            </div>
            <div>
              <dt>Remaining</dt>
              <dd className={remaining < 0 ? 'is-negative' : ''}>{formatBudgetMoney(remaining, currency)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`budget-status ${badgeClass(budget.usageStatus)}`}>
                  {USAGE_LABEL[budget.usageStatus] ?? budget.usageStatus}
                </span>
              </dd>
            </div>
            <div>
              <dt>Used</dt>
              <dd>{normalizeMoney(budget.percentageUsed).toFixed(0)}%</dd>
            </div>
            {other > 0 && (
              <div>
                <dt>Other / uncategorized</dt>
                <dd>{formatBudgetMoney(other, currency)}</dd>
              </div>
            )}
          </>
        )}
      </dl>
      {BUDGET_TRACKING && (
        <div className="budget-overview-progress" aria-hidden="true">
          <span className={badgeClass(budget.usageStatus)} style={{ inlineSize: `${percent}%` }} />
        </div>
      )}
      {BUDGET_TRACKING && catchUp?.catchUpPending && (
        <p className="budget-tracking-note" role="status">
          <LoaderCircle size={14} className="spin" aria-hidden="true" /> Importing this month's transactions...
        </p>
      )}
      {BUDGET_TRACKING && catchUp?.catchUpTimedOut && (
        <p className="budget-tracking-note" role="status">
          Importing is taking longer than expected.{' '}
          <button type="button" className="link-btn" onClick={catchUp.retryCatchUp}>
            Retry
          </button>
        </p>
      )}
      {!BUDGET_TRACKING && <p className="budget-tracking-note">Spending tracking is coming soon</p>}
    </section>
  )
}
