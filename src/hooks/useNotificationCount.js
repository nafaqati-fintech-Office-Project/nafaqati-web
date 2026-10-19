import { useContext } from 'react'
import { NotificationCountContext } from '../context/NotificationCountContext.js'

// { count, loaded, error, refresh } for the signed-in user (provided by NotificationCountProvider in AppLayout)
export function useNotificationCount() {
  const ctx = useContext(NotificationCountContext)
  if (!ctx) throw new Error('useNotificationCount must be used inside NotificationCountProvider')
  return ctx
}
