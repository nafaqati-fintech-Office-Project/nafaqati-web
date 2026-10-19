import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { useFormat } from '../../hooks/useFormat.js'
import { getErrorInfo } from '../../lib/errors.js'
import { decimalsFor } from '../../constants/currencies.js'
import { todayKey } from '../../utils/dateRange.js'
import { noonInstantIso } from '../../utils/timeZone.js'

const t = APP_TEXT.transactions
const f = t.form
const TYPES = ['EXPENSE', 'INCOME']

// Expense categories for an expense, income categories for an income; UNCATEGORIZED is the empty choice
const categoriesFor = (type, categories) =>
  categories.filter((c) => c.kind === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'))

function initialState({ txn, type, today }) {
  if (txn) {
    return { type: txn.type, amount: String(txn.amount), merchant: txn.merchant.name, description: txn.description, categoryId: txn.categoryId === 'UNCATEGORIZED' ? '' : txn.categoryId, date: '' }
  }
  return { type: type ?? 'EXPENSE', amount: '', merchant: '', description: '', categoryId: '', date: today }
}

// Mirrors the server rules (CreateTransactionRequest)
// Amount: positive, at most 2 decimals (3 for KWD / BHD / OMR)
function amountError(value, currency) {
  const amount = value.trim()
  if (!amount) return f.errors.amountRequired
  const max = decimalsFor(currency)
  if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) return f.errors.amountInvalid
  if ((amount.split('.')[1] ?? '').length > max) return f.errors.amountDecimals(currency, max)
  return ''
}

function validate(values, currency) {
  const errors = {}
  const amountMessage = amountError(values.amount, currency)
  if (amountMessage) errors.amount = amountMessage
  if (values.merchant.trim().length > 255) errors.merchant = f.errors.merchantLong
  const description = values.description.trim()
  if (!description) errors.description = f.errors.descriptionRequired
  else if (description.length > 1000) errors.description = f.errors.descriptionLong
  if (!values.date) errors.date = f.errors.dateRequired
  return errors
}

// Server field names -> form field ids
const SERVER_FIELD = { transactionDate: 'date', category: 'categoryId' }

// Mounted only while open, so the form state always starts fresh from `txn` / `type`.
function TransactionForm({ txn, type, categories, onSubmit, onClose }) {
  const editing = Boolean(txn)
  const { currency, timeZone } = useFormat()
  const [today] = useState(() => todayKey(timeZone))
  const [values, setValues] = useState(() => initialState({ txn, type, today }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const options = categoriesFor(values.type, categories)
  const set = (patch) => setValues((v) => ({ ...v, ...patch }))

  // The currency can change while the form is open (Settings in another tab): revalidate a typed amount
  const [checkedCurrency, setCheckedCurrency] = useState(currency)
  if (checkedCurrency !== currency) {
    setCheckedCurrency(currency)
    if (errors.amount || values.amount) setErrors((e) => ({ ...e, amount: amountError(values.amount, currency) || undefined }))
  }

  const changeType = (next) => {
    const valid = categoriesFor(next, categories).some((c) => c.id === values.categoryId)
    set({ type: next, categoryId: valid ? values.categoryId : '' })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!editing) {
      const found = validate(values, currency)
      setErrors(found)
      if (Object.keys(found).length) return
    }
    setSaving(true)
    setFormError('')
    try {
      await onSubmit(
        editing
          ? { categoryId: values.categoryId || 'UNCATEGORIZED', merchant: values.merchant.trim() }
          : {
              type: values.type,
              currency,
              amount: Number(values.amount),
              merchant: values.merchant.trim(),
              description: values.description.trim(),
              categoryId: values.categoryId || undefined,
              occurredAt: noonInstantIso(values.date, timeZone),
            },
      )
    } catch (err) {
      const info = getErrorInfo(err, 'transactions')
      const mapped = Object.fromEntries(Object.entries(info.fieldErrors).map(([k, v]) => [SERVER_FIELD[k] ?? k, v]))
      setErrors(mapped)
      setFormError(Object.keys(mapped).length ? '' : info.message || f.saveFailed)
      setSaving(false)
    }
  }

  const field = (id, label, control, error) => (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {control}
      {error && (
        <span id={`${id}-error`} className="auth-error">
          {error}
        </span>
      )}
    </div>
  )

  const aria = (id) => ({ id, 'aria-invalid': Boolean(errors[id]), 'aria-describedby': errors[id] ? `${id}-error` : undefined })

  return (
    <form className="tx-form" onSubmit={submit} noValidate>
      {editing ? (
        <p className="form-note">{f.editNote}</p>
      ) : (
        <div className="form-field">
          <span className="form-label" id="tx-type-label">
            {f.type}
          </span>
          <div className="segmented segmented-2" role="radiogroup" aria-labelledby="tx-type-label">
            {TYPES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={values.type === value}
                className={values.type === value ? 'is-active' : ''}
                onClick={() => changeType(value)}
              >
                {t.typeLabel[value]}
              </button>
            ))}
          </div>
        </div>
      )}

      {!editing &&
        field(
          'amount',
          f.amount(currency),
          <input {...aria('amount')} inputMode="decimal" autoComplete="off" placeholder={f.amountPlaceholder} value={values.amount} onChange={(e) => {
            set({ amount: e.target.value })
            if (errors.amount) setErrors((prev) => ({ ...prev, amount: amountError(e.target.value, currency) || undefined }))
          }} data-autofocus />,
          errors.amount,
        )}
      {field(
        'merchant',
        f.merchantOptional,
        <input {...aria('merchant')} autoComplete="off" placeholder={f.merchantPlaceholder} value={values.merchant} onChange={(e) => set({ merchant: e.target.value })} data-autofocus={editing ? true : undefined} />,
        errors.merchant,
      )}
      {!editing &&
        field(
          'description',
          f.description,
          <input {...aria('description')} autoComplete="off" placeholder={f.descriptionPlaceholder} value={values.description} onChange={(e) => set({ description: e.target.value })} />,
          errors.description,
        )}
      {field(
        'categoryId',
        f.categoryOptional,
        <select {...aria('categoryId')} value={values.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
          <option value="">{f.categoryPlaceholder}</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>,
        errors.categoryId,
      )}
      {!editing &&
        field('date', f.date, <input {...aria('date')} type="date" max={today} value={values.date} onChange={(e) => set({ date: e.target.value })} />, errors.date)}
      {!editing && <p className="form-note">{f.currencyNote(currency)}</p>}

      {formError && (
        <div className="auth-alert auth-alert-error" role="alert">
          {formError}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
          {f.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {saving ? f.saving : f.save}
        </button>
      </div>
    </form>
  )
}

export default function TransactionFormModal({ form, categories, onSubmit, onClose }) {
  return (
    <Modal open={Boolean(form)} onClose={onClose} title={form?.mode === 'edit' ? f.editTitle : f.addTitle} closeLabel={t.details.close}>
      {form && <TransactionForm txn={form.txn} type={form.type} categories={categories} onSubmit={onSubmit} onClose={onClose} />}
    </Modal>
  )
}
