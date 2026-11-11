import PeriodPicker from '../../components/ui/PeriodPicker.jsx'
import { useAnalyticsText } from './useAnalyticsText.js'
import './AnalyticsHeader.css'

// The calendar (month arrows, quick picks or any From/To days) and the currency selector
export default function AnalyticsHeader({ period, onPeriod, timeZone, currencies, currency, onCurrency }) {
  const { t, lang } = useAnalyticsText()

  return (
    <header className="an-header">
      <div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="an-tools">
        <PeriodPicker value={period} onChange={onPeriod} timeZone={timeZone} lang={lang} />
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
