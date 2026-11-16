import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoaderCircle, Trash2, Undo2 } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../hooks/useToast.js'
import {
  cancelDeletion,
  getDeletionRequests,
  logoutEverywhere,
  requestDeletion,
} from '../../services/userApi.js'
import { CONFIRM_WORD, deletionDate, isConfirmed, openRequest } from '../../utils/accountDeletion.js'

const t = APP_TEXT.settings

// One row of the Account panel: "Delete account", or, while a deletion is pending, "Restore my account".
// Deleting signs the user out everywhere; nothing is erased until the 30-day grace period ends.
export default function DeleteAccountSection() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const inputId = useId()
  const [pending, setPending] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getDeletionRequests()
      .then((list) => active && setPending(openRequest(list)))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const closeDialog = () => {
    if (busy) return
    setDialogOpen(false)
    setTyped('')
  }

  const remove = async () => {
    if (!isConfirmed(typed) || busy) return
    setBusy(true)
    try {
      const request = await requestDeletion()
      await logoutEverywhere().catch(() => {})
      logout()
      navigate('/login', { replace: true, state: { message: t.deleteScheduled(deletionDate(request.purgeAfter)) } })
    } catch {
      toast.error(t.deleteFailed)
      setBusy(false)
    }
  }

  const restore = async () => {
    if (!pending || busy) return
    setBusy(true)
    try {
      await cancelDeletion(pending.id)
      setPending(null)
      toast.success(t.restored)
    } catch {
      toast.error(t.restoreFailed)
    } finally {
      setBusy(false)
    }
  }

  if (pending) {
    return (
      <li id="delete-account">
        <Undo2 size={20} aria-hidden="true" />
        <div>
          <strong>{t.pendingTitle}</strong>
          <small>{t.pendingBody(deletionDate(pending.purgeAfter))}</small>
        </div>
        <button type="button" className="btn btn-primary" onClick={restore} disabled={busy}>
          {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {busy ? t.restoring : t.restore}
        </button>
      </li>
    )
  }

  return (
    <li id="delete-account">
      <Trash2 size={20} aria-hidden="true" />
      <div>
        <strong>{t.deleteAccount}</strong>
        <small>{t.deleteAccountBody}</small>
      </div>
      <button type="button" className="btn btn-danger-outline" onClick={() => setDialogOpen(true)}>
        {t.deleteAccountButton}
      </button>
      <Modal open={dialogOpen} onClose={closeDialog} title={t.deleteTitle} size="sm">
        <p className="modal-text">{t.deleteLost}</p>
        <p className="modal-text">{t.deleteGrace}</p>
        <div className="form-field">
          <label htmlFor={inputId}>{t.deleteTypeToConfirm(CONFIRM_WORD)}</label>
          <input
            id={inputId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && remove()}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            data-autofocus
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={closeDialog} disabled={busy}>
            {t.cancel}
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={!isConfirmed(typed) || busy}>
            {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
            {busy ? t.deleting : t.deleteConfirm}
          </button>
        </div>
      </Modal>
    </li>
  )
}
