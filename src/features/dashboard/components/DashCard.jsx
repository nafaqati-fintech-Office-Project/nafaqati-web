import { CircleAlert, Inbox } from 'lucide-react'
import { APP_TEXT } from '../../../constants/appText.js'

export function Sk({ w = '100%', h = 14, r = 8, className = '' }) {
  return <span className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
}

// Shared card shell: header, per-card skeleton, inline error with Retry, and empty state.
// `state` is { loading, error, retry } straight from useDashboardData.
export default function DashCard({ title, action, state, skeleton, empty, className = '', children }) {
  const { loading, error, retry } = state
  let body = children
  if (loading) body = <div className="dc-skeleton">{skeleton}</div>
  else if (error) {
    body = (
      <div className="dc-state" role="alert">
        <CircleAlert size={22} aria-hidden="true" />
        <p>{APP_TEXT.common.loadError}</p>
        <button type="button" className="dc-retry" onClick={retry}>
          {APP_TEXT.common.retry}
        </button>
      </div>
    )
  } else if (empty) {
    body = (
      <div className="dc-state">
        <Inbox size={26} aria-hidden="true" />
        <strong>{empty.title}</strong>
        <p>{empty.body}</p>
        {empty.cta && (
          <button type="button" className="btn btn-primary dc-cta" onClick={empty.cta.onClick}>
            {empty.cta.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <section className={`dc ${className}`} aria-busy={loading} aria-label={title}>
      {title && (
        <header className="dc-head">
          <h2>{title}</h2>
          {!loading && !error && action}
        </header>
      )}
      {body}
    </section>
  )
}
