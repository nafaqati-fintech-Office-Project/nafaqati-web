import { categoryVisual } from '../../config/categoryVisuals.js'
import { useCategories } from '../../hooks/useCategories.js'

// Icon and color from the frontend registry, name from the backend (per language); unknown codes show the raw code
export default function CategoryBadge({ code }) {
  const { nameOf } = useCategories()
  if (!code) return null
  const { color, icon: Icon } = categoryVisual(code)
  return (
    <span className="category-badge">
      <Icon size={15} color={color} aria-hidden="true" />
      {nameOf(code)}
    </span>
  )
}
