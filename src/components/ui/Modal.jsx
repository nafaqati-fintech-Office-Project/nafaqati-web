import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'

export default function Modal({ open, onClose, title, closeLabel = 'Close', size = 'md', children }) {
  const panelRef = useRef(null)
  const titleId = useId()
  useFocusTrap(panelRef, open, onClose)

  if (!open) return null
  return createPortal(
    <div className="overlay overlay-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}
