import { ANALYTICS_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'

// Copy, text direction and date locale for the Analytics page, from preferences.language ("en" | "ar")
export function useAnalyticsText() {
  const { prefs } = usePreferences()
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const t = ANALYTICS_TEXT[lang]
  return { t, lang, dir: lang === 'ar' ? 'rtl' : 'ltr', locale: t.locale }
}
