import { useState } from 'react'
import * as familyApi from '../../services/familyApi.js'
import { chartBars, hasSpending, money } from './familyUtils.js'
import { useFamilyResource } from './useFamilyResource.js'
import './FamilyReportsPanel.css'

const TABS = ['category', 'merchant', 'trend', 'compare']
const pct = (value) => (value == null ? null : Math.round(Number(value) * 10) / 10)

// Real family reports (reports-analytics-service): spending by category and by merchant, the daily trend and
// the month against the month before. Everything shown is a backend figure; no percentage is computed here.
export default function FamilyReportsPanel({ t, familyId, month, period, stamp, currency, byCode }) {
  const [tab, setTab] = useState('category')
  const range = period ? { startDate: period.startDate, endDate: period.endDate } : null
  const loaders = {
    category: (s) => familyApi.getCategorySpending(familyId, range, s),
    merchant: (s) => familyApi.getMerchantSpending(familyId, range, s),
    trend: (s) => familyApi.getSpendingTrend(familyId, range, s),
    compare: (s) => familyApi.getMonthlyComparison(familyId, { month }, s),
  }
  const resource = useFamilyResource(loaders[tab], `${tab}:${familyId}:${month}:${stamp}`, { enabled: Boolean(familyId && range) })
  const data = resource.data
  const cur = data?.currency ?? currency
  const excluded = (data?.excludedOtherCurrencies ?? []).reduce((n, c) => n + c.transactionCount, 0)
  const name = (code) => byCode[code]?.name ?? code

  const row = (key, label, total, share) => (
    <div key={key} className="budget-row">
      <div className="budget-name-row">
        <span className="budget-dot blue" />
        <span>{label}</span>
      </div>
      <strong>{money(total, cur)}</strong>
      {share != null && (
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(Number(share))} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${t.reportsPanel.share(pct(share))}`}>
          <span className="progress-fill blue" style={{ width: `${Math.min(100, Number(share))}%` }} />
        </div>
      )}
    </div>
  )

  let body = null
  if (resource.loading) {
    body = (
      <div className="budget-list" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="sk fam-rep-sk" />
        ))}
      </div>
    )
  } else if (resource.error) {
    body = (
      <div className="dc-state" role="alert">
        <p>{t.errors.generic}</p>
        <button type="button" className="dc-retry" onClick={resource.retry}>
          {t.retry}
        </button>
      </div>
    )
  } else if (data) {
    if (tab === 'category') {
      body = data.categories.length === 0 ? <p className="fam-empty">{t.reportsPanel.empty}</p> : <div className="budget-list">{data.categories.map((c) => row(c.categoryCode, name(c.categoryCode), c.total, c.sharePercent))}</div>
    } else if (tab === 'merchant') {
      body =
        data.merchants.length === 0 ? (
          <p className="fam-empty">{t.reportsPanel.empty}</p>
        ) : (
          <>
            <div className="budget-list">{data.merchants.map((m) => row(m.merchant, m.merchant, m.total, m.sharePercent))}</div>
            {data.truncated && <p className="fam-note">{t.reportsPanel.truncated}</p>}
          </>
        )
    } else if (tab === 'trend') {
      const bars = chartBars(data.points.map((p) => ({ ...p, month: p.date })))
      body = !hasSpending(data.points) ? (
        <p className="fam-empty">{t.reportsPanel.empty}</p>
      ) : (
        <div className="fam-trend" role="img" aria-label={t.reportsPanel.title}>
          {bars.map((b) => (
            <span key={b.date} className="fam-trend-bar" style={{ height: `${b.height}%` }} title={t.reportsPanel.day(b.date, money(b.total, cur))} />
          ))}
        </div>
      )
    } else {
      body = (
        <div className="budget-list">
          <div className="fam-compare">
            <span>
              <small>{t.reportsPanel.current}</small>
              <strong>{money(data.current.total, cur)}</strong>
            </span>
            <span>
              <small>{t.reportsPanel.previous}</small>
              <strong>{money(data.previous.total, cur)}</strong>
            </span>
            <span>
              <small>{t.reportsPanel.difference}</small>
              <strong>
                {money(data.difference, cur)} {data.changePercent != null ? `(${data.changePercent > 0 ? '+' : ''}${pct(data.changePercent)}%)` : `(${t.reportsPanel.noPercent})`}
              </strong>
            </span>
          </div>
          {data.categories.map((c) => (
            <div key={c.categoryCode} className="budget-row">
              <div className="budget-name-row">
                <span className="budget-dot blue" />
                <span>{name(c.categoryCode)}</span>
              </div>
              <strong>
                {money(c.current, cur)} <small>({c.changePercent != null ? `${c.changePercent > 0 ? '+' : ''}${pct(c.changePercent)}%` : t.reportsPanel.noPercent})</small>
              </strong>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <section className="family-panel" aria-label={t.reportsPanel.title}>
      <div className="panel-head">
        <h2>{t.reportsPanel.title}</h2>
      </div>
      <div className="fam-rep-tabs" role="tablist" aria-label={t.reportsPanel.title}>
        {TABS.map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
            {t.reportsPanel.tabs[id]}
          </button>
        ))}
      </div>
      {body}
      {excluded > 0 && <p className="fam-note">{t.reportsPanel.other(excluded)}</p>}
    </section>
  )
}
