export const REFRESH_KEY = 'nafaqati_refresh_token'

let accessToken = null

export const getAccessToken = () => accessToken

export const setAccessToken = (token) => {
  accessToken = token
}

function tryStorage(storage, action) {
  try {
    return action(storage)
  } catch {
    return null
  }
}

export function readRefreshToken() {
  const persisted = tryStorage(localStorage, (s) => s.getItem(REFRESH_KEY))
  if (persisted) return { token: persisted, remember: true }
  const temporary = tryStorage(sessionStorage, (s) => s.getItem(REFRESH_KEY))
  return temporary ? { token: temporary, remember: false } : null
}

export function writeRefreshToken(token, remember) {
  const keep = remember ? localStorage : sessionStorage
  const drop = remember ? sessionStorage : localStorage
  tryStorage(drop, (s) => s.removeItem(REFRESH_KEY))
  tryStorage(keep, (s) => s.setItem(REFRESH_KEY, token))
}

export function clearRefreshToken() {
  tryStorage(localStorage, (s) => s.removeItem(REFRESH_KEY))
  tryStorage(sessionStorage, (s) => s.removeItem(REFRESH_KEY))
}

export function clearSession() {
  accessToken = null
  clearRefreshToken()
}
