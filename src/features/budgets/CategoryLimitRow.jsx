import { BUDGET_TRACKING } from '../../services/budgetApi.js'
import { categoryVisual } from '../../config/categoryVisuals.js'
import { formatBudgetMoney, normalizeMoney } from './budgetUtils.js'
import './BudgetOverview.css'
import './CategoryLimitRow.css'

export default function CategoryLimitRow({ limit, category, currency }) {
  const visual = categoryVisual(limit.category)
  const Icon = visual.icon
  const percent = Math.min(100, Math.max(0, normalizeMoney(limit.percentageUsed)))

  return (
    <li className="budget-category-row">
      <span className="budget-category-icon" style={{ '--category-color': visual.color }}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="budget-category-name">
        <strong>{category?.name ?? limit.category}</strong>
        <span>{limit.category}</span>
      </div>
      <div className="budget-category-limit">
        <span>Limit</span>
        <strong>{formatBudgetMoney(limit.limitAmount, currency)}</strong>
      </div>
      {BUDGET_TRACKING && (
        <div className="budget-category-progress">
          <div className="budget-progress-label">
            <span>{formatBudgetMoney(limit.spentAmount, currency)} spent</span>
            <strong>
              {limit.usageStatus && limit.usageStatus !== 'ON_TRACK' && (
                <span className={`budget-status ${limit.usageStatus === 'EXCEEDED' ? 'is-danger' : 'is-warning'}`}>
                  {limit.usageStatus === 'EXCEEDED' ? 'Exceeded' : 'Warning'}
                </span>
              )}{' '}
              {normalizeMoney(limit.percentageUsed).toFixed(0)}%
            </strong>
          </div>
          <div className="budget-progress-track" aria-hidden="true">
            <span style={{ inlineSize: `${percent}%`, background: visual.color }} />
          </div>
        </div>
      )}
    </li>
  )
}
