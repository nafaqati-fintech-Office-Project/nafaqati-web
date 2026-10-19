import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import './LanguageSelector.css'

// UI only for now: it tracks the choice but does not translate anything yet.
export default function LanguageSelector({ languages, value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = languages.find((l) => l.code === value) ?? languages[0]

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="lang" ref={rootRef}>
      <button
        type="button"
        className="lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        <Globe size={16} />
        {current.label}
        <ChevronDown size={16} />
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={label}>
          {languages.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(l.code)
                  setOpen(false)
                }}
              >
                {l.label}
                {l.code === value && <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
