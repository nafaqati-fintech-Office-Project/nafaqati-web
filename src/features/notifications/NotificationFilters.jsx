import { NOTIFICATION_TYPES } from './notificationUtils.js'
import { useNotificationText } from './useNotificationText.js'
import './NotificationFilters.css'

// All / Unread tabs and the type filter
export default function NotificationFilters({ unreadOnly, type, onUnreadOnly, onType }) {
  const { t } = useNotificationText()
  const tabs = [
    [false, t.page.all],
    [true, t.page.unreadTab],
  ]
  return (
    <div className="notif-filters">
      <div className="notif-tabs" role="group" aria-label={t.page.tabsLabel}>
        {tabs.map(([value, label]) => (
          <button key={label} type="button" className={`chip ${unreadOnly === value ? 'is-active' : ''}`} aria-pressed={unreadOnly === value} onClick={() => onUnreadOnly(value)}>
            {label}
          </button>
        ))}
      </div>
      <label className="notif-type">
        <span>{t.page.typeLabel}</span>
        <select value={type} onChange={(e) => onType(e.target.value)}>
          <option value="">{t.page.allTypes}</option>
          {NOTIFICATION_TYPES.map((value) => (
            <option key={value} value={value}>
              {t.types[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
