import api from '../lib/api.js'

// user-service through the gateway only (VITE_API_BASE_URL). The shared client adds the Bearer
// token and refreshes once on 401. Errors are raw axios errors: parse them with getErrorInfo().
const BASE = '/api/users/me'

export const getMe = () => api.get(BASE).then((res) => res.data)

// Merge update: send only changed fields. Optional fields to remove go in `clearFields`
// (lastName, phone, avatarUrl, dateOfBirth); a field can't be both set and cleared.
export const updateMe = (changes) => api.put(BASE, changes).then((res) => res.data)

// Profile picture: the file is sent as multipart ("file"); the server resizes it to a small square JPEG and returns
// the new avatarUrl, a path on this API (the picture is private: load it with fetchAvatar, never as a plain <img>).
export const uploadAvatar = (file) => {
  const body = new FormData()
  body.append('file', file)
  return api.post(`${BASE}/avatar`, body).then((res) => res.data)
}

export const deleteAvatar = () => api.delete(`${BASE}/avatar`)

// Object URL for a picture stored by this API (an avatarUrl starting with /api/)
export const fetchAvatar = (url) => api.get(url, { responseType: 'blob' }).then((res) => URL.createObjectURL(res.data))

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
