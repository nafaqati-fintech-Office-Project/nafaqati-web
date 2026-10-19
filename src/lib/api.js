import axios from 'axios'
import { refresh } from './authApi.js'
import {
  clearSession,
  getAccessToken,
  readRefreshToken,
  setAccessToken,
  writeRefreshToken,
} from './tokenStore.js'

export const FORCED_LOGOUT_EVENT = 'nafaqati:forced-logout'
export const TOKEN_REFRESHED_EVENT = 'nafaqati:token-refreshed'

const LOCK_NAME = 'nafaqati-refresh'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// The server definitively refused the refresh token (as opposed to a network or server hiccup)
export const isRefreshRejected = (err) =>
  Boolean(err?.rejected) || [400, 401, 403].includes(err?.response?.status)

// Runs inside the cross-tab lock: another tab may have rotated the token, so read it fresh
async function rotateTokens() {
  const stored = readRefreshToken()
  if (!stored) {
    const err = new Error('No refresh token')
    err.rejected = true
    throw err
  }
  const data = await refresh(stored.token)
  writeRefreshToken(data.refreshToken, stored.remember)
  setAccessToken(data.accessToken)
  window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { expiresIn: data.expiresIn } }))
  return data
}

const withLock = () =>
  navigator.locks?.request ? navigator.locks.request(LOCK_NAME, rotateTokens) : rotateTokens()

let inFlight = null

export function refreshSession() {
  if (!inFlight) {
    inFlight = withLock().finally(() => {
      inFlight = null
    })
  }
  return inFlight
}

function endSession() {
  clearSession()
  window.dispatchEvent(new Event(FORCED_LOGOUT_EVENT))
}

// The app language ("en" | "ar"): sent as Accept-Language so the backend renders its texts (notifications) in it.
// PreferencesProvider updates it whenever preferences.language changes.
let language = 'en'
export const setApiLanguage = (value) => {
  language = value === 'ar' ? 'ar' : 'en'
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = language
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (response?.status !== 401 || !config || config.url?.includes('/api/auth/')) {
      return Promise.reject(error)
    }
    if (config.retried) {
      endSession()
      return Promise.reject(error)
    }
    config.retried = true
    try {
      await refreshSession()
    } catch (refreshError) {
      if (isRefreshRejected(refreshError)) endSession()
      return Promise.reject(error)
    }
    return api(config)
  },
)

export default api
