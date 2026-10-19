import { Check, Circle, Trash2 } from 'lucide-react'
import { useFormat } from '../../hooks/useFormat.js'
import { formatRelative } from '../../utils/relativeTime.js'
import { SEVERITY_VISUAL } from './notificationUtils.js'
import { useNotificationText } from './useNotificationText.js'
import './NotificationItem.css'

// One notification. title/message are plain text: they are rendered as React text children, never as HTML.
// `compact` = the dropdown row (the whole row opens it); otherwise the page row with read/unread and delete actions.
export default function NotificationItem({ notification, compact = false, onOpen, onToggleRead, onDelete, busy = false }) {
  const { t, lang } = useNotificationText()
  const { timeZone } = useFormat()
  const visual = SEVERITY_VISUAL[notification.severity] ?? SEVERITY_VISUAL.INFO
  const Icon = visual.icon
  const time = formatRelative(notification.createdAt, { lang, timeZone, justNow: t.justNow })

  const body = (
    <>
      <span className={`notif-icon tone-${visual.tone}`} title={t.severity[notification.severity]}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="notif-text">
        <strong>{notification.title}</strong>
        <span className="notif-message">{notification.message}</span>
        <time dateTime={notification.createdAt}>{time}</time>
      </span>
      {!notification.read && <span className="notif-dot" role="img" aria-label={t.unread} />}
    </>
  )

  return (
    <li className={`notif-item ${notification.read ? '' : 'is-unread'} ${compact ? 'is-compact' : ''}`}>
      <button type="button" className="notif-open" onClick={() => onOpen(notification)}>
        {body}
      </button>
      {!compact && (
        <span className="notif-actions">
          <button
            type="button"
            className="notif-action"
            onClick={() => onToggleRead(notification)}
            disabled={busy}
            title={notification.read ? t.item.markUnread : t.item.markRead}
            aria-label={notification.read ? t.item.markUnread : t.item.markRead}
          >
            {notification.read ? <Circle size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="notif-action is-danger"
            onClick={() => onDelete(notification)}
            disabled={busy}
            title={t.item.delete}
            aria-label={t.item.delete}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </span>
      )}
    </li>
  )
}
