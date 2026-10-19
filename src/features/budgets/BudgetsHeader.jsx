import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react'
import { monthLabel } from './budgetUtils.js'
import './BudgetsHeader.css'

export default function BudgetsHeader({ month, months, hasBudget, canGoNext, canGoPrev, onMonthChange, onPrev, onNext, onCreate }) {
  return (
    <header className="budget-head">
      <div>
        <h1>Budgets</h1>
        <p>{monthLabel(month)}</p>
      </div>
      <div className="budget-head-actions">
        <div className="budget-month-nav" aria-label="Budget month navigation">
          <button type="button" className="icon-btn" onClick={onPrev} disabled={!canGoPrev} aria-label="Previous month">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <select value={month} onChange={(e) => onMonthChange(e.target.value)} aria-label="Select budget month">
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" onClick={onNext} disabled={!canGoNext} aria-label="Next month">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          {hasBudget ? <Pencil size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
          {hasBudget ? 'Edit budget' : 'Create budget'}
        </button>
      </div>
    </header>
  )
}
