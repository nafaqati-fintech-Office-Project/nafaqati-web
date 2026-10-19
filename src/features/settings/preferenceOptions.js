// Countries and currencies live in constants/currencies.js (the only list the backend supports).

export const LANGUAGES = ['en', 'ar']
export const THEMES = ['light', 'dark', 'system']

export const TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Asia/Muscat',
  'Asia/Karachi',
  'Europe/London',
  'America/New_York',
  'UTC',
]

export const BUDGET_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)
