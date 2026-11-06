import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../lib/authApi.js'
import { FORCED_LOGOUT_EVENT, isRefreshRejected, refreshSession, TOKEN_REFRESHED_EVENT } from '../lib/api.js'
import {
  clearSession,
  readRefreshToken,
  REFRESH_KEY,
  setAccessToken,
  writeRefreshToken,
} from '../lib/tokenStore.js'

const AuthContext = createContext(null)

const REFRESH_LEAD_SECONDS = 60
const RETRY_DELAY_MS = 15000

const toUser = ({ id, username, email, role }) => ({ id, username, email, role })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (readRefreshToken() ? 'loading' : 'unauthenticated'))
  const [sessionExpired, setSessionExpired] = useState(false)

  const timerRef = useRef(null)
  const proactiveRefreshRef = useRef(() => {})

  const cancelRefresh = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const signedOut = useCallback((expired) => {
    cancelRefresh()
    setUser(null)
    setSessionExpired(expired)
    setStatus('unauthenticated')
  }, [cancelRefresh])

  // Refresh ~60s before the access token expires (shorter lead for very short lifetimes)
  const scheduleRefresh = useCallback(
    (expiresIn) => {
      cancelRefresh()
      if (!Number.isFinite(expiresIn)) return
      const lead = expiresIn > REFRESH_LEAD_SECONDS * 2 ? REFRESH_LEAD_SECONDS : expiresIn / 2
      timerRef.current = setTimeout(() => proactiveRefreshRef.current(), Math.max(0, expiresIn - lead) * 1000)
    },
    [cancelRefresh],
  )

  useEffect(() => {
    proactiveRefreshRef.current = () => {
      // Success reschedules itself through TOKEN_REFRESHED_EVENT
      refreshSession().catch((err) => {
        if (isRefreshRejected(err)) {
          clearSession()
          signedOut(true)
        } else {
          timerRef.current = setTimeout(() => proactiveRefreshRef.current(), RETRY_DELAY_MS)
        }
      })
    }
  }, [signedOut])

  useEffect(() => {
    const onRefreshed = (event) => scheduleRefresh(event.detail?.expiresIn)
    window.addEventListener(TOKEN_REFRESHED_EVENT, onRefreshed)
    return () => {
      window.removeEventListener(TOKEN_REFRESHED_EVENT, onRefreshed)
      cancelRefresh()
    }
  }, [scheduleRefresh, cancelRefresh])

  useEffect(() => {
    if (!readRefreshToken()) return undefined
    let active = true
    refreshSession()
      .then((data) => {
        if (!active) return
        setUser(toUser(data))
        setStatus('authenticated')
      })
      .catch((err) => {
        if (!active) return
        const rejected = isRefreshRejected(err)
        if (rejected) clearSession()
        signedOut(rejected)
      })
    return () => {
      active = false
    }
  }, [signedOut])

  useEffect(() => {
    const onForcedLogout = () => signedOut(true)
    const onStorage = (event) => {
      if (event.key !== null && event.key !== REFRESH_KEY) return
      if (readRefreshToken()) return
      setAccessToken(null)
      signedOut(false)
    }
    window.addEventListener(FORCED_LOGOUT_EVENT, onForcedLogout)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(FORCED_LOGOUT_EVENT, onForcedLogout)
      window.removeEventListener('storage', onStorage)
    }
  }, [signedOut])

  const startSession = useCallback(
    (data, rememberMe) => {
      setAccessToken(data.accessToken)
      writeRefreshToken(data.refreshToken, Boolean(rememberMe))
      setUser(toUser(data))
      setSessionExpired(false)
      setStatus('authenticated')
      scheduleRefresh(data.expiresIn)
    },
    [scheduleRefresh],
  )

  const login = useCallback(
    async (identifier, password, rememberMe) => {
      startSession(await authApi.login(identifier, password, rememberMe), rememberMe)
    },
    [startSession],
  )

  const loginWithGoogle = useCallback(
    async (idToken) => {
      startSession(await authApi.googleLogin(idToken, true), true)
    },
    [startSession],
  )

  const register = useCallback((data) => authApi.register(data), [])

  const logout = useCallback(() => {
    const stored = readRefreshToken()
    clearSession()
    signedOut(false)
    if (stored) authApi.logout(stored.token).catch(() => {})
  }, [signedOut])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isInitializing: status === 'loading',
      sessionExpired,
      login,
      loginWithGoogle,
      register,
      logout,
    }),
    [user, status, sessionExpired, login, loginWithGoogle, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
