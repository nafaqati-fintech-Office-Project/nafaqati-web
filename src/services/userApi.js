import api from '../lib/api.js'

// user-service through the gateway only (VITE_API_BASE_URL). The shared client adds the Bearer
// token and refreshes once on 401. Errors are raw axios errors: parse them with getErrorInfo().
const BASE = '/api/users/me'

export const getMe = () => api.get(BASE).then((res) => res.data)

// Merge update: send only changed fields. Optional fields to remove go in `clearFields`
// (lastName, phone, avatarUrl, dateOfBirth); a field can't be both set and cleared.
export const updateMe = (changes) => api.put(BASE, changes).then((res) => res.data)

// 404 "User preferences not found" is the normal first-time state: resolve null, not an error
export async function getPreferences() {
  try {
    return (await api.get(`${BASE}/preferences`)).data
  } catch (err) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

// First save: language, country, currency, timezone, budgetCycleDay and theme are all required
export const createPreferences = (preferences) =>
  api.post(`${BASE}/preferences`, preferences).then((res) => res.data)

// Merge update; notificationSettings replaces the whole object, so always send it complete
export const updatePreferences = (changes) => api.put(`${BASE}/preferences`, changes).then((res) => res.data)
