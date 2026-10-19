import { chartBars, hasSpending, money, monthShort } from './familyUtils.js'
import './MonthlyOverview.css'

// "Monthly Overview": one real bar per month (reports/monthly-spending). Heights are relative to the largest real total.
export default function MonthlyOverview({ t, lang, resource, currency }) {
  const data = resource.data
  const bars = chartBars(data?.months)
  const excluded = (data?.excludedOtherCurrencies ?? []).reduce((n, c) => n + c.transactionCount, 0)

  return (
    <section className="family-panel large-panel" aria-label={t.overview.title}>
      <div className="panel-head">
        <h2>{t.overview.title}</h2>
      </div>
      {resource.loading ? (
        <div className="budget-chart" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="sk fam-chart-sk" />
          ))}
        </div>
      ) : resource.error ? (
        <div className="dc-state" role="alert">
          <p>{t.errors.generic}</p>
          <button type="button" className="dc-retry" onClick={resource.retry}>
            {t.retry}
          </button>
        </div>
      ) : (
        <>
          <div className="budget-chart" role="img" aria-label={`${t.overview.aria}: ${bars.map((b) => t.overview.barLabel(monthShort(b.month, lang), money(b.total, data.currency ?? currency))).join(', ')}`}>
            {bars.map((bar) => (
              <div key={bar.month} className="chart-bar-wrap" title={t.overview.barLabel(monthShort(bar.month, lang), money(bar.total, data.currency ?? currency))}>
                <span className="chart-bar" style={{ height: `${bar.height}%`, minHeight: bar.height === 0 ? 4 : 32, opacity: bar.height === 0 ? 0.35 : 1 }} />
                <small>{monthShort(bar.month, lang)}</small>
              </div>
            ))}
          </div>
          {!hasSpending(data?.months) && <p className="fam-chart-empty">{t.overview.empty}</p>}
          {excluded > 0 && <p className="fam-chart-empty">{t.overview.other(excluded)}</p>}
        </>
      )}
    </section>
  )
}
