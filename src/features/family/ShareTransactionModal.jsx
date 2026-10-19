import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { listTransactions } from '../../services/transactionApi.js'
import { formatDate } from '../../utils/format.js'
import { money } from './familyUtils.js'
import './ShareTransactionModal.css'

// Share ONE of the caller's own completed expenses with a family. Nothing else becomes visible.
function Form({ t, dir, families, defaultFamilyId, submit, onClose, messageFor }) {
  const [familyId, setFamilyId] = useState(defaultFamilyId)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(0)
  const [state, setState] = useState({ items: [], loading: true, error: null, totalPages: 0 })
  const [picked, setPicked] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const requestRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const id = ++requestRef.current
    listTransactions({ type: 'EXPENSE', status: 'COMPLETED', search: debounced || undefined, sort: 'transactionDate,desc', page, size: 10 })
      .then((res) => {
        if (requestRef.current !== id) return
        setState((s) => ({ items: page === 0 ? res.items : [...s.items, ...res.items], loading: false, error: null, totalPages: res.totalPages }))
      })
      .catch((error) => requestRef.current === id && setState((s) => ({ ...s, loading: false, error })))
  }, [debounced, page])

  const onSubmit = async (event) => {
    event.preventDefault()
    if (saving || !picked) return
    setSaving(true)
    setFormError('')
    const result = await submit(picked, familyId)
    setSaving(false)
    if (!result.ok && !result.skipped) setFormError(messageFor(result.error, 'share'))
  }

  return (
    <form className="fam-share-form" onSubmit={onSubmit} noValidate dir={dir}>
      <p className="fam-invite-note">{t.shareForm.note}</p>
      {families.length > 1 && (
        <div className="form-field">
          <label htmlFor="fam-share-family">{t.shareForm.family}</label>
          <select id="fam-share-family" value={familyId} onChange={(e) => setFamilyId(e.target.value)}>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-field">
        <label htmlFor="fam-share-search">{t.shareForm.search}</label>
        <input id="fam-share-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" data-autofocus />
        <small className="fam-share-hint">{t.shareForm.eligibleNote}</small>
      </div>
      <div className="fam-share-list" role="radiogroup" aria-label={t.shareForm.pick}>
        {state.loading ? (
          <span className="sk fam-share-sk" aria-busy="true" />
        ) : state.error ? (
          <p className="auth-error" role="alert">
            {messageFor(state.error)}
          </p>
        ) : state.items.length === 0 ? (
          <p className="fam-empty">{t.shareForm.empty}</p>
        ) : (
          state.items.map((tx) => (
            <label key={tx.id} className={`fam-share-item ${picked === tx.id ? 'is-picked' : ''}`}>
              <input type="radio" name="fam-share-tx" checked={picked === tx.id} onChange={() => setPicked(tx.id)} />
              <span>
                <strong>{tx.merchant.name}</strong>
                <small>{formatDate(tx.occurredAt)}</small>
              </span>
              <b>{money(tx.amount, tx.currency)}</b>
            </label>
          ))
        )}
        {page + 1 < state.totalPages && (
          <button type="button" className="text-btn" onClick={() => setPage((p) => p + 1)}>
            {t.shareForm.loadMore}
          </button>
        )}
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
        <button type="submit" className="btn btn-primary" disabled={saving || !picked}>
          {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {saving ? t.shareForm.sharing : t.shareForm.submit}
        </button>
      </div>
    </form>
  )
}

export default function ShareTransactionModal({ open, t, dir, ...rest }) {
  return (
    <Modal open={open} onClose={rest.onClose} title={t.shareForm.title} closeLabel={t.close}>
      {open && <Form t={t} dir={dir} {...rest} />}
    </Modal>
  )
}
