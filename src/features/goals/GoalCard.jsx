import { Edit3, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { formatGoalDate, formatGoalMoney, goalIcon, goalMetrics } from './goalUtils.js'
import GoalProgressBar from './GoalProgressBar.jsx'
import './GoalCard.css'

export default function GoalCard({ goal, t, currency, timeZone, onEdit, onContribute, onDelete }) {
  const metrics = goalMetrics(goal, timeZone)
  const Icon = goalIcon(goal.category)
  const imageClass = `goal-thumb-${goal.imageKey || goal.category || 'custom'}`
  return (
    <article className={`goal-card ${metrics.status === 'COMPLETED' ? 'is-complete' : ''}`}>
      <div className={`goal-thumb ${imageClass}`} aria-hidden="true">
        <Icon size={24} />
      </div>
      <div className="goal-card-body">
        <div className="goal-card-top">
          <div>
            <h2>{goal.name}</h2>
            <p>
              {t.target}: {formatGoalMoney(goal.targetAmount, currency)}
            </p>
          </div>
          <span className={`goal-badge ${metrics.track === 'behind' ? 'is-behind' : 'is-track'}`}>
            {metrics.status === 'COMPLETED' ? t.completed : t[metrics.track]}
          </span>
        </div>
        {goal.autoSave && goal.autoSaveKeyword && metrics.status !== 'COMPLETED' && (
          <p className="goal-autosave-badge">
            <RefreshCw size={13} aria-hidden="true" />
            {t.autoSaveOn(goal.autoSaveKeyword)}
          </p>
        )}
        <GoalProgressBar value={metrics.percentage} label={`${goal.name} ${metrics.percentage}%`} />
        <div className="goal-card-meta">
          <span>
            {t.saved}: <strong>{formatGoalMoney(goal.savedAmount, currency)}</strong>
          </span>
          <span>{metrics.percentage}%</span>
        </div>
        <div className="goal-card-bottom">
          <span>
            {t.estimated}: {goal.targetDate ? formatGoalDate(goal.targetDate, t.locale) : t.noTargetDate}
          </span>
          <div className="goal-card-actions">
            <button type="button" className="icon-btn" onClick={() => onContribute(goal)} aria-label={t.actions.contribute}>
              <Plus size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" onClick={() => onEdit(goal)} aria-label={t.actions.edit}>
              <Edit3 size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn is-danger" onClick={() => onDelete(goal)} aria-label={t.actions.delete}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
