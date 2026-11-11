import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { PERIOD_TEXT } from '../../constants/appText.js'
import { todayKey } from '../../utils/dateRange.js'
import { MAX_DAYS, PRESETS, periodLabel, presetPeriod, rangeProblem, shiftPeriod } from '../../utils/period.js'
import './PeriodPicker.css'

// Month arrows plus a calendar: quick picks (this month, last 7 days ...) or any From/To days, up to MAX_DAYS.
// value / onChange: { from, to } (utils/period.js). lang: 'en' | 'ar' (text and arrow direction).
export default function PeriodPicker({ value, onChange, timeZone, lang = 'en', className = '' }) {
  const t = PERIOD_TEXT[lang] ?? PERIOD_TEXT.en
  const rtl = lang === 'ar'
  const today = todayKey(timeZone)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const root = useRef(null)
  const next = shiftPeriod(value, 1)
  const problem = rangeProblem(draft, today)
  const Back = rtl ? ChevronRight : ChevronLeft
  const Forward = rtl ? ChevronLeft : ChevronRight

  // Closes on a click outside or Escape
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    setDraft(value)
    setOpen((o) => !o)
  }
  const pick = (period) => {
    onChange(period)
    setOpen(false)
  }
  const isCurrent = (preset) => {
    const p = presetPeriod(preset, timeZone)
    return p && p.from === value.from && p.to === value.to
  }

  return (
    <div className={`period-picker ${className}`} ref={root} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="period-bar" role="group" aria-label={t.label}>
        <button type="button" className="period-arrow" onClick={() => onChange(shiftPeriod(value, -1))} aria-label={t.previous}>
          <Back size={18} aria-hidden="true" />
        </button>
        <button type="button" className="period-current" onClick={toggle} aria-haspopup="dialog" aria-expanded={open}>
          <CalendarDays size={16} aria-hidden="true" />
          <span aria-live="polite">{periodLabel(value, t.locale)}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="period-arrow"
          onClick={() => onChange(next)}
          disabled={next.from > today}
          aria-label={t.next}
        >
          <Forward size={18} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="period-pop" role="dialog" aria-label={t.label}>
          <div className="period-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={isCurrent(preset) ? 'is-active' : ''}
                onClick={() => pick(presetPeriod(preset, timeZone))}
              >
                {t.presets[preset]}
              </button>
            ))}
          </div>
          <form
            className="period-custom"
            onSubmit={(e) => {
              e.preventDefault()
              if (!problem) pick(draft)
            }}
          >
            <strong>{t.custom}</strong>
            <div className="period-dates">
              <label>
                <span>{t.from}</span>
                <input
                  type="date"
                  value={draft.from}
                  max={draft.to && draft.to < today ? draft.to : today}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                  aria-invalid={Boolean(problem && problem !== 'tooLong')}
                />
              </label>
              <label>
                <span>{t.to}</span>
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                  aria-invalid={Boolean(problem)}
                />
              </label>
            </div>
            {problem && draft.from && draft.to && (
              <p className="period-error" role="alert">
                {t.problems[problem](MAX_DAYS)}
              </p>
            )}
            <div className="period-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                {t.cancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={Boolean(problem)}>
                {t.apply}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
