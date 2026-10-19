import { useState } from 'react'
import { MessageSquare, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { AUTH_TEXT } from '../../constants/authText.js'
import { IntellivexMark, Logo } from '../ui/Logo.jsx'
import LanguageSelector from '../ui/LanguageSelector.jsx'
import loginBg from '../../../assets/loginbg.jpg'
import './AuthShell.css'

// Icons line up by index with AUTH_TEXT.features
const FEATURE_ICONS = [MessageSquare, Sparkles, TrendingUp, ShieldCheck]

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  return (
    <div className={`auth-alert auth-alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export function Field({ id, label, icon: Icon, prefix, error, hint, trailing, ...inputProps }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input ${error ? 'auth-input-invalid' : ''}`}>
        {Icon && <Icon size={18} />}
        {prefix && <span className="auth-input-prefix">{prefix}</span>}
        <input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
        {trailing}
      </div>
      {hint && !error && (
        <span id={`${id}-hint`} className="auth-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="auth-error">
          {error}
        </span>
      )}
    </div>
  )
}

export default function AuthShell({ title, subtitle, children }) {
  const [lang, setLang] = useState('en')
  const { brand, features } = AUTH_TEXT

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <aside className="auth-brand">
        <div className="auth-brand-top">
          <Logo size={72} className="auth-logo" />
          <h1 className="auth-brand-title">{brand.name}</h1>
          <p className="auth-brand-tagline">{brand.tagline}</p>
        </div>

        <div className="auth-brand-body">
          <div className="auth-brand-subtitle">
            <h2>{brand.heading}</h2>
            <p>{brand.subheading}</p>
          </div>
          <ul className="auth-features">
            {features.map((text, i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <li key={text} className="auth-feature">
                  <span className="auth-feature-icon">
                    <Icon size={20} />
                  </span>
                  {text}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="auth-powered">
          <IntellivexMark size={34} />
          <div>
            <span>{brand.poweredBy}</span>
            <strong>{brand.company}</strong>
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-main-inner">
          <div className="auth-lang">
            <LanguageSelector
              languages={AUTH_TEXT.languages}
              value={lang}
              onChange={setLang}
              label={AUTH_TEXT.languageLabel}
            />
          </div>

          <div className="auth-card">
            <h2 className="auth-title">{title}</h2>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
