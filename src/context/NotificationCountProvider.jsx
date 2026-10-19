import { useCallback, useMemo } from 'react'
import { NotificationCountContext } from './NotificationCountContext.js'
import { useToast } from '../hooks/useToast.js'
import { useUnreadCount } from '../hooks/useUnreadCount.js'
import { useNotificationText } from '../features/notifications/useNotificationText.js'

// One unread-count poller for the whole signed-in app. A poll that finds more unread than before shows ONE toast.
export default function NotificationCountProvider({ children }) {
  const toast = useToast()
  const { t } = useNotificationText()
  const onIncrease = useCallback(() => toast.info(t.toast.title, { to: '/notifications', label: t.toast.view }), [toast, t])
  const unread = useUnreadCount({ onIncrease })
  const { count, loaded, error, refresh } = unread
  const value = useMemo(() => ({ count, loaded, error, refresh }), [count, loaded, error, refresh])
  return <NotificationCountContext.Provider value={value}>{children}</NotificationCountContext.Provider>
}
