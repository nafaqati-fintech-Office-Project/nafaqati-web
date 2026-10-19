import { formatDate } from '../../utils/format.js'
import { memberTag, money } from './familyUtils.js'
import './SharedTransactionsPanel.css'

// "Shared Transactions" replaces the design's "Upcoming Payments" (the family backend has no bills): the transactions members
// explicitly shared with this family, newest first. The sharer can unshare their own.
export default function SharedTransactionsPanel({ t, resource, myUserId, byCode, busy, onShare, onUnshare, onMore }) {
  const page = resource.data
  const items = page?.content ?? []

  return (
    <section className="family-panel" aria-label={t.sharedPanel.title}>
      <div className="panel-head">
        <h2>{t.sharedPanel.title}</h2>
        <button type="button" className="text-btn" onClick={onShare}>
          {t.sharedPanel.share}
        </button>
      </div>
      {resource.loading ? (
        <div className="upcoming-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="sk fam-shared-sk" />
          ))}
        </div>
      ) : resource.error ? (
        <div className="dc-state" role="alert">
          <p>{t.errors.generic}</p>
          <button type="button" className="dc-retry" onClick={resource.retry}>
            {t.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <>
          <p className="fam-empty">{t.sharedPanel.empty}</p>
          <p className="fam-note">{t.sharedPanel.emptyHint}</p>
        </>
      ) : (
        <>
          <ul className="upcoming-list">
            {items.map((tx) => (
              <li key={tx.id} className="upcoming-row">
                <div>
                  <strong>{tx.merchant || byCode[tx.categoryCode]?.name || tx.categoryCode}</strong>
                  <span>
                    {formatDate(tx.transactionDate)} · {byCode[tx.categoryCode]?.name ?? tx.categoryCode} · {t.sharedPanel.by(tx.sharedBy === myUserId ? t.you : memberTag(tx.sharedBy))}
                  </span>
                </div>
                <b>{money(tx.amount, tx.currency)}</b>
                {tx.sharedBy === myUserId && (
                  <button type="button" className="text-btn fam-unshare" disabled={busy} onClick={() => onUnshare(tx)}>
                    {t.sharedPanel.unshare}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {page.page + 1 < page.totalPages && (
            <button type="button" className="text-btn fam-more" onClick={onMore}>
              {t.sharedPanel.more}
            </button>
          )}
        </>
      )}
    </section>
  )
}
