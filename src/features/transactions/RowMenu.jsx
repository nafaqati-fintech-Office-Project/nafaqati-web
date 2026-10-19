import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, Eye, MoreHorizontal, Pencil, Tags, Trash2 } from 'lucide-react'
import { APP_TEXT } from '../../constants/appText.js'
import { categoryColor } from '../../config/categoryVisuals.js'

const POPOVER_HEIGHT = 330

// "⋯" actions menu. Rendered in a portal so the table's scroll area never clips it.
export default function RowMenu({ txn, categories, onView, onEdit, onDelete, onChangeCategory }) {
  const t = APP_TEXT.transactions.menu
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('menu')
  const [pos, setPos] = useState({})
  const buttonRef = useRef(null)
  const popRef = useRef(null)

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  const toggle = (e) => {
    e.stopPropagation()
    if (open) return close()
    const rect = buttonRef.current.getBoundingClientRect()
    const right = window.innerWidth - rect.right
    const flip = window.innerHeight - rect.bottom < POPOVER_HEIGHT && rect.top > window.innerHeight - rect.bottom
    setPos(flip ? { bottom: window.innerHeight - rect.top + 4, right } : { top: rect.bottom + 4, right })
    setView('menu')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return undefined
    popRef.current?.querySelector('[role^="menuitem"]')?.focus()
    const onDown = (e) => {
      if (!popRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false)
    }
    const dismiss = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('scroll', dismiss, true)
    }
  }, [open, view])

  const onKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = [...popRef.current.querySelectorAll('[role^="menuitem"]')]
      const next = items.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : -1)
      items[(next + items.length) % items.length]?.focus()
    }
  }

  // Close first so focus returns to the trigger, then run the action (dialogs restore focus there)
  const run = (action) => () => {
    close()
    action(txn)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label={t.actionsFor(txn.merchant.name)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            className="popover"
            style={pos}
            role="menu"
            aria-label={t.actionsFor(txn.merchant.name)}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            {view === 'menu' ? (
              <>
                <button type="button" role="menuitem" onClick={run(onView)}>
                  <Eye size={16} aria-hidden="true" /> {t.view}
                </button>
                <button type="button" role="menuitem" onClick={run(onEdit)}>
                  <Pencil size={16} aria-hidden="true" /> {t.edit}
                </button>
                <button type="button" role="menuitem" onClick={() => setView('category')}>
                  <Tags size={16} aria-hidden="true" /> {t.changeCategory}
                </button>
                {/* only manually created transactions can be deleted (the backend answers 409 otherwise) */}
                {txn.source === 'MANUAL' && (
                  <button type="button" role="menuitem" className="is-danger" onClick={run(onDelete)}>
                    <Trash2 size={16} aria-hidden="true" /> {t.delete}
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" role="menuitem" onClick={() => setView('menu')}>
                  <ChevronLeft size={16} aria-hidden="true" /> {t.back}
                </button>
                <div className="popover-scroll">
                  {categories.filter((c) => c.kind === 'ANY' || c.kind === (txn.type === 'INCOME' ? 'INCOME' : 'EXPENSE')).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={c.id === txn.categoryId}
                      onClick={() => {
                        close()
                        if (c.id !== txn.categoryId) onChangeCategory(txn, c.id)
                      }}
                    >
                      <span className="category-dot" style={{ background: categoryColor(c.id) }} aria-hidden="true" />
                      {c.name}
                      {c.id === txn.categoryId && <Check size={14} aria-hidden="true" className="popover-check" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
