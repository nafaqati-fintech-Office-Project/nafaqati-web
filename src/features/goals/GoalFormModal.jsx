import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { todayKey } from '../../utils/dateRange.js'
import { amountError, dateError, GOAL_CATEGORIES } from './goalUtils.js'
import './GoalFormModal.css'

function initialValues(goal) {
  return {
    name: goal?.name ?? '',
    description: goal?.description ?? '',
    category: goal?.category ?? 'travel',
    targetAmount: goal ? String(goal.targetAmount) : '',
    savedAmount: goal ? String(goal.savedAmount) : '0',
    targetDate: goal?.targetDate ?? '',
    // New goals save automatically by default: the proposal's "no manual data entry"
    autoSave: goal ? Boolean(goal.autoSave) : true,
    autoSaveKeyword: goal?.autoSaveKeyword ?? '',
  }
}

export default function GoalFormModal({ open, goal, t, currency, timeZone, onClose, onSubmit }) {
  const [values, setValues] = useState(() => initialValues(goal))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const editing = Boolean(goal)

  useEffect(() => {
    if (!open) return
    setValues(initialValues(goal))
    setErrors({})
    setSaving(false)
  }, [open, goal])

  if (!open) return null

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))
  const validate = () => {
    const next = {}
    if (!values.name.trim()) next.name = t.form.errors.name
    const targetError = amountError(values.targetAmount, currency, t.form.errors)
    if (targetError) next.targetAmount = targetError
    const targetDateError = dateError(values.targetDate, timeZone, t.form.errors)
    if (targetDateError) next.targetDate = targetDateError
    if (values.autoSave && !values.autoSaveKeyword.trim()) next.autoSaveKeyword = t.form.errors.keyword
    setErrors(next)
    return next
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const found = validate()
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description?.trim() ?? '',
        category: values.category,
        targetAmount: Number(values.targetAmount),
        currency,
        targetDate: values.targetDate || null,
        autoSave: values.autoSave,
        autoSaveKeyword: values.autoSaveKeyword.trim(),
      })
    } catch {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title={editing ? t.form.editTitle : t.form.createTitle}>
      <form className="goal-form" onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="goal-name">{t.form.name}</label>
          <input
            id="goal-name"
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            aria-invalid={Boolean(errors.name)}
            data-autofocus
          />
          {errors.name && <span className="auth-error">{errors.name}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="goal-category">{t.form.category}</label>
          <select id="goal-category" value={values.category} onChange={(e) => set({ category: e.target.value })}>
            {GOAL_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {t.form.categories[category.key]}
              </option>
            ))}
          </select>
        </div>
        <div className="goal-form-grid">
          <div className="form-field">
            <label htmlFor="goal-target">{t.form.targetAmount}</label>
            <input
              id="goal-target"
              inputMode="decimal"
              value={values.targetAmount}
              onChange={(e) => set({ targetAmount: e.target.value })}
              aria-invalid={Boolean(errors.targetAmount)}
            />
            {errors.targetAmount && <span className="auth-error">{errors.targetAmount}</span>}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="goal-target-date">
            {t.form.targetDate} <span>{t.form.optional}</span>
          </label>
          <input
            id="goal-target-date"
            type="date"
            min={todayKey(timeZone)}
            value={values.targetDate}
            onChange={(e) => set({ targetDate: e.target.value })}
            aria-invalid={Boolean(errors.targetDate)}
          />
          {errors.targetDate && <span className="auth-error">{errors.targetDate}</span>}
        </div>
        <fieldset className="goal-autosave">
          <label className="goal-autosave-toggle">
            <input type="checkbox" checked={values.autoSave} onChange={(e) => set({ autoSave: e.target.checked })} />
            <span>
              <strong>{t.form.autoSave.label}</strong>
              <small>{t.form.autoSave.help}</small>
            </span>
          </label>
          {values.autoSave && (
            <div className="form-field">
              <label htmlFor="goal-autosave-keyword">{t.form.autoSave.keyword}</label>
              <input
                id="goal-autosave-keyword"
                value={values.autoSaveKeyword}
                maxLength={60}
                placeholder={t.form.autoSave.keywordPlaceholder}
                onChange={(e) => set({ autoSaveKeyword: e.target.value })}
                aria-invalid={Boolean(errors.autoSaveKeyword)}
                aria-describedby="goal-autosave-help"
              />
              <small id="goal-autosave-help" className="goal-autosave-help">
                {t.form.autoSave.keywordHelp}
              </small>
              {errors.autoSaveKeyword && <span className="auth-error">{errors.autoSaveKeyword}</span>}
            </div>
          )}
        </fieldset>
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
    </Modal>
  )
}
