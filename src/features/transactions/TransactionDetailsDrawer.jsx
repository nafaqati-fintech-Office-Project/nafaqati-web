import { Pencil, Trash2 } from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'
import MerchantAvatar from '../../components/ui/MerchantAvatar.jsx'
import CategoryBadge from '../../components/ui/CategoryBadge.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import AmountText from '../../components/ui/AmountText.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { useFormat } from '../../hooks/useFormat.js'

const t = APP_TEXT.transactions.details

export default function TransactionDetailsDrawer({ txn, onClose, onEdit, onDelete }) {
  const { dateTime } = useFormat()
  return (
    <Drawer
      open={Boolean(txn)}
      onClose={onClose}
      title={APP_TEXT.transactions.details.title}
      closeLabel={t.close}
      footer={
        txn && (
          <>
            <button type="button" className="btn btn-outline" onClick={() => onEdit(txn)}>
              <Pencil size={16} aria-hidden="true" /> {t.edit}
            </button>
            {txn.source === 'MANUAL' && (
              <button type="button" className="btn btn-danger-outline" onClick={() => onDelete(txn)}>
                <Trash2 size={16} aria-hidden="true" /> {t.delete}
              </button>
            )}
          </>
        )
      }
    >
      {txn && (
        <>
          <div className="detail-hero">
            <MerchantAvatar name={txn.merchant.name} size={56} />
            <h3>{txn.merchant.name}</h3>
            <AmountText className="detail-amount" type={txn.type} amount={txn.amount} currency={txn.currency} />
            <span className={`type-badge type-${txn.type.toLowerCase()}`}>{APP_TEXT.transactions.typeLabel[txn.type]}</span>
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t.date}</dt>
              <dd>{dateTime(txn.occurredAt)}</dd>
            </div>
            <div>
              <dt>{t.status}</dt>
              <dd>
                <StatusBadge status={txn.status} />
              </dd>
            </div>
            <div>
              <dt>{t.category}</dt>
              <dd>
                <CategoryBadge code={txn.categoryId} />
              </dd>
            </div>
            {txn.cardLast4 && (
              <div>
                <dt>{t.card}</dt>
                <dd className="num">•••• {txn.cardLast4}</dd>
              </div>
            )}
            <div>
              <dt>{t.reference}</dt>
              <dd className="num">{txn.reference}</dd>
            </div>
            <div>
              <dt>{t.description}</dt>
              <dd>{txn.description || t.noNote}</dd>
            </div>
            <div>
              <dt>{t.source}</dt>
              <dd>{t.sources[txn.source] ?? txn.source}</dd>
            </div>
          </dl>
          <p className="form-note">{t.reportsNote}</p>
        </>
      )}
    </Drawer>
  )
}
