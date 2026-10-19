import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CircleHelp, LogOut, Menu, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUser } from '../../hooks/useUser.js'
import Avatar from '../ui/Avatar.jsx'
import NotificationBell from '../../features/notifications/NotificationBell.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { EXTRA_PAGES, NAV_ITEMS } from '../../config/navigation.js'
import { fullName, getProfileInitials } from '../../utils/format.js'

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth()
  const { profile, loading, nameProvisional } = useUser()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const current = [...NAV_ITEMS, ...EXTRA_PAGES].find((item) => pathname.startsWith(item.path))
  const { topbar, nav } = APP_TEXT

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu" onClick={onMenu} aria-label={topbar.menu}>
        <Menu size={22} />
      </button>
      <p className="topbar-crumb">
        {topbar.root}
        {current && <span> / {nav[current.key]}</span>}
      </p>

      <div className="topbar-actions">
        <NotificationBell />
        <button type="button" className="topbar-icon" aria-label={topbar.help}>
          <CircleHelp size={20} />
        </button>

        <div className="topbar-account" ref={menuRef}>
          <button
            type="button"
            className="topbar-avatar"
            aria-label={topbar.account}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {loading ? (
              <span className="sk topbar-avatar-sk" aria-hidden="true" />
            ) : (
              <Avatar src={profile?.avatarUrl} initials={getProfileInitials(profile, user)} />
            )}
          </button>
          {menuOpen && (
            <div className="topbar-menu-pop" role="menu">
              <div className="topbar-menu-user">
                <strong>{(!nameProvisional && fullName(profile)) || user?.username}</strong>
                <span>{user?.email}</span>
              </div>
              <Link to="/profile" role="menuitem" className="topbar-menu-item" onClick={() => setMenuOpen(false)}>
                <UserRound size={16} aria-hidden="true" />
                {topbar.profile}
              </Link>
              <button type="button" role="menuitem" className="topbar-menu-item" onClick={logout}>
                <LogOut size={16} aria-hidden="true" />
                {topbar.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
