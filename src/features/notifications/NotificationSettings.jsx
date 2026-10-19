import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { APP_TEXT } from '../../constants/appText.js'
import { getErrorInfo } from '../../lib/errors.js'
import * as notificationApi from '../../services/notificationApi.js'
import { MANDATORY_TYPES, NOTIFICATION_TYPES } from './notificationUtils.js'
import { useNotificationText } from './useNotificationText.js'
import './NotificationSettings.css'

// Per-type in-app notification switches (GET/PUT /api/notifications/preferences). SECURITY_ALERT and SYSTEM are always on.
export default function NotificationSettings() {
  const { t, dir } = useNotificationText()
  const [state, setState] = useState({ loading: true, error: '', enabled: {} })
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (window.location.hash === '#notifications') document.getElementById('notifications')?.scrollIntoView()
  }, [])

  useEffect(() => {
    let alive = true
    notificationApi
      .getPreferences()
      .then((data) => alive && setState({ loading: false, error: '', enabled: Object.fromEntries(data.preferences.map((p) => [p.type, p.enabled])) }))
      .catch((err) => alive && setState({ loading: false, error: getErrorInfo(err, 'notifications').message, enabled: {} }))
    return () => {
      alive = false
    }
  }, [attempt])

  const toggle = async (type) => {
    if (saving) return
    const next = !state.enabled[type]
    setMessage('')
    setSaving(type)
    setState((s) => ({ ...s, enabled: { ...s.enabled, [type]: next } }))
    try {
      const data = await notificationApi.updatePreferences([{ type, enabled: next }])
      setState((s) => ({ ...s, enabled: Object.fromEntries(data.preferences.map((p) => [p.type, p.enabled])) }))
    } catch (err) {
      setState((s) => ({ ...s, enabled: { ...s.enabled, [type]: !next } }))
      setMessage(getErrorInfo(err, 'notifications').message || t.settings.saveFailed)
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="panel notif-settings" id="notifications" aria-labelledby="notif-settings-title" dir={dir}>
      <h2 id="notif-settings-title" className="panel-title">
        {t.settings.title}
      </h2>
      <p className="notif-settings-hint">{t.settings.hint}</p>
      <p className="notif-settings-note">{t.settings.emailNote}</p>

      {state.loading ? (
        <div aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="sk" style={{ display: 'block', blockSize: 44, borderRadius: 10, marginBlockEnd: 10 }} />
          ))}
        </div>
      ) : state.error ? (
        <div className="dc-state" role="alert">
          <p>{t.settings.loadFailed}</p>
          <p>{state.error}</p>
          <button type="button" className="dc-retry" onClick={() => { setState({ loading: true, error: '', enabled: {} }); setAttempt((n) => n + 1) }}>
            {APP_TEXT.common.retry}
          </button>
        </div>
      ) : (
        <ul className="notif-settings-list">
          {NOTIFICATION_TYPES.map((type) => {
            const mandatory = MANDATORY_TYPES.includes(type)
            const on = mandatory || state.enabled[type] !== false
            return (
              <li key={type}>
                <div>
                  <span id={`notif-pref-${type}`}>{t.types[type]}</span>
                  <small>{t.settings.descriptions[type]}</small>
                </div>
                {mandatory && (
                  <span className="notif-always">
                    <Lock size={13} aria-hidden="true" />
                    {t.settings.alwaysOn}
                  </span>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-labelledby={`notif-pref-${type}`}
                  className={`notif-switch ${on ? 'is-on' : ''}`}
                  disabled={mandatory || saving === type}
                  onClick={() => toggle(type)}
                >
                  <span />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {message && (
        <p className="notif-settings-error" role="alert">
          {message}
        </p>
      )}
    </section>
  )
}
