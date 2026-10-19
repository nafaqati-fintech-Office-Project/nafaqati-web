import { NOTIFICATION_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'

// Copy, text direction and date locale for the notification UI, from preferences.language ("en" | "ar")
export function useNotificationText() {
  const { prefs } = usePreferences()
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const t = NOTIFICATION_TEXT[lang]
  return { t, lang, dir: t.dir }
}
