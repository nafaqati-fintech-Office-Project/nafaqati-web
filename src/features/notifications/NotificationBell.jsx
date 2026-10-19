import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotificationCount } from '../../hooks/useNotificationCount.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import { badgeLabel } from './notificationUtils.js'
import { useNotificationText } from './useNotificationText.js'
import './NotificationBell.css'

// The topbar bell: real unread count (hidden at 0, "99+" cap) and the latest-10 dropdown.
export default function NotificationBell() {
  const { count } = useNotificationCount()
  const { t, dir } = useNotificationText()
  const { pathname } = useLocation()
  // open only for the page it was opened on: navigating closes it
  const [openAt, setOpenAt] = useState(null)
  const open = openAt === pathname
  const setOpen = (next) => setOpenAt((cur) => ((typeof next === 'function' ? next(cur === pathname) : next) ? pathname : null))
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="notif-bell" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="topbar-icon"
        aria-label={t.bell(count)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {badgeLabel(count)}
          </span>
        )}
      </button>
      {open && <NotificationDropdown dir={dir} onClose={() => setOpen(false)} />}
    </div>
  )
}
