import { createContext, useContext } from 'react'
import { REPORTS_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { forRange } from '../../utils/periodWording.js'

// True while the page shows a custom date range rather than a calendar month (set by Reports.jsx)
export const ReportRangeContext = createContext(false)

// Copy, text direction and date locale for the Reports page, from preferences.language ("en" | "ar").
// For a custom range "this month" / "last month" read "this period" / "the previous period".
export function useReportsText() {
  const { prefs } = usePreferences()
  const isRange = useContext(ReportRangeContext)
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const t = isRange ? forRange(REPORTS_TEXT[lang], lang) : REPORTS_TEXT[lang]
  return { t, lang, dir: lang === 'ar' ? 'rtl' : 'ltr', locale: t.locale }
}
