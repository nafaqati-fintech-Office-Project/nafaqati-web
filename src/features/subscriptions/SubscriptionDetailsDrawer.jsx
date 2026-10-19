import { CircleAlert, Pencil, Trash2 } from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'
import MerchantAvatar from '../../components/ui/MerchantAvatar.jsx'
import { confidenceLevel, formatCalendarDate, formatMoney } from './subscriptionUtils.js'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionDetailsDrawer.css'

// Details and the actions that are allowed for the status (the API refuses the others with 409)
export default function SubscriptionDetailsDrawer({ subscription: s, notFound, busy, error, onClose, onConfirm, onDismiss, onEdit, onEnd }) {
  const { t, lang, dir } = useSubscriptionText()
  const date = (ymd) => formatCalendarDate(ymd, lang)

  const footer = s && (
    <>
      {s.status === 'DETECTED' && (
        <button type="button" className="btn btn-primary" onClick={() => onConfirm(s)} disabled={busy}>
          {t.actions.confirm}
        </button>
      )}
      {(s.status === 'DETECTED' || s.status === 'CONFIRMED') && (
        <button type="button" className="btn btn-outline" onClick={() => onEdit(s)} disabled={busy}>
          <Pencil size={16} aria-hidden="true" /> {t.actions.edit}
        </button>
      )}
      {s.status === 'CONFIRMED' && (
        <button type="button" className="btn btn-danger-outline" onClick={() => onEnd(s)} disabled={busy}>
          {t.actions.end}
        </button>
      )}
      {(s.status === 'DETECTED' || s.status === 'CONFIRMED') && (
        <button type="button" className="btn btn-danger-outline" onClick={() => onDismiss(s)} disabled={busy}>
          <Trash2 size={16} aria-hidden="true" /> {t.actions.dismiss}
        </button>
      )}
    </>
  )

  return (
    <Drawer open={Boolean(s) || notFound} onClose={onClose} title={t.details.title} closeLabel={t.actions.close} footer={footer}>
      <div dir={dir}>
        {notFound && (
          <div className="dc-state">
            <CircleAlert size={30} aria-hidden="true" />
            <strong>{t.notFoundPage.title}</strong>
            <p>{t.notFoundPage.body}</p>
          </div>
        )}
        {s && (
          <>
            <div className="subs-detail-hero">
              <MerchantAvatar name={s.displayName} size={56} />
              <h3>{s.displayName}</h3>
              <strong className="subs-detail-amount">{formatMoney(s.amount, s.currency)}</strong>
              <span className={`subs-status is-${s.status.toLowerCase()}`}>{t.status[s.status]}</span>
            </div>
            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                {error}
              </div>
            )}
            <dl className="subs-detail-list">
              <div><dt>{t.details.cycle}</dt><dd>{t.cycle[s.cycle]}</dd></div>
              <div><dt>{t.details.monthly}</dt><dd>{formatMoney(s.monthlyCost, s.currency)}</dd></div>
              <div><dt>{t.details.yearly}</dt><dd>{formatMoney(s.yearlyCost, s.currency)}</dd></div>
              {s.status === 'CONFIRMED' && <div><dt>{t.details.next}</dt><dd>{date(s.nextExpectedDate)}</dd></div>}
              <div><dt>{t.details.firstCharge}</dt><dd>{date(s.firstChargeDate)}</dd></div>
              <div><dt>{t.details.lastCharge}</dt><dd>{date(s.lastChargeDate)}</dd></div>
              <div><dt>{t.details.source}</dt><dd>{t.source[s.source]}</dd></div>
              {s.source === 'DETECTED' && <div><dt>{t.details.confidence}</dt><dd>{t.confidence[confidenceLevel(s.confidence)]}</dd></div>}
              {s.previousAmount != null && <div><dt>{t.details.previous}</dt><dd>{formatMoney(s.previousAmount, s.currency)}</dd></div>}
              <div><dt>{t.chargesSeen(s.occurrenceCount)}</dt><dd /></div>
            </dl>
            {s.status === 'CONFIRMED' && s.overdue && (
              <p className="subs-detail-warn">
                <CircleAlert size={16} aria-hidden="true" /> {t.overdue}
              </p>
            )}
          </>
        )}
      </div>
    </Drawer>
  )
}
