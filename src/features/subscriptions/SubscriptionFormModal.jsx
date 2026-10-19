import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { CURRENCIES } from '../../constants/currencies.js'
import { CYCLES, existingIdOf, validAmount } from './subscriptionUtils.js'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionFormModal.css'

const FIELD_OF = { displayName: 'name', amount: 'amount', currency: 'currency', cycle: 'cycle', startDate: 'startDate' }

function initial(subscription, currency) {
  if (subscription) return { name: subscription.displayName, amount: String(subscription.amount), currency: subscription.currency, cycle: subscription.cycle, startDate: '' }
  return { name: '', amount: '', currency: currency || CURRENCIES[0], cycle: 'MONTHLY', startDate: '' }
}

// Mounted only while open, so the fields always start fresh. `submit(body)` resolves { ok, error }.
function Form({ subscription, currency, submit, onClose, onViewExisting }) {
  const { t, dir, messageFor } = useSubscriptionText()
  const editing = Boolean(subscription)
  const [values, setValues] = useState(() => initial(subscription, currency))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [duplicateId, setDuplicateId] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (patch) => setValues((v) => ({ ...v, ...patch }))

  const validate = () => {
    const found = {}
    const name = values.name.trim()
    if (!name || name.length > 120) found.name = t.form.errors.name
    if (!validAmount(values.amount)) found.amount = t.form.errors.amount
    if (!editing) {
      if (!/^[A-Z]{3}$/.test(values.currency)) found.currency = t.form.errors.currency
      if (!values.startDate) found.startDate = t.form.errors.startDate
    }
    return found
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const found = validate()
    setErrors(found)
    setFormError('')
    setDuplicateId(null)
    if (Object.keys(found).length) return

    let body
    if (editing) {
      body = {}
      if (values.name.trim() !== subscription.displayName) body.displayName = values.name.trim()
      if (Number(values.amount) !== subscription.amount) body.amount = Number(values.amount)
      if (values.cycle !== subscription.cycle) body.cycle = values.cycle
      if (Object.keys(body).length === 0) {
        setFormError(t.form.errors.nothingChanged)
        return
      }
    } else {
      body = { displayName: values.name.trim(), amount: Number(values.amount), currency: values.currency, cycle: values.cycle, startDate: values.startDate }
    }

    setSaving(true)
    const result = await submit(body)
    setSaving(false)
    if (result.ok || result.skipped) return
    const existing = existingIdOf(result.error)
    if (existing) {
      setDuplicateId(existing)
      return
    }
    const fields = result.error?.response?.data?.fieldErrors
    if (result.error?.response?.status === 400 && Array.isArray(fields) && fields.length) {
      const mapped = {}
      fields.forEach((f) => {
        const key = FIELD_OF[f.field]
        if (key) mapped[key] = key === 'name' ? t.form.errors.nameUnusable : t.form.errors[key]
      })
      setErrors(mapped)
      setFormError(Object.keys(mapped).length ? t.form.errors.fields : messageFor(result.error))
      return
    }
    setFormError(messageFor(result.error))
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
  const aria = (id) => ({ id, 'aria-invalid': Boolean(errors[id.replace('subs-', '')]), 'aria-describedby': errors[id.replace('subs-', '')] ? `${id}-error` : undefined })

  return (
    <form className="subs-form" onSubmit={onSubmit} noValidate dir={dir}>
      {field('subs-name', t.form.name, <input {...aria('subs-name')} autoComplete="off" maxLength={120} placeholder={t.form.namePlaceholder} value={values.name} onChange={(e) => set({ name: e.target.value })} data-autofocus />, errors.name)}
      <div className="subs-form-pair">
        {field('subs-amount', t.form.amount, <input {...aria('subs-amount')} inputMode="decimal" autoComplete="off" placeholder="0.00" value={values.amount} onChange={(e) => set({ amount: e.target.value })} />, errors.amount)}
        {!editing &&
          field(
            'subs-currency',
            t.form.currency,
            <select {...aria('subs-currency')} value={values.currency} onChange={(e) => set({ currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>,
            errors.currency,
          )}
      </div>
      {field(
        'subs-cycle',
        t.form.cycle,
        <select {...aria('subs-cycle')} value={values.cycle} onChange={(e) => set({ cycle: e.target.value })}>
          {CYCLES.map((c) => (
            <option key={c} value={c}>
              {t.cycle[c]}
            </option>
          ))}
        </select>,
        errors.cycle,
      )}
      {!editing && field('subs-startDate', t.form.startDate, <input {...aria('subs-startDate')} type="date" value={values.startDate} onChange={(e) => set({ startDate: e.target.value })} />, errors.startDate)}

      {duplicateId && (
        <div className="auth-alert auth-alert-error" role="alert">
          {t.duplicate.message}{' '}
          <button type="button" className="link-btn" onClick={() => onViewExisting(duplicateId)}>
            {t.duplicate.view}
          </button>
        </div>
      )}
      {formError && (
        <div className="auth-alert auth-alert-error" role="alert">
          {formError}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
          {t.form.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {saving ? t.form.saving : t.form.save}
        </button>
      </div>
    </form>
  )
}

export default function SubscriptionFormModal({ open, subscription, currency, submit, onClose, onViewExisting }) {
  const { t } = useSubscriptionText()
  return (
    <Modal open={open} onClose={onClose} title={subscription ? t.editTitle : t.addTitle} closeLabel={t.actions.close}>
      {open && <Form subscription={subscription} currency={currency} submit={submit} onClose={onClose} onViewExisting={onViewExisting} />}
    </Modal>
  )
}
