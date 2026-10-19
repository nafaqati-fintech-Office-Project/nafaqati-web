import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { getErrorInfo } from '../../lib/errors.js'
import {
  allowedBudgetCategories,
  amountError,
  formatBudgetMoney,
  monthLabel,
  monthPeriod,
  normalizeMoney,
} from './budgetUtils.js'
import './BudgetFormModal.css'

const serverField = (field) => {
  if (field === 'totalLimit') return 'totalLimit'
  const match = field.match(/^categoryLimits\[(\d+)]\.(category|limitAmount)$/)
  if (!match) return field
  return `limits.${match[1]}.${match[2] === 'category' ? 'category' : 'amount'}`
}

function initialValues(budget, month, currency) {
  if (budget) {
    return {
      totalLimit: String(normalizeMoney(budget.totalLimit)),
      limits: (budget.categoryLimits ?? []).map((limit) => ({
        category: limit.category,
        amount: String(normalizeMoney(limit.limitAmount)),
      })),
    }
  }
  return { totalLimit: '', limits: [{ category: '', amount: '' }], month, currency }
}

export default function BudgetFormModal({
  open,
  mode,
  budget,
  month,
  currency,
  categories,
  userId,
  timeZone,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(() => initialValues(budget, month, currency))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const categoryOptions = useMemo(() => allowedBudgetCategories(categories), [categories])
  const selected = new Set(values.limits.map((limit) => limit.category).filter(Boolean))
  const sum = values.limits.reduce((total, limit) => total + (amountError(limit.amount, currency) ? 0 : normalizeMoney(limit.amount)), 0)
  const editing = mode === 'edit'

  useEffect(() => {
    if (!open) return
    setValues(initialValues(budget, month, currency))
    setErrors({})
    setFormError('')
    setSaving(false)
  }, [open, budget, month, currency])

  if (!open) return null

  const setLimit = (index, patch) => {
    setValues((current) => ({
      ...current,
      limits: current.limits.map((limit, i) => (i === index ? { ...limit, ...patch } : limit)),
    }))
  }
  const addLimit = () => setValues((current) => ({ ...current, limits: [...current.limits, { category: '', amount: '' }] }))
  const removeLimit = (index) => setValues((current) => ({ ...current, limits: current.limits.filter((_, i) => i !== index) }))

  const validate = () => {
    const next = {}
    const totalMessage = amountError(values.totalLimit, currency)
    if (totalMessage) next.totalLimit = totalMessage
    const total = normalizeMoney(values.totalLimit)
    const seen = new Set()
    values.limits.forEach((limit, index) => {
      if (!limit.category) next[`limits.${index}.category`] = 'Select a category'
      if (limit.category && seen.has(limit.category)) next[`limits.${index}.category`] = 'Category already added'
      seen.add(limit.category)
      const limitMessage = amountError(limit.amount, currency)
      if (limitMessage) next[`limits.${index}.amount`] = limitMessage
    })
    if (!Object.keys(next).length && sum > total) next.sum = 'Category limits cannot exceed the total limit'
    setErrors(next)
    return next
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const found = validate()
    if (Object.keys(found).length) return
    setSaving(true)
    setFormError('')
    try {
      const body = {
        totalLimit: values.totalLimit,
        categoryLimits: values.limits.map((limit) => ({ category: limit.category, limitAmount: limit.amount })),
      }
      if (!editing) {
        Object.assign(body, {
          userId,
          ...monthPeriod(month),
          currency,
          timeZone,
        })
      }
      await onSubmit(body)
    } catch (err) {
      const info = getErrorInfo(err, 'budgets')
      const mapped = Object.fromEntries(Object.entries(info.fieldErrors).map(([field, message]) => [serverField(field), message]))
      setErrors(mapped)
      setFormError(Object.keys(mapped).length ? '' : info.message)
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title={editing ? 'Edit budget' : 'Create budget'} size="md">
      <form className="budget-form" onSubmit={submit} noValidate>
        <div className="budget-form-note">
          <strong>{monthLabel(month)}</strong>
          <span>{currency} is set from your preferences.</span>
        </div>

        <div className="form-field">
          <label htmlFor="budget-total">Total limit</label>
          <input
            id="budget-total"
            inputMode="decimal"
            value={values.totalLimit}
            onChange={(e) => setValues((current) => ({ ...current, totalLimit: e.target.value }))}
            aria-invalid={Boolean(errors.totalLimit)}
            aria-describedby={errors.totalLimit ? 'budget-total-error' : undefined}
            data-autofocus
          />
          {errors.totalLimit && <span id="budget-total-error" className="auth-error">{errors.totalLimit}</span>}
        </div>

        <div className="budget-form-limits">
          <div className="budget-form-limits-head">
            <strong>Category limits</strong>
            <button type="button" className="btn btn-outline" onClick={addLimit} disabled={values.limits.length >= categoryOptions.length || saving}>
              <Plus size={16} aria-hidden="true" />
              Add
            </button>
          </div>
          {values.limits.map((limit, index) => {
            const categoryError = errors[`limits.${index}.category`]
            const amountFieldError = errors[`limits.${index}.amount`]
            return (
              <div className="budget-limit-edit" key={`${index}-${limit.category || 'new'}`}>
                <div className="form-field">
                  <label htmlFor={`budget-limit-category-${index}`}>Category</label>
                  <select
                    id={`budget-limit-category-${index}`}
                    value={limit.category}
                    onChange={(e) => setLimit(index, { category: e.target.value })}
                    aria-invalid={Boolean(categoryError)}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option
                        key={category.code}
                        value={category.code}
                        disabled={selected.has(category.code) && category.code !== limit.category}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoryError && <span className="auth-error">{categoryError}</span>}
                </div>
                <div className="form-field">
                  <label htmlFor={`budget-limit-amount-${index}`}>Limit</label>
                  <input
                    id={`budget-limit-amount-${index}`}
                    inputMode="decimal"
                    value={limit.amount}
                    onChange={(e) => setLimit(index, { amount: e.target.value })}
                    aria-invalid={Boolean(amountFieldError)}
                  />
                  {amountFieldError && <span className="auth-error">{amountFieldError}</span>}
                </div>
                <button
                  type="button"
                  className="icon-btn budget-remove-limit"
                  onClick={() => removeLimit(index)}
                  disabled={values.limits.length === 1 || saving}
                  aria-label="Remove category limit"
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>

        <div className={`budget-live-sum ${errors.sum ? 'is-error' : ''}`}>
          <span>Allocated</span>
          <strong>{formatBudgetMoney(sum, currency)}</strong>
        </div>
        {errors.sum && <span className="auth-error">{errors.sum}</span>}
        {formError && <div className="auth-alert auth-alert-error">{formError}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
            {saving ? 'Saving...' : 'Save budget'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
