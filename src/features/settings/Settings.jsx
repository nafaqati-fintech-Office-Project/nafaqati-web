import { useState } from 'react'
import { LoaderCircle, Mail, Trash2 } from 'lucide-react'
import { usePreferences } from '../../hooks/usePreferences.js'
import { Alert } from '../../components/AuthShell/AuthShell.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { getErrorInfo } from '../../lib/errors.js'
import { updatePreferences } from '../../services/userApi.js'
import { COUNTRIES, CURRENCIES } from '../../constants/currencies.js'
import NotificationSettings from '../notifications/NotificationSettings.jsx'
import { BUDGET_DAYS, LANGUAGES, TIMEZONES } from './preferenceOptions.js'
import './Settings.css'

const t = APP_TEXT.settings
const FIELDS = ['language', 'country', 'currency', 'timezone', 'budgetCycleDay']

// Form state from the saved preferences. country/currency are always upper case.
function toForm(base) {
  return {
    language: base.language,
    country: base.country.toUpperCase(),
    currency: base.currency.toUpperCase(),
    timezone: base.timezone,
    budgetCycleDay: String(base.budgetCycleDay),
    emailNotifications: base.notificationSettings?.email ?? true,
  }
}

const normalize = (key, value) => (key === 'budgetCycleDay' ? Number(value) : value)

// Options always include the current value, even if it isn't in our short lists
const withCurrent = (options, current) => (options.includes(current) ? options : [current, ...options])

function PreferencesForm({ prefs, onSaved }) {
  const [values, setValues] = useState(() => toForm(prefs))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const baseline = toForm(prefs)
  const changedKeys = Object.keys(baseline).filter((key) => baseline[key] !== values[key])
  const canSave = changedKeys.length > 0

  const set = (patch) => {
    setValues((v) => ({ ...v, ...patch }))
    setDone(false)
  }

  // Replaces the whole notificationSettings object: keep keys we don't edit
  const notificationSettings = () => ({ ...(prefs.notificationSettings ?? {}), email: values.emailNotifications })

  // Merge update: only the fields that changed
  const save = () => {
    const changes = {}
    FIELDS.filter((key) => changedKeys.includes(key)).forEach((key) => {
      changes[key] = normalize(key, values[key])
    })
    if (changedKeys.includes('emailNotifications')) changes.notificationSettings = notificationSettings()
    return updatePreferences(changes)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving || !canSave) return
    setSaving(true)
    setDone(false)
    setErrors({})
    try {
      const saved = await save()
      setValues(toForm(saved))
      setDone(true)
      onSaved(saved)
      // TODO: apply `language` (i18n/RTL) once the app supports them
    } catch (err) {
      const info = getErrorInfo(err, 'preferences')
      setErrors({ ...info.fieldErrors, form: info.message })
    } finally {
      setSaving(false)
    }
  }

  const select = (key, label, options, hint) => (
    <div className="form-field">
      <label htmlFor={`pref-${key}`}>{label}</label>
      <select
        id={`pref-${key}`}
        value={values[key]}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `pref-${key}-error` : undefined}
        onChange={(e) => set({ [key]: e.target.value })}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {hint && !errors[key] && <span className="auth-hint">{hint}</span>}
      {errors[key] && (
        <span id={`pref-${key}-error`} className="auth-error">
          {errors[key]}
        </span>
      )}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate>
      <Alert kind="error">{errors.form}</Alert>
      <Alert kind="success">{done && changedKeys.length === 0 ? t.saved : ''}</Alert>

      <div className="settings-grid">
        {select('language', t.language, withCurrent(LANGUAGES, values.language).map((l) => [l, t.languages[l] ?? l]))}
        {select('country', t.country, withCurrent(COUNTRIES.map((c) => c.code), values.country).map((c) => [c, COUNTRIES.find((x) => x.code === c)?.name ?? c]))}
        {select('currency', t.currency, withCurrent(CURRENCIES, values.currency).map((c) => [c, c]), t.currencyNote)}
        {select('timezone', t.timezone, withCurrent(TIMEZONES, values.timezone).map((z) => [z, z]))}
        {select('budgetCycleDay', t.budgetCycleDay, BUDGET_DAYS.map((d) => [String(d), String(d)]), t.budgetCycleHint)}
      </div>

      <h3 className="settings-sub">{t.notifications}</h3>
      <div className="settings-toggle">
        <div>
          <span id="pref-email-label">{t.emailNotifications}</span>
          <small>{t.emailNotificationsHint}</small>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={values.emailNotifications}
          aria-labelledby="pref-email-label"
          className={`switch ${values.emailNotifications ? 'is-on' : ''}`}
          onClick={() => set({ emailNotifications: !values.emailNotifications })}
        >
          <span />
        </button>
      </div>

      <div className="profile-actions">
        <button type="submit" className="btn btn-primary" disabled={!canSave || saving}>
          {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {saving ? t.saving : t.save}
        </button>
      </div>
    </form>
  )
}

export default function Settings() {
  const { userId, prefs, loading, error, retry, setPreferences } = usePreferences()

  return (
    <div className="page-narrow">
      <header className="page-head">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="panel" aria-labelledby="pref-title" aria-busy={loading}>
        <h2 id="pref-title" className="panel-title">
          {t.preferences}
        </h2>
        {loading && (
          <div className="profile-skeleton" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="sk" style={{ height: 44, borderRadius: 10 }} />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="dc-state" role="alert">
            <p>{t.loadFailed}</p>
            <p>{error}</p>
            <button type="button" className="dc-retry" onClick={retry}>
              {APP_TEXT.common.retry}
            </button>
          </div>
        )}
        {!loading && !error && prefs && (
          <PreferencesForm key={userId} prefs={prefs} onSaved={setPreferences} />
        )}
      </section>

      <NotificationSettings />

      <section className="panel" aria-labelledby="account-title">
        <h2 id="account-title" className="panel-title">
          {t.account}
        </h2>
        <ul className="settings-disabled">
          <li>
            <Mail size={20} aria-hidden="true" />
            <div>
              <strong>{t.changeEmail}</strong>
              <small>{t.changeEmailBody}</small>
            </div>
            <button type="button" className="btn btn-outline" disabled>
              {t.comingSoon}
            </button>
          </li>
          <li>
            <Trash2 size={20} aria-hidden="true" />
            <div>
              <strong>{t.deleteAccount}</strong>
              <small>{t.deleteAccountBody}</small>
            </div>
            <button type="button" className="btn btn-outline" disabled>
              {t.comingSoon}
            </button>
          </li>
        </ul>
      </section>
    </div>
  )
}
