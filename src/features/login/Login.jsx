import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getErrorInfo } from '../../lib/errors.js'
import AuthShell, { Alert, Field } from '../../components/AuthShell/AuthShell.jsx'
import PasswordInput from '../../components/PasswordInput/PasswordInput.jsx'
import TabSwitch from '../../components/ui/TabSwitch.jsx'
import { AUTH_TEXT } from '../../constants/authText.js'
import AuthLoader from '../../components/AuthLoader.jsx'
import { isEmail, isValidUsername } from '../../lib/validators.js'
import './Login.css'

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 12.04c-.03-2.77 2.26-4.1 2.36-4.17-1.29-1.88-3.29-2.14-4-2.17-1.7-.17-3.32 1-4.18 1-.87 0-2.2-.98-3.62-.95-1.86.03-3.58 1.08-4.54 2.75-1.94 3.36-.5 8.33 1.39 11.06.92 1.33 2.02 2.83 3.46 2.78 1.39-.06 1.91-.9 3.59-.9 1.68 0 2.15.9 3.62.87 1.5-.03 2.44-1.36 3.35-2.7 1.06-1.55 1.5-3.05 1.52-3.13-.03-.01-2.91-1.12-2.95-4.44zM14.3 3.9c.76-.93 1.28-2.2 1.14-3.48-1.1.04-2.43.73-3.22 1.65-.7.81-1.32 2.12-1.16 3.37 1.23.1 2.49-.62 3.24-1.54z"
      />
    </svg>
  )
}

const T = AUTH_TEXT.login
const TABS = [
  { value: 'email', label: T.tabs.email },
  { value: 'mobile', label: T.tabs.mobile },
]
const MAX_PASSWORD_CHARS = 72

export default function Login() {
  const { isAuthenticated, isInitializing, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [method, setMethod] = useState('email')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  if (isInitializing) return <AuthLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const mobileTab = method === 'mobile'

  const validate = () => {
    const next = {}
    const id = email.trim()
    if (!id) next.identifier = T.errors.emailRequired
    else if (!isEmail(id) && !isValidUsername(id)) next.identifier = T.errors.emailInvalid
    if (!password) next.password = T.errors.passwordRequired
    else if ([...password].length > MAX_PASSWORD_CHARS) next.password = T.errors.passwordTooLong
    return next
  }

  const changeMethod = (value) => {
    setMethod(value)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || mobileTab) return
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      await login(email.trim(), password, remember)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const info = getErrorInfo(err, 'login')
      if (!mounted.current) return
      setErrors({ identifier: info.fieldErrors.identifier, password: info.fieldErrors.password, form: info.message })
      setSubmitting(false)
    }
  }

  const socialPlaceholder = (provider) => console.log(`${provider} sign-in not implemented yet`)

  return (
    <AuthShell title={T.title} subtitle={T.subtitle}>
      <Alert kind="success">{location.state?.message}</Alert>
      <Alert kind="error">{location.state?.expired && T.sessionExpired}</Alert>

      <TabSwitch tabs={TABS} value={method} onChange={changeMethod} label={T.tabsLabel} />

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {method === 'email' ? (
          <Field
            key="email"
            id="login-identifier"
            label={T.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={T.emailPlaceholder}
            autoComplete="username"
            error={errors.identifier}
          />
        ) : (
          <Field
            key="mobile"
            id="login-identifier"
            label={T.mobileLabel}
            prefix={T.mobilePrefix}
            type="tel"
            inputMode="numeric"
            maxLength={9}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            placeholder={T.mobilePlaceholder}
            autoComplete="tel-national"
            error={errors.identifier}
          />
        )}

        <PasswordInput
          id="login-password"
          label={T.passwordLabel}
          icon={null}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={T.passwordPlaceholder}
          autoComplete="current-password"
          error={errors.password}
        />

        <div className="login-row">
          <label className="login-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {T.remember}
          </label>
          <Link to="/forgot-password" className="auth-link">
            {T.forgot}
          </Link>
        </div>

        {mobileTab && <p className="login-note">{T.mobileSoon}</p>}
        <Alert kind="error">{errors.form}</Alert>

        <button type="submit" className="auth-submit" disabled={submitting || mobileTab}>
          {submitting && <span className="auth-spinner" aria-hidden="true" />}
          {submitting ? T.submitting : T.submit}
        </button>
      </form>

      <div className="auth-divider">
        <span>{T.divider}</span>
      </div>

      <div className="login-social">
        <button type="button" className="login-social-btn" onClick={() => socialPlaceholder('Google')}>
          <GoogleLogo /> Google
        </button>
        <button type="button" className="login-social-btn" onClick={() => socialPlaceholder('Apple')}>
          <AppleLogo /> Apple
        </button>
      </div>

      <p className="auth-footer">
        {T.noAccount}{' '}
        <Link to="/register" className="auth-link">
          {T.createAccount}
        </Link>
      </p>
    </AuthShell>
  )
}
