import { FAMILY_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { errorKey } from './familyUtils.js'

// Copy, direction and date locale of the Family Portal, from preferences.language ("en" | "ar")
export function useFamilyText() {
  const { prefs } = usePreferences()
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const t = FAMILY_TEXT[lang]
  // A friendly sentence for any API error; the server's own message is never shown
  const messageFor = (error, action) => t.errors[errorKey(error, action)]
  return { t, lang, dir: t.dir, messageFor }
}
