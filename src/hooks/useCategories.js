import { useContext } from 'react'
import { CategoriesContext } from '../context/CategoriesContext.js'

// { categories: [{ id, code, kind, nameEn, nameAr, name }], byCode, nameOf(code), loading, error, retry }
export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider')
  return ctx
}
