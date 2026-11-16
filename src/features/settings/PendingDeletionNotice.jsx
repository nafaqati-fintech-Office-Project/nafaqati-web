import { useEffect } from 'react'
import { APP_TEXT } from '../../constants/appText.js'
import { useToast } from '../../hooks/useToast.js'
import { getDeletionRequests } from '../../services/userApi.js'
import { deletionDate, openRequest } from '../../utils/accountDeletion.js'

const t = APP_TEXT.settings

// Once per sign-in: an account scheduled for deletion gets a notice that links to Settings, where it can be restored.
export default function PendingDeletionNotice() {
  const toast = useToast()

  useEffect(() => {
    let active = true
    getDeletionRequests()
      .then((list) => {
        const pending = openRequest(list)
        if (active && pending) {
          toast.info(`${t.pendingTitle}. ${t.pendingBody(deletionDate(pending.purgeAfter))}`, {
            to: '/settings#delete-account',
            label: t.restore,
          })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [toast])

  return null
}
