import { useState } from 'react'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { useFormat } from '../../hooks/useFormat.js'
import { useReports } from '../../hooks/useReports.js'
import { currentMonth, todayKey } from '../../utils/dateRange.js'
import { monthLabel } from '../analytics/analyticsUtils.js'
import { CategorySection, ComparisonSection, LifestyleSection, MerchantSection, SavingsSection, SummarySection } from './ReportSections.jsx'
import { useReportsText } from './useReportsText.js'
import '../analytics/Analytics.css'
import '../analytics/AnalyticsHeader.css'
import '../analytics/SectionCard.css'
import './Reports.css'

const shiftMonth = (month, by) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + by, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

// Reports: the monthly report, categories, merchants, lifestyle, savings and the comparison with last month.
// Same data services and month/currency controls as Analytics.
export default function Reports() {
  const { t, dir, locale } = useReportsText()
  const { timeZone } = useFormat()
  const maxMonth = currentMonth(timeZone)
  const [picked, setMonth] = useState(null)
  const selected = picked && picked <= maxMonth ? picked : maxMonth
  const { comparison, trend, expenses, currencies, currency, setCurrency } = useReports(selected)
  const today = todayKey(timeZone)
  const others = currencies.filter((c) => c !== currency)
  const Back = dir === 'rtl' ? ChevronRight : ChevronLeft
  const Forward = dir === 'rtl' ? ChevronLeft : ChevronRight

  // Only a loaded report is exported, so the PDF never has half the data
  const ready = !comparison.loading && !comparison.error && !trend.loading && !expenses.loading

  // The browser's print dialog saves a PDF; the page title becomes the suggested file name
  const exportPdf = () => {
    const previousTitle = document.title
    document.title = `Nafaqati-Report-${selected}`
    const restore = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  return (
    <div className="analytics reports" dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'}>
      <header className="an-header">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="an-tools">
          <div className="an-month" role="group" aria-label={t.month}>
            <button type="button" onClick={() => setMonth(shiftMonth(selected, -1))} aria-label={t.prevMonth}>
              <Back size={18} aria-hidden="true" />
            </button>
            <span aria-live="polite">{monthLabel(selected, locale, { month: 'long', year: 'numeric' })}</span>
            <button type="button" onClick={() => setMonth(shiftMonth(selected, 1))} disabled={selected >= maxMonth} aria-label={t.nextMonth}>
              <Forward size={18} aria-hidden="true" />
            </button>
          </div>
          {currencies.length > 0 && (
            <select className="an-currency" value={currency ?? ''} onChange={(e) => setCurrency(e.target.value)} aria-label={t.currency}>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="rp-export" onClick={exportPdf} disabled={!ready} title={t.exportHint}>
            <FileDown size={16} aria-hidden="true" />
            {t.exportPdf}
          </button>
        </div>
      </header>
      <p className="rp-print-meta">{t.printMeta(currency ?? '', new Date(`${today}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', dateStyle: 'medium' }))}</p>
      {others.length > 0 && (
        <p className="analytics-note" role="note">
          {t.otherCurrencies(others.join(', '), currency)}
        </p>
      )}
      <div className="rp-grid">
        <SummarySection comparison={comparison} expenses={expenses} currency={currency} month={selected} today={today} />
        <CategorySection comparison={comparison} currency={currency} />
        <MerchantSection expenses={expenses} currency={currency} />
        <LifestyleSection comparison={comparison} currency={currency} />
        <SavingsSection comparison={comparison} currency={currency} />
        <ComparisonSection comparison={comparison} trend={trend} currency={currency} locale={locale} />
      </div>
    </div>
  )
}
