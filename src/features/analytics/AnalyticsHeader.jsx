import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAnalyticsText } from './useAnalyticsText.js'
import { monthLabel } from './analyticsUtils.js'
import './AnalyticsHeader.css'

// Month stepper (cannot go past `maxMonth`, the user's current month) and the currency selector
export default function AnalyticsHeader({ month, maxMonth, onPrev, onNext, currencies, currency, onCurrency }) {
  const { t, locale, dir } = useAnalyticsText()
  const Back = dir === 'rtl' ? ChevronRight : ChevronLeft
  const Forward = dir === 'rtl' ? ChevronLeft : ChevronRight

  return (
    <header className="an-header">
      <div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="an-tools">
        <div className="an-month" role="group" aria-label={t.month}>
          <button type="button" onClick={onPrev} aria-label={t.prevMonth}>
            <Back size={18} aria-hidden="true" />
          </button>
          <span aria-live="polite">{monthLabel(month, locale, { month: 'long', year: 'numeric' })}</span>
          <button type="button" onClick={onNext} disabled={month >= maxMonth} aria-label={t.nextMonth}>
            <Forward size={18} aria-hidden="true" />
          </button>
        </div>
        {currencies.length > 0 && (
          <select className="an-currency" value={currency ?? ''} onChange={(e) => onCurrency(e.target.value)} aria-label={t.currency}>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  )
}
