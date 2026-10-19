import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'

// Side panel (or bottom sheet) with overlay, focus trap and Esc to close.
export default function Drawer({ open, onClose, title, closeLabel, placement = 'right', footer, children }) {
  const panelRef = useRef(null)
  const titleId = useId()
  useFocusTrap(panelRef, open, onClose)

  if (!open) return null
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        ref={panelRef}
        className={`drawer drawer-${placement}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="drawer-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}
