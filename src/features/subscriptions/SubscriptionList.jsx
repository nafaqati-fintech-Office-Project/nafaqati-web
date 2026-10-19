import { Inbox, Plus, Repeat } from 'lucide-react'
import SubscriptionRow from './SubscriptionRow.jsx'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionList.css'

// Active tab: the detected ones waiting for a decision on top, then the confirmed ones. Cancelled tab: ended + dismissed.
export default function SubscriptionList({ tab, groups, busy, onOpen, onConfirm, onDismiss, onAdd, reviewRef }) {
  const { t } = useSubscriptionText()
  const rows = (items) =>
    items.map((s) => <SubscriptionRow key={s.id} subscription={s} busy={busy.has(s.id)} onOpen={onOpen} onConfirm={onConfirm} onDismiss={onDismiss} />)

  if (tab === 'cancelled') {
    return (
      <div className="subs-list" id="subs-panel" role="tabpanel" aria-labelledby="subs-tab-cancelled">
        {groups.cancelled.length === 0 ? (
          <div className="dc-state">
            <Inbox size={30} aria-hidden="true" />
            <strong>{t.empty.cancelled}</strong>
            <p>{t.empty.cancelledBody}</p>
          </div>
        ) : (
          <ul>{rows(groups.cancelled)}</ul>
        )}
      </div>
    )
  }

  const nothing = groups.review.length === 0 && groups.active.length === 0
  return (
    <div className="subs-list" id="subs-panel" role="tabpanel" aria-labelledby="subs-tab-active">
      {nothing ? (
        <div className="dc-state">
          <Repeat size={30} aria-hidden="true" />
          <strong>{t.empty.title}</strong>
          <p>{t.empty.body}</p>
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} aria-hidden="true" />
            {t.add}
          </button>
        </div>
      ) : (
        <>
          {groups.review.length > 0 && (
            <section ref={reviewRef} tabIndex={-1} aria-label={t.review.section} className="subs-review-section">
              <h2>{t.review.section}</h2>
              <p>{t.review.body}</p>
              <ul>{rows(groups.review)}</ul>
            </section>
          )}
          {groups.active.length > 0 && <ul>{rows(groups.active)}</ul>}
        </>
      )}
    </div>
  )
}
