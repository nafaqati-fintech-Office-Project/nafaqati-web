import { useContext } from 'react'
import { UserContext } from '../context/UserContext.js'

// { profile, loading, error, refresh, updateProfile(profile) }
export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
