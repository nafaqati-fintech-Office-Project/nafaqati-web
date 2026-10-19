import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { CURRENCIES } from '../../constants/currencies.js'
import { TIMEZONES } from '../settings/preferenceOptions.js'
import { browserTimeZone } from '../../utils/format.js'
import './FamilyFormModal.css'

// Create (family = null) or edit a family. submit(body) resolves { ok, error, skipped }.
function Form({ t, dir, family, defaults, submit, onClose, messageFor }) {
  const editing = Boolean(family)
  const [values, setValues] = useState(() =>
    editing
      ? { name: family.name, description: family.description ?? '', currency: family.currency, timeZone: family.timeZone }
      : { name: '', description: '', currency: defaults.currency || CURRENCIES[0], timeZone: defaults.timeZone || browserTimeZone() },
  )
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (patch) => setValues((v) => ({ ...v, ...patch }))
  const zones = [...new Set([values.timeZone, ...TIMEZONES, 'UTC'])]

  const onSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const found = {}
    const name = values.name.trim()
    if (!name || name.length > 100) found.name = t.familyForm.errors.name
    if (!CURRENCIES.includes(values.currency)) found.currency = t.familyForm.errors.currency
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    let body
    if (editing) {
      body = { version: family.version }
      if (name !== family.name) body.name = name
      if (values.description.trim() !== (family.description ?? '')) body.description = values.description.trim()
      if (values.currency !== family.currency) body.currency = values.currency
      if (values.timeZone !== family.timeZone) body.timeZone = values.timeZone
      if (Object.keys(body).length === 1) {
        setFormError(t.familyForm.errors.nothing)
        return
      }
    } else {
      body = { name, currency: values.currency, timeZone: values.timeZone }
      if (values.description.trim()) body.description = values.description.trim()
    }
    setSaving(true)
    const result = await submit(body)
    setSaving(false)
    if (!result.ok && !result.skipped) setFormError(messageFor(result.error, 'family'))
  }

  return (
    <form className="fam-form" onSubmit={onSubmit} noValidate dir={dir}>
      <div className="form-field">
        <label htmlFor="fam-name">{t.familyForm.name}</label>
        <input id="fam-name" value={values.name} maxLength={100} autoComplete="off" onChange={(e) => set({ name: e.target.value })} aria-invalid={Boolean(errors.name)} data-autofocus />
        {errors.name && <span className="auth-error">{errors.name}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="fam-desc">{t.familyForm.description}</label>
        <input id="fam-desc" value={values.description} maxLength={500} autoComplete="off" onChange={(e) => set({ description: e.target.value })} />
      </div>
      <div className="fam-form-pair">
        <div className="form-field">
          <label htmlFor="fam-currency">{t.familyForm.currency}</label>
          <select id="fam-currency" value={values.currency} onChange={(e) => set({ currency: e.target.value })}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.currency && <span className="auth-error">{errors.currency}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="fam-tz">{t.familyForm.timeZone}</label>
          <select id="fam-tz" value={values.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>
      {formError && (
        <div className="auth-alert auth-alert-error" role="alert">
          {formError}
        </div>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
          {t.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {saving ? t.familyForm.saving : t.familyForm.save}
        </button>
      </div>
    </form>
  )
}

export default function FamilyFormModal({ open, t, dir, family, defaults, submit, onClose, messageFor }) {
  return (
    <Modal open={open} onClose={onClose} title={family ? t.familyForm.editTitle : t.familyForm.createTitle} closeLabel={t.close}>
      {open && <Form t={t} dir={dir} family={family} defaults={defaults} submit={submit} onClose={onClose} messageFor={messageFor} />}
    </Modal>
  )
}
