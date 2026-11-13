import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { Logo } from '../../components/ui/Logo.jsx'
import AuthLoader from '../../components/AuthLoader.jsx'
import { Alert } from '../../components/AuthShell/AuthShell.jsx'
import { usePreferences } from '../../hooks/usePreferences.js'
import { APP_TEXT } from '../../constants/appText.js'
import { COUNTRIES, CURRENCIES, countryFromLocale, currencyForCountry } from '../../constants/currencies.js'
import { getErrorInfo } from '../../lib/errors.js'
import { createPreferences, getPreferences } from '../../services/userApi.js'
import { browserTimeZone } from '../../utils/format.js'
import './Onboarding.css'

const t = APP_TEXT.onboarding
const BUDGET_CYCLE_DAY = 1

// Everything except country and currency is filled in automatically (and editable later in Settings)
function autoDefaults() {
  return {
    language: navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en',
    timezone: browserTimeZone(),
    budgetCycleDay: BUDGET_CYCLE_DAY,
    theme: 'light',
    notificationSettings: { email: true },
  }
}

function OnboardingForm({ onDone }) {
  const [auto] = useState(autoDefaults)
  const [country, setCountry] = useState(() => countryFromLocale())
  const [currency, setCurrency] = useState(() => currencyForCountry(countryFromLocale()))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const changeCountry = (code) => {
    setCountry(code)
    setCurrency(currencyForCountry(code)) // suggestion; the user can still pick another one
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving || !country || !currency) return
    setSaving(true)
    setError('')
    try {
      onDone(await createPreferences({ ...auto, country: country.toUpperCase(), currency: currency.toUpperCase() }))
    } catch (err) {
      if (err?.response?.status === 409) {
        // Already created (another tab, or a retry): that's the goal, so load what exists and carry on
        try {
          const existing = await getPreferences()
          if (existing) return onDone(existing)
        } catch {
          /* fall through to the generic message */
        }
      }
      setError(getErrorInfo(err, 'preferences').message)
      setSaving(false)
    }
    return undefined
  }

  return (
    <form className="onboarding-form" onSubmit={submit} noValidate>
      <Alert kind="error">{error}</Alert>

      <div className="form-field">
        <label htmlFor="onb-country">{t.country}</label>
        <select id="onb-country" value={country} onChange={(e) => changeCountry(e.target.value)} data-autofocus>
          <option value="">{t.countryPlaceholder}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="onb-currency">{t.currency}</label>
        <select id="onb-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">{t.currencyPlaceholder}</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="auth-hint">{t.currencyHint}</span>
      </div>

      <div className="onboarding-auto">
        <h2>{t.autoTitle}</h2>
        <dl>
          <div>
            <dt>{t.language}</dt>
            <dd>{t.languages[auto.language]}</dd>
          </div>
          <div>
            <dt>{t.timezone}</dt>
            <dd>{auto.timezone}</dd>
          </div>
          <div>
            <dt>{t.budgetCycle}</dt>
            <dd>{t.budgetCycleValue(auto.budgetCycleDay)}</dd>
          </div>
          <div>
            <dt>{t.notifications}</dt>
            <dd>{t.notificationsValue}</dd>
          </div>
        </dl>
        <p>{t.changeLater}</p>
      </div>

      <button type="submit" className="btn btn-primary onboarding-submit" disabled={!country || !currency || saving}>
        {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
        {saving ? t.saving : t.submit}
      </button>
    </form>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { prefs, loading, error, retry, setPreferences } = usePreferences()

  if (loading) return <AuthLoader />
  if (error) {
    return (
      <div className="dc-state" role="alert" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <p>{error}</p>
        <button type="button" className="dc-retry" onClick={retry}>
          {APP_TEXT.common.retry}
        </button>
      </div>
    )
  }
  // Already set up: nothing to do here
  if (prefs) return <Navigate to="/dashboard" replace />

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <Logo size={56} />
        <h1>{t.title}</h1>
        <p className="onboarding-sub">{t.subtitle}</p>
        <OnboardingForm
          onDone={(created) => {
            setPreferences(created)
            navigate('/dashboard', { replace: true })
          }}
        />
      </section>
    </main>
  )
}
