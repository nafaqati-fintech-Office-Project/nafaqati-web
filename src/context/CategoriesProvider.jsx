import { useMemo } from 'react'
import { CategoriesContext } from './CategoriesContext.js'
import { useAuth } from './AuthContext.jsx'
import { usePreferences } from '../hooks/usePreferences.js'
import { useAsync } from '../hooks/useAsync.js'
import { getErrorInfo } from '../lib/errors.js'
import * as transactionApi from '../services/transactionApi.js'

// Loads the category definitions (code, nameEn, nameAr, kind) from transaction-service once per signed-in user.
// `name` follows the language preference (Arabic when language is "ar"); unknown codes fall back to the raw code.
export default function CategoriesProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const { prefs } = usePreferences()
  const userId = isAuthenticated ? user?.id : null
  const request = useAsync(
    () => (userId ? transactionApi.getCategories() : Promise.resolve([])),
    `categories:${userId ?? 'anonymous'}`,
  )
  const arabic = prefs?.language === 'ar'

  const value = useMemo(() => {
    // `id` mirrors `code` so components can treat a category as { id, name }
    const categories = (request.data ?? []).map((c) => ({
      id: c.code,
      code: c.code,
      kind: c.kind,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      name: (arabic && c.nameAr) || c.nameEn,
    }))
    const byCode = Object.fromEntries(categories.map((c) => [c.code, c]))
    return {
      categories,
      byCode,
      nameOf: (code) => byCode[code]?.name ?? code ?? '',
      loading: Boolean(userId) && request.loading,
      error: userId && request.error ? getErrorInfo(request.error, 'transactions').message : null,
      retry: request.retry,
    }
  }, [request.data, request.loading, request.error, request.retry, arabic, userId])

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}
