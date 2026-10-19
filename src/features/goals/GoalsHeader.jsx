import { Plus } from 'lucide-react'
import { GOALS_MOCK_ACTIVE } from '../../services/goalsApi.js'
import './GoalsHeader.css'

export default function GoalsHeader({ t, onCreate }) {
  return (
    <header className="goals-head">
      <div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="goals-head-actions">
        {GOALS_MOCK_ACTIVE && <span className="goals-demo-tag">{t.demo}</span>}
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <Plus size={17} aria-hidden="true" />
          {t.newGoal}
        </button>
      </div>
    </header>
  )
}
