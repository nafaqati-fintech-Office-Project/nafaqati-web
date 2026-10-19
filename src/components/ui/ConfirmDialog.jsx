import Modal from './Modal.jsx'

export default function ConfirmDialog({ open, title, body, confirmLabel, busyLabel, cancelLabel, busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={title} size="sm">
      <p className="modal-text">{body}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy} data-autofocus>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
