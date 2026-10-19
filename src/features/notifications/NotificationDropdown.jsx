import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CircleAlert } from 'lucide-react'
import { useNotificationCount } from '../../hooks/useNotificationCount.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { APP_TEXT } from '../../constants/appText.js'
import { getErrorInfo } from '../../lib/errors.js'
import NotificationItem from './NotificationItem.jsx'
import NotificationSkeleton from './NotificationSkeleton.jsx'
import { useNotificationActions } from './useNotificationActions.js'
import { useNotificationText } from './useNotificationText.js'
import './NotificationDropdown.css'

const PARAMS = { page: 0, size: 10 }

// Latest 10 notifications, loaded when the dropdown opens
export default function NotificationDropdown({ dir, onClose }) {
  const { t } = useNotificationText()
  const { count } = useNotificationCount()
  const navigate = useNavigate()
  const list = useNotifications(PARAMS)
  const { refetch } = list
  const go = useCallback(
    (to) => {
      onClose()
      navigate(to)
    },
    [navigate, onClose],
  )
  const actions = useNotificationActions({ onChanged: refetch, navigate: go })
  const items = list.data?.content ?? []

  return (
    <div className="notif-pop" role="dialog" aria-label={t.dropdownTitle} dir={dir}>
      <header className="notif-pop-head">
        <h2>{t.dropdownTitle}</h2>
        <button type="button" className="link-btn" onClick={actions.readAll} disabled={count === 0 || actions.busyAll}>
          {t.markAllRead}
        </button>
      </header>

      <div className="notif-pop-body">
        {list.loading ? (
          <NotificationSkeleton rows={4} label={t.loading} />
        ) : list.error ? (
          <div className="notif-pop-state" role="alert">
            <CircleAlert size={24} aria-hidden="true" />
            <p>{getErrorInfo(list.error, 'notifications').message}</p>
            <button type="button" className="dc-retry" onClick={list.retry}>
              {APP_TEXT.common.retry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="notif-pop-state">
            <Bell size={24} aria-hidden="true" />
            <p>{t.dropdownEmpty}</p>
          </div>
        ) : (
          <ul className="notif-pop-list">
            {items.map((n) => (
              <NotificationItem key={n.id} notification={n} compact onOpen={actions.open} />
            ))}
          </ul>
        )}
      </div>

      <footer className="notif-pop-foot">
        <Link to="/notifications" onClick={onClose}>
          {t.viewAll}
        </Link>
      </footer>
    </div>
  )
}
