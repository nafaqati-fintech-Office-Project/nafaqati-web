import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import ToastProvider from '../ui/ToastProvider.jsx'
import NotificationCountProvider from '../../context/NotificationCountProvider.jsx'
import '../ui/ui.css'
import './AppLayout.css'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <ToastProvider>
      <NotificationCountProvider>
      <div className="app-shell">
        <Sidebar open={drawerOpen} onClose={closeDrawer} />
        <div className="app-main">
          <Topbar onMenu={() => setDrawerOpen(true)} />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
      </NotificationCountProvider>
    </ToastProvider>
  )
}
