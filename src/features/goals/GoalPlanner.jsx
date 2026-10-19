import { CheckCircle2, CircleDollarSign } from 'lucide-react'
import { formatGoalDate, formatGoalMoney } from './goalUtils.js'
import './GoalPlanner.css'

export default function GoalPlanner({ planner, t, currency }) {
  if (!planner) return null
  return (
    <aside className="goal-planner" aria-label={planner.title}>
      <div className="goal-planner-head">
        <h2>{planner.title}</h2>
        <p>{planner.prompt}</p>
      </div>
      <div className="goal-plan-list">
        {planner.plans.map((plan) => (
          <div key={plan.id} className={`goal-plan goal-plan-${plan.tone}`}>
            <span className="goal-plan-icon">
              {plan.tone === 'green' ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleDollarSign size={18} aria-hidden="true" />}
            </span>
            <div>
              <strong>{plan.label}</strong>
              <p>{t.planner.perMonth(formatGoalMoney(plan.amountPerMonth, currency))}</p>
              <small>{t.planner.estimated(formatGoalDate(plan.targetDate, t.locale))}</small>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-primary goal-plan-start">
        {t.planner.start}
      </button>
    </aside>
  )
}
