import { createContext, useContext } from 'react'
import { ANALYTICS_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { forRange } from '../../utils/periodWording.js'

// True while the page shows a custom date range rather than a calendar month (set by Analytics.jsx)
export const AnalyticsRangeContext = createContext(false)

// Copy, text direction and date locale for the Analytics page, from preferences.language ("en" | "ar").
// For a custom range "this month" / "last month" read "this period" / "the previous period".
export function useAnalyticsText() {
  const { prefs } = usePreferences()
  const isRange = useContext(AnalyticsRangeContext)
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const t = isRange ? forRange(ANALYTICS_TEXT[lang], lang) : ANALYTICS_TEXT[lang]
  return { t, lang, dir: lang === 'ar' ? 'rtl' : 'ltr', locale: t.locale }
}
