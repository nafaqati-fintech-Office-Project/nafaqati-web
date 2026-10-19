import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Crown, X } from 'lucide-react'
import { Logo } from '../ui/Logo.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { NAV_ITEMS } from '../../config/navigation.js'

export default function Sidebar({ open, onClose }) {
  const { sidebar, nav } = APP_TEXT

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo size={34} />
          <span className="sidebar-brand-name">{APP_TEXT.topbar.root}</span>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label={sidebar.close}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label={sidebar.label}>
          {NAV_ITEMS.map(({ key, path, icon: Icon }) => (
            <NavLink key={key} to={path} className="nav-item" data-label={nav[key]} onClick={onClose}>
              <Icon size={19} aria-hidden="true" />
              <span className="nav-item-text">{nav[key]}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-upgrade" title={sidebar.upgradeTitle}>
          <Crown size={22} aria-hidden="true" />
          <div className="sidebar-upgrade-text">
            <strong>{sidebar.upgradeTitle}</strong>
            <span>{sidebar.upgradeSubtitle}</span>
          </div>
        </div>
      </aside>
    </>
  )
}
