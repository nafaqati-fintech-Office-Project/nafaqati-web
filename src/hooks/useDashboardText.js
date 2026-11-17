import { APP_TEXT, DASHBOARD_AR } from '../constants/appText.js'
import { usePreferences } from './usePreferences.js'

// Dashboard copy in the language preference ("en" | "ar"), with the text direction
export function useDashboardText() {
  const { prefs } = usePreferences()
  const ar = prefs?.language === 'ar'
  return { t: ar ? DASHBOARD_AR : APP_TEXT.dashboard, dir: ar ? 'rtl' : 'ltr', ar }
}
