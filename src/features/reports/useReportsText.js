import { REPORTS_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'

// Copy, text direction and date locale for the Reports page, from preferences.language ("en" | "ar")
export function useReportsText() {
  const { prefs } = usePreferences()
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const t = REPORTS_TEXT[lang]
  return { t, lang, dir: lang === 'ar' ? 'rtl' : 'ltr', locale: t.locale }
}
