import { Inbox } from 'lucide-react'
import CategoryLimitRow from './CategoryLimitRow.jsx'
import './CategoryLimitList.css'

export default function CategoryLimitList({ budget, byCode, currency }) {
  const limits = budget?.categoryLimits ?? []
  return (
    <section className="budget-section" aria-label="Category limits">
      <div className="budget-section-head">
        <h2>Category limits</h2>
        <span>{limits.length} {limits.length === 1 ? "category" : "categories"}</span>
      </div>
      {limits.length ? (
        <ul className="budget-category-list">
          {limits.map((limit) => (
            <CategoryLimitRow key={limit.category} limit={limit} category={byCode[limit.category]} currency={currency} />
          ))}
        </ul>
      ) : (
        <div className="dc-state">
          <Inbox size={28} aria-hidden="true" />
          <strong>No category limits</strong>
          <p>This budget only has a total limit.</p>
        </div>
      )}
    </section>
  )
}
