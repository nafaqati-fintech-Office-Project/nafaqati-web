import { useCallback, useState } from 'react'
import { useNotificationCount } from '../../hooks/useNotificationCount.js'
import { useToast } from '../../hooks/useToast.js'
import { getErrorInfo } from '../../lib/errors.js'
import * as notificationApi from '../../services/notificationApi.js'
import { deepLinkFor } from './notificationUtils.js'
import { useNotificationText } from './useNotificationText.js'

// Read / unread / delete / read-all. Every successful mutation refreshes the bell count (coalesced) and calls onChanged
// so the list reloads once. Failures show the readable error as a toast.
export function useNotificationActions({ onChanged, navigate } = {}) {
  const { refresh } = useNotificationCount()
  const toast = useToast()
  const { t } = useNotificationText()
  const [busyId, setBusyId] = useState(null)
  const [busyAll, setBusyAll] = useState(false)

  const run = useCallback(
    async (id, action) => {
      setBusyId(id)
      try {
        await action()
        refresh()
        onChanged?.()
        return true
      } catch (err) {
        toast.error(getErrorInfo(err, 'notifications').message || t.item.actionsFailed)
        return false
      } finally {
        setBusyId(null)
      }
    },
    [refresh, onChanged, toast, t],
  )

  const open = useCallback(
    async (notification) => {
      const to = deepLinkFor(notification)
      if (!notification.read) await run(notification.id, () => notificationApi.markRead(notification.id))
      if (to) navigate?.(to)
    },
    [run, navigate],
  )
  const toggleRead = useCallback(
    (n) => run(n.id, () => (n.read ? notificationApi.markUnread(n.id) : notificationApi.markRead(n.id))),
    [run],
  )
  const remove = useCallback((n) => run(n.id, () => notificationApi.deleteNotification(n.id)), [run])
  const readAll = useCallback(async () => {
    setBusyAll(true)
    await run(null, () => notificationApi.markAllRead())
    setBusyAll(false)
  }, [run])

  return { open, toggleRead, remove, readAll, busyId, busyAll }
}
