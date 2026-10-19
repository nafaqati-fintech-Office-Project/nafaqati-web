import { useRef } from 'react'
import './TabSwitch.css'

export default function TabSwitch({ tabs, value, onChange, label }) {
  const refs = useRef({})

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.value === value)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    onChange(tabs[next].value)
    refs.current[tabs[next].value]?.focus()
  }

  return (
    <div className="tabswitch" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t.value}
          ref={(el) => {
            refs.current[t.value] = el
          }}
          type="button"
          role="tab"
          id={`tab-${t.value}`}
          aria-selected={t.value === value}
          tabIndex={t.value === value ? 0 : -1}
          className={`tabswitch-tab ${t.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
