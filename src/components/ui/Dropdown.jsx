import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Accessible listbox dropdown. options: [{ value, label, color? }]
export default function Dropdown({ value, options, onChange, label, placement = 'bottom', className = '' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const listId = useId()
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const openList = () => {
    setActive(selectedIndex)
    setOpen(true)
  }

  const choose = (index) => {
    onChange(options[index].value)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      setActive((i) => Math.min(options.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1))))
    } else if (e.key === 'Home' && open) {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End' && open) {
      e.preventDefault()
      setActive(options.length - 1)
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault()
      choose(active)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={`dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className="dropdown-btn"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {selected?.color && <span className="category-dot" style={{ background: selected.color }} aria-hidden="true" />}
        <span className="dropdown-value">{selected?.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul id={listId} className={`dropdown-list placement-${placement}`} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={index === active ? 'is-active' : ''}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(index)}
            >
              {option.color && <span className="category-dot" style={{ background: option.color }} aria-hidden="true" />}
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
