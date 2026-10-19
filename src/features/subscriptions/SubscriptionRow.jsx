import { CircleAlert, TrendingUp } from 'lucide-react'
import MerchantAvatar from '../../components/ui/MerchantAvatar.jsx'
import { confidenceLevel, formatCalendarDate, formatMoney } from './subscriptionUtils.js'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionRow.css'

// One subscription. The whole row opens the details; Confirm / Dismiss (detected ones) sit beside it, never inside it.
export default function SubscriptionRow({ subscription: s, onOpen, onConfirm, onDismiss, busy = false }) {
  const { t, lang } = useSubscriptionText()
  const review = s.status === 'DETECTED'
  const cancelled = s.status === 'ENDED' || s.status === 'DISMISSED'

  return (
    <li className={`subs-row ${cancelled ? 'is-cancelled' : ''} ${review ? 'is-review' : ''}`}>
      <button type="button" className="subs-row-main" onClick={() => onOpen(s)} aria-label={`${t.actions.view}: ${s.displayName}`}>
        <MerchantAvatar name={s.displayName} size={44} />
        <span className="subs-row-text">
          <strong>{s.displayName}</strong>
          <span className="subs-row-sub">
            {t.cycle[s.cycle]}
            {review && <span className={`subs-confidence is-${confidenceLevel(s.confidence)}`}>{t.confidence[confidenceLevel(s.confidence)]}</span>}
            {s.status === 'CONFIRMED' && s.overdue && (
              <span className="subs-tag is-warn">
                <CircleAlert size={12} aria-hidden="true" /> {t.overdue}
              </span>
            )}
            {s.previousAmount != null && s.status !== 'DISMISSED' && (
              <span className="subs-tag is-info" title={t.priceUp(formatMoney(s.previousAmount, s.currency), formatMoney(s.amount, s.currency))}>
                <TrendingUp size={12} aria-hidden="true" /> {t.priceUp(formatMoney(s.previousAmount, s.currency), formatMoney(s.amount, s.currency))}
              </span>
            )}
          </span>
        </span>
        <span className="subs-row-amount">
          <strong>{formatMoney(s.amount, s.currency)}</strong>
          <small>
            {cancelled ? (
              <span className="subs-tag is-muted">{s.status === 'ENDED' ? t.ended : t.dismissed}</span>
            ) : review ? (
              t.chargesSeen(s.occurrenceCount)
            ) : (
              t.next(formatCalendarDate(s.nextExpectedDate, lang))
            )}
          </small>
        </span>
      </button>
      {review && (
        <span className="subs-row-actions">
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(s)} disabled={busy}>
            {t.actions.confirm}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => onDismiss(s)} disabled={busy}>
            {t.actions.dismiss}
          </button>
        </span>
      )}
    </li>
  )
}
