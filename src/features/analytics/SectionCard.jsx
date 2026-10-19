import { CircleAlert, Inbox } from 'lucide-react'
import { getErrorInfo } from '../../lib/errors.js'
import { useAnalyticsText } from './useAnalyticsText.js'
import './SectionCard.css'

export const Sk = ({ w = '100%', h = 14, r = 8 }) => (
  <span className="an-sk" style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
)

// Card shell used by every Analytics section: title, skeleton while loading, error with the real reason and Retry,
// and an empty state. `state` is { loading, error, retry } straight from useAsync. `empty` is { title, body } or null.
export default function SectionCard({ title, subtitle, action, state, skeleton, empty, className = '', children }) {
  const { t } = useAnalyticsText()
  const { loading, error, retry } = state
  let body = children
  if (loading) body = <div className="an-skeleton">{skeleton}</div>
  else if (error) {
    body = (
      <div className="an-state" role="alert">
        <CircleAlert size={22} aria-hidden="true" />
        <p>{t.error}</p>
        <p className="an-state-detail">{getErrorInfo(error, 'reports').message}</p>
        <button type="button" className="an-retry" onClick={retry}>
          {t.retry}
        </button>
      </div>
    )
  } else if (empty) {
    body = (
      <div className="an-state">
        <Inbox size={26} aria-hidden="true" />
        <strong>{empty.title}</strong>
        <p>{empty.body}</p>
      </div>
    )
  }

  return (
    <section className={`an-card ${className}`} aria-busy={loading} aria-label={title}>
      {title && (
        <header className="an-card-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {!loading && !error && action}
        </header>
      )}
      {body}
    </section>
  )
}
