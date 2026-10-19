import { useMemo, useState } from 'react'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { decimalsFor } from '../../constants/currencies.js'
import { allowedBudgetCategories } from '../budgets/budgetUtils.js'
import { monthLong } from './familyUtils.js'
import './FamilyBudgetModal.css'

const validLimit = (value, currency) => {
  const text = String(value ?? '').trim()
  const max = decimalsFor(currency)
  return /^\d+(\.\d+)?$/.test(text) && Number(text) > 0 && (text.split('.')[1] ?? '').length <= max
}

// Create (budget = null) or edit a family budget. Period, currency and zone come from the family and the chosen month.
function Form({ t, lang, dir, mode, utilization, month, family, categories, submit, onClose, messageFor }) {
  const editing = mode === 'edit'
  const currency = editing ? utilization.currency : family.currency
  const [total, setTotal] = useState(editing ? String(Number(utilization.totalLimit)) : '')
  const [limits, setLimits] = useState(() => (editing ? utilization.categories.map((c) => ({ category: c.category, amount: String(Number(c.limitAmount)) })) : [{ category: '', amount: '' }]))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const options = useMemo(() => allowedBudgetCategories(categories), [categories])
  const selected = new Set(limits.map((l) => l.category).filter(Boolean))
  const setLimit = (i, patch) => setLimits((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const decimals = decimalsFor(currency)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const found = {}
    if (!validLimit(total, currency)) found.total = t.budgetForm.errors.amount(decimals)
    const seen = new Set()
    limits.forEach((l, i) => {
      if (!l.category) found[`c${i}`] = t.budgetForm.errors.categoryRequired
      else if (seen.has(l.category)) found[`c${i}`] = t.budgetForm.errors.duplicate
      seen.add(l.category)
      if (!validLimit(l.amount, currency)) found[`a${i}`] = t.budgetForm.errors.amount(decimals)
    })
    if (!Object.keys(found).length && limits.reduce((s, l) => s + Number(l.amount), 0) > Number(total)) found.sum = t.budgetForm.errors.sum
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setSaving(true)
    const result = await submit({ totalLimit: total.trim(), categoryLimits: limits.map((l) => ({ category: l.category, limitAmount: l.amount.trim() })) })
    setSaving(false)
    if (!result.ok && !result.skipped) setFormError(messageFor(result.error, 'budget'))
  }

  return (
    <form className="fam-budget-form" onSubmit={onSubmit} noValidate dir={dir}>
      <p className="fam-invite-note">{t.budgetForm.period(monthLong(month, lang), currency)}</p>
      <div className="form-field">
        <label htmlFor="fb-total">{t.budgetForm.total}</label>
        <input id="fb-total" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} aria-invalid={Boolean(errors.total)} data-autofocus />
        {errors.total && <span className="auth-error">{errors.total}</span>}
      </div>
      {limits.map((l, i) => (
        <div key={i} className="fam-limit-row">
          <div className="form-field">
            <label htmlFor={`fb-cat-${i}`}>{t.budgetForm.category}</label>
            <select id={`fb-cat-${i}`} value={l.category} onChange={(e) => setLimit(i, { category: e.target.value })} aria-invalid={Boolean(errors[`c${i}`])}>
              <option value="">{t.budgetForm.select}</option>
              {options.map((c) => (
                <option key={c.code} value={c.code} disabled={selected.has(c.code) && c.code !== l.category}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors[`c${i}`] && <span className="auth-error">{errors[`c${i}`]}</span>}
          </div>
          <div className="form-field">
            <label htmlFor={`fb-amt-${i}`}>{t.budgetForm.limit}</label>
            <input id={`fb-amt-${i}`} inputMode="decimal" value={l.amount} onChange={(e) => setLimit(i, { amount: e.target.value })} aria-invalid={Boolean(errors[`a${i}`])} />
            {errors[`a${i}`] && <span className="auth-error">{errors[`a${i}`]}</span>}
          </div>
          <button type="button" className="icon-btn" aria-label={t.budgetForm.removeLimit} disabled={limits.length === 1 || saving} onClick={() => setLimits((cur) => cur.filter((_, idx) => idx !== i))}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-outline fam-add-limit" disabled={limits.length >= options.length || saving} onClick={() => setLimits((cur) => [...cur, { category: '', amount: '' }])}>
        <Plus size={15} aria-hidden="true" /> {t.budgetForm.addLimit}
      </button>
      {errors.sum && <span className="auth-error">{errors.sum}</span>}
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
          {saving ? t.budgetForm.saving : t.budgetForm.save}
        </button>
      </div>
    </form>
  )
}

export default function FamilyBudgetModal({ open, mode, ...rest }) {
  const { t } = rest
  return (
    <Modal open={open} onClose={rest.onClose} title={mode === 'edit' ? t.budgetForm.editTitle : t.budgetForm.createTitle} closeLabel={t.close} size="md">
      {open && <Form mode={mode} {...rest} />}
    </Modal>
  )
}
