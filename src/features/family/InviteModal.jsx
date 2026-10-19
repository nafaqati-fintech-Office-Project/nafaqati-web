import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { invitableRoles, isUuid } from './familyUtils.js'
import './InviteModal.css'

function Form({ t, dir, myRole, submit, onClose, messageFor }) {
  const roles = invitableRoles(myRole)
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState(roles[0])
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setFormError('')
    if (!isUuid(userId)) {
      setError(t.inviteForm.errors.userId)
      return
    }
    setError('')
    setSaving(true)
    const result = await submit(userId.trim(), role)
    setSaving(false)
    if (!result.ok && !result.skipped) setFormError(messageFor(result.error, 'invite'))
  }

  return (
    <form className="fam-invite-form" onSubmit={onSubmit} noValidate dir={dir}>
      <p className="fam-invite-note">{t.inviteForm.note}</p>
      <div className="form-field">
        <label htmlFor="fam-invite-id">{t.inviteForm.userId}</label>
        <input id="fam-invite-id" dir="ltr" value={userId} autoComplete="off" spellCheck="false" placeholder={t.inviteForm.userIdPlaceholder} onChange={(e) => setUserId(e.target.value)} aria-invalid={Boolean(error)} data-autofocus />
        {error && <span className="auth-error">{error}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="fam-invite-role">{t.inviteForm.role}</label>
        <select id="fam-invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {t.roles[r]}
            </option>
          ))}
        </select>
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
          {saving ? t.inviteForm.sending : t.inviteForm.send}
        </button>
      </div>
    </form>
  )
}

export default function InviteModal({ open, t, dir, myRole, submit, onClose, messageFor }) {
  return (
    <Modal open={open} onClose={onClose} title={t.inviteForm.title} closeLabel={t.close}>
      {open && <Form t={t} dir={dir} myRole={myRole} submit={submit} onClose={onClose} messageFor={messageFor} />}
    </Modal>
  )
}
