import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronLeft, ChevronRight, CircleAlert, Inbox, Settings as SettingsIcon } from 'lucide-react'
import { APP_TEXT } from '../../constants/appText.js'
import { useNotificationCount } from '../../hooks/useNotificationCount.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { getErrorInfo } from '../../lib/errors.js'
import NotificationFilters from './NotificationFilters.jsx'
import NotificationItem from './NotificationItem.jsx'
import NotificationSkeleton from './NotificationSkeleton.jsx'
import { useNotificationActions } from './useNotificationActions.js'
import { useNotificationText } from './useNotificationText.js'
import './NotificationsPage.css'

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const { t, dir } = useNotificationText()
  const { count } = useNotificationCount()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ unreadOnly: false, type: '', page: 0 })
  const list = useNotifications({ page: filters.page, size: PAGE_SIZE, unreadOnly: filters.unreadOnly, type: filters.type })
  const data = list.data
  const { refetch } = list
  const onChanged = useCallback(() => refetch(), [refetch])
  const actions = useNotificationActions({ onChanged, navigate })
  const items = data?.content ?? []

  const change = (patch) => setFilters((f) => ({ ...f, page: 0, ...patch }))
  const goPage = (page) => setFilters((f) => ({ ...f, page }))
  const filtered = filters.unreadOnly || filters.type
  const empty = filters.type ? t.page.emptyFiltered : filters.unreadOnly ? t.page.emptyUnread : t.page.emptyAll

  // The last item of a page was deleted/read away: step back to a page that exists
  if (data && items.length === 0 && filters.page > 0 && data.totalPages > 0 && filters.page >= data.totalPages) {
    goPage(data.totalPages - 1)
  }

  const Prev = dir === 'rtl' ? ChevronRight : ChevronLeft
  const Next = dir === 'rtl' ? ChevronLeft : ChevronRight
  const from = data ? data.page * data.size + 1 : 0
  const to = data ? data.page * data.size + items.length : 0

  return (
    <div className="notif-page" dir={dir}>
      <header className="notif-page-head">
        <div>
          <h1>{t.page.title}</h1>
          <p>{t.page.subtitle}</p>
        </div>
        <div className="notif-page-actions">
          <Link to="/settings#notifications" className="btn btn-outline">
            <SettingsIcon size={16} aria-hidden="true" />
            {t.page.settingsLink}
          </Link>
          <button type="button" className="btn btn-primary" onClick={actions.readAll} disabled={count === 0 || actions.busyAll}>
            {t.markAllRead}
          </button>
        </div>
      </header>

      <NotificationFilters
        unreadOnly={filters.unreadOnly}
        type={filters.type}
        onUnreadOnly={(unreadOnly) => change({ unreadOnly })}
        onType={(type) => change({ type })}
      />

      <section className="notif-card" aria-label={t.page.listLabel} aria-busy={list.loading}>
        {list.loading ? (
          <NotificationSkeleton rows={6} label={t.loading} />
        ) : list.error ? (
          <div className="dc-state" role="alert">
            <CircleAlert size={32} aria-hidden="true" />
            <strong>{t.page.errorTitle}</strong>
            <p>{getErrorInfo(list.error, 'notifications').message}</p>
            <button type="button" className="dc-retry" onClick={list.retry}>
              {APP_TEXT.common.retry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="dc-state">
            {filtered ? <Inbox size={32} aria-hidden="true" /> : <Bell size={32} aria-hidden="true" />}
            <strong>{empty.title}</strong>
            <p>{empty.body}</p>
          </div>
        ) : (
          <ul className="notif-list">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onOpen={actions.open}
                onToggleRead={actions.toggleRead}
                onDelete={actions.remove}
                busy={actions.busyId === n.id}
              />
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <nav className="notif-pager" aria-label={t.page.listLabel}>
            <span>{t.page.showing(from, to, data.totalElements)}</span>
            <span className="notif-pager-btns">
              <button type="button" className="icon-btn" onClick={() => goPage(filters.page - 1)} disabled={filters.page === 0} aria-label={t.page.prev}>
                <Prev size={18} aria-hidden="true" />
              </button>
              <button type="button" className="icon-btn" onClick={() => goPage(filters.page + 1)} disabled={data.last} aria-label={t.page.next}>
                <Next size={18} aria-hidden="true" />
              </button>
            </span>
          </nav>
        )}
      </section>
    </div>
  )
}
