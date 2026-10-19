import { useMemo } from 'react'
import { APP_TEXT } from '../../constants/appText.js'
import { usePreferences } from '../../hooks/usePreferences.js'

export function useGoalsText() {
  const { prefs } = usePreferences()
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  return useMemo(() => APP_TEXT.goals[lang], [lang])
}
