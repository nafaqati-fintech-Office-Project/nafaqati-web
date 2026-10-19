import axios from 'axios'

// Bare instance: no interceptors, so auth calls are never retried or refreshed
const bare = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

const post = (path, body) => bare.post(`/api/auth/${path}`, body).then((res) => res.data)

export const login = (identifier, password, rememberMe) =>
  post('login', { identifier, password, rememberMe: Boolean(rememberMe) })

export const register = (data) => post('register', data)

export const refresh = (refreshToken) => post('refresh', { refreshToken })

export const logout = (refreshToken) => post('logout', { refreshToken })

export const forgotPassword = (email) => post('forgot-password', { email })

export const resetPassword = (token, newPassword) => post('reset-password', { token, newPassword })
