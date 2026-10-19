import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SyncBanner.css'

// The history of a new user loads on the first request. Until it is DONE the list is never presented as final.
export default function SyncBanner({ view, onRetry }) {
  const { t } = useSubscriptionText()
  if (view === 'done') return null
  const waiting = view === 'syncing'
  return (
    <div className={`subs-sync ${waiting ? 'is-syncing' : 'is-failed'}`} role={waiting ? 'status' : 'alert'}>
      {waiting ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
      <span>
        {waiting ? t.sync.syncing : view === 'timedOut' ? t.sync.timedOut : t.sync.failed}
        {waiting && <small>{t.sync.syncingHint}</small>}
      </span>
      {!waiting && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          {t.sync.retry}
        </button>
      )}
    </div>
  )
}
