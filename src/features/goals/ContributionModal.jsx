import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { todayKey } from '../../utils/dateRange.js'
import { amountError } from './goalUtils.js'
import './ContributionModal.css'

const makeRequestId = () => globalThis.crypto?.randomUUID?.() ?? `contrib-${Date.now()}`

export default function ContributionModal({ goal, t, currency, timeZone, onClose, onSubmit }) {
  const [values, setValues] = useState({ amount: '', date: todayKey(timeZone), note: '', requestId: makeRequestId() })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const open = Boolean(goal)

  useEffect(() => {
    if (!open) return
    setValues({ amount: '', date: todayKey(timeZone), note: '', requestId: makeRequestId() })
    setErrors({})
    setSaving(false)
  }, [open, timeZone])

  if (!open) return null

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))
  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    const amountMessage = amountError(values.amount, currency, t.form.errors)
    if (amountMessage) next.amount = amountMessage
    if (!values.date) next.date = t.contribution.date
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      const requestId = values.requestId ?? makeRequestId()
      setValues((current) => ({ ...current, requestId }))
      await onSubmit({ amount: Number(values.amount), date: values.date, note: values.note.trim(), requestId })
    } catch {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title={`${t.contribution.title}: ${goal.name}`}>
      <form className="contribution-form" onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="contribution-amount">{t.contribution.amount}</label>
          <input
            id="contribution-amount"
            inputMode="decimal"
            value={values.amount}
            onChange={(e) => set({ amount: e.target.value })}
            aria-invalid={Boolean(errors.amount)}
            data-autofocus
          />
          {errors.amount && <span className="auth-error">{errors.amount}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="contribution-date">{t.contribution.date}</label>
          <input id="contribution-date" type="date" max={todayKey(timeZone)} value={values.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="contribution-note">{t.contribution.note}</label>
          <input id="contribution-note" value={values.note} onChange={(e) => set({ note: e.target.value })} placeholder={t.contribution.notePlaceholder} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            {t.contribution.cancel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
            {saving ? t.contribution.saving : t.contribution.save}
          </button>
        </div>
      </form>
    </Modal>
  )
}
