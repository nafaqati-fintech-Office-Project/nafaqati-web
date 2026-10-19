import './GoalProgressBar.css'

export default function GoalProgressBar({ value, label }) {
  return (
    <div className="goal-progress" role="img" aria-label={label}>
      <div className="goal-progress-track">
        <span style={{ inlineSize: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}
