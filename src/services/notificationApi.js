import api from '../lib/api.js'

// notification-service through the gateway. title/message come rendered for the Accept-Language header (sent by lib/api.js)
// and are PLAIN TEXT: render them as text only.
const BASE = '/api/notifications'

// { content, page, size, totalElements, totalPages, last }; newest first; size 1-50
export const listNotifications = ({ page = 0, size = 20, unreadOnly = false, type, severity } = {}) =>
  api.get(BASE, { params: { page, size, unreadOnly: unreadOnly || undefined, type: type || undefined, severity: severity || undefined } }).then((res) => res.data)

export const getUnreadCount = () => api.get(`${BASE}/unread-count`).then((res) => res.data.count)

export const getNotification = (id) => api.get(`${BASE}/${id}`).then((res) => res.data)

export const markRead = (id) => api.patch(`${BASE}/${id}/read`).then((res) => res.data)

export const markUnread = (id) => api.patch(`${BASE}/${id}/unread`).then((res) => res.data)

// { updatedCount }
export const markAllRead = () => api.patch(`${BASE}/read-all`).then((res) => res.data)

export const deleteNotification = (id) => api.delete(`${BASE}/${id}`).then(() => ({ id }))

// { preferences: [{ type, enabled }] } with one entry per type
export const getPreferences = () => api.get(`${BASE}/preferences`).then((res) => res.data)

// changes: [{ type, enabled }]; SECURITY_ALERT and SYSTEM cannot be switched off (400)
export const updatePreferences = (changes) => api.put(`${BASE}/preferences`, { preferences: changes }).then((res) => res.data)
