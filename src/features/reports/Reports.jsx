import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { useFormat } from '../../hooks/useFormat.js'
import { useReports } from '../../hooks/useReports.js'
import { todayKey } from '../../utils/dateRange.js'
import { currentMonthPeriod, periodFromParams, previousPeriod, wholeMonth } from '../../utils/period.js'
import { transactionsLink } from '../../utils/transactionLinks.js'
import PeriodPicker from '../../components/ui/PeriodPicker.jsx'
import {
  CategorySection,
  ComparisonSection,
  DebtSection,
  LifestyleSection,
  MerchantSection,
  MovementSection,
  PaymentMethodsSection,
  SavingsSection,
  SummarySection,
  WeeklySection,
} from './ReportSections.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import { reportCsv, spendingItems } from './reportUtils.js'
import { ReportRangeContext, useReportsText } from './useReportsText.js'
import '../analytics/Analytics.css'
import '../analytics/AnalyticsHeader.css'
import '../analytics/SectionCard.css'
import './Reports.css'

// Reports: the report for a month or any date range, categories, merchants, lifestyle, savings and the comparison
// with the period before. The period lives in the URL (?from=&to=), so Back from a drill-down keeps it.
export default function Reports() {
  const { timeZone } = useFormat()
  const [params, setParams] = useSearchParams()
  const period = periodFromParams(params, currentMonthPeriod(timeZone))
  const isRange = !wholeMonth(period)
  return (
    <ReportRangeContext.Provider value={isRange}>
      <ReportsPage
        period={period}
        timeZone={timeZone}
        onPeriod={(next) =>
          setParams(
            (prev) => {
              const p = new URLSearchParams(prev)
              p.set('from', next.from)
              p.set('to', next.to)
              return p
            },
            { replace: true },
          )
        }
      />
    </ReportRangeContext.Provider>
  )
}

function ReportsPage({ period, timeZone, onPeriod }) {
  const { t, dir, locale, lang } = useReportsText()
  const selected = wholeMonth(period) ?? `${period.from}_${period.to}`
  const { comparison, trend, expenses, currencies, currency, setCurrency } = useReports(period)
  const today = todayKey(timeZone)
  const others = currencies.filter((c) => c !== currency)
  // Every card, row and bar opens the Transactions page filtered to what it shows
  const navigate = useNavigate()
  // A link may name another month (a trend bar) or other days (the previous period); else it is the selected period
  const open = (filters = {}) =>
    navigate(transactionsLink(filters.month || filters.from ? filters : { from: period.from, to: period.to, ...filters }))
  const previous = previousPeriod(period)

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

  // The month's spending rows as a CSV file that opens in Excel
  const { nameOf } = useCategories()
  const exportCsv = () => {
    const csv = reportCsv(spendingItems(expenses.data?.items), currency, t.csv, nameOf, timeZone)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `Nafaqati-Report-${selected}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="analytics reports" dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'}>
      <header className="an-header">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="an-tools">
          <PeriodPicker value={period} onChange={onPeriod} timeZone={timeZone} lang={lang} />
          {currencies.length > 0 && (
            <select className="an-currency" value={currency ?? ''} onChange={(e) => setCurrency(e.target.value)} aria-label={t.currency}>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="rp-export" onClick={exportCsv} disabled={!ready || !currency} title={t.exportCsvHint}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            {t.exportCsv}
          </button>
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
        <SummarySection comparison={comparison} expenses={expenses} currency={currency} period={period} timeZone={timeZone} open={open} />
        <CategorySection comparison={comparison} currency={currency} open={open} />
        <MerchantSection expenses={expenses} currency={currency} open={open} />
        <WeeklySection expenses={expenses} currency={currency} period={period} timeZone={timeZone} locale={locale} open={open} />
        <PaymentMethodsSection expenses={expenses} currency={currency} open={open} />
        <MovementSection comparison={comparison} currency={currency} open={open} />
        <LifestyleSection comparison={comparison} currency={currency} open={open} />
        <SavingsSection comparison={comparison} currency={currency} open={open} previous={previous} />
        <DebtSection comparison={comparison} currency={currency} open={open} />
        <ComparisonSection comparison={comparison} trend={trend} currency={currency} locale={locale} open={open} previous={previous} />
      </div>
    </div>
  )
}
