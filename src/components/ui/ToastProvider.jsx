import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CircleAlert, CircleCheck, X } from 'lucide-react'
import { ToastContext } from '../../context/ToastContext.js'
import { APP_TEXT } from '../../constants/appText.js'

const DURATION_MS = 4000

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (kind, message, link) => {
      const id = nextId.current++
      setToasts((list) => [...list, { id, kind, message, link }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      // non-intrusive notice with an optional link: { to, label }
      info: (message, link) => push('info', message, link),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.kind === 'error' ? <CircleAlert size={18} aria-hidden="true" /> : t.kind === 'info' ? <Bell size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
            <span>{t.message}</span>
            {t.link && (
              <Link to={t.link.to} className="toast-link" onClick={() => dismiss(t.id)}>
                {t.link.label}
              </Link>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label={APP_TEXT.transactions.toasts.dismiss}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
