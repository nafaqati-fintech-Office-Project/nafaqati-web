import { useState } from 'react'
import { Check, Crown, LoaderCircle, Minus } from 'lucide-react'
import { APP_TEXT } from '../../constants/appText.js'
import { useAsync } from '../../hooks/useAsync.js'
import { usePlan } from '../../hooks/usePlan.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { useToast } from '../../hooks/useToast.js'
import { getErrorInfo } from '../../lib/errors.js'
import { cancelSubscription, completeMockPayment, getMe, getPlans, resumeSubscription, startCheckout } from '../../services/billingApi.js'
import { FEATURE_ROWS, cellFor, monthsFree, pickPrices } from './planUtils.js'
import './Plans.css'

const t = APP_TEXT.plans

function Cell({ cell }) {
  if (cell.kind === 'yes') return <Check size={18} className="plan-yes" aria-label={t.included} />
  if (cell.kind === 'no') return <Minus size={18} className="plan-no" aria-label={t.notIncluded} />
  if (cell.kind === 'unlimited') return <span className="plan-limit">{t.unlimited}</span>
  return <span className="plan-limit">{t.limit[cell.unit]?.(cell.value) ?? cell.value}</span>
}

function Comparison({ plans }) {
  const entitlements = (id) => plans.find((p) => p.id === id)?.entitlements
  const cellOf = (row, id) => ({ ...cellFor(row, entitlements(id)), unit: row.unit })
  return (
    <table className="plan-table">
      <thead>
        <tr>
          <th scope="col">{t.feature}</th>
          <th scope="col">{t.free}</th>
          <th scope="col" className="plan-premium-col">
            {t.premium}
          </th>
        </tr>
      </thead>
      <tbody>
        {FEATURE_ROWS.map((row) => (
          <tr key={row.id}>
            <th scope="row">{t.features[row.id]}</th>
            <td>
              <Cell cell={cellOf(row, 'free')} />
            </td>
            <td>
              <Cell cell={cellOf(row, 'premium')} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Plans() {
  const toast = useToast()
  const { prefs } = usePreferences()
  const me = useAsync(getMe, 'me')
  const planState = usePlan()
  const plans = useAsync(getPlans, 'plans')
  const [interval, setInterval] = useState('YEARLY')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loading = me.loading || plans.loading
  const failed = me.error || plans.error
  const premiumPlan = plans.data?.find((p) => p.id === 'premium')
  const price = pickPrices(premiumPlan?.prices, prefs?.currency)
  const saved = monthsFree(price)
  const isPremium = me.data?.premium === true
  const money = (amount) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency, maximumFractionDigits: 0 }).format(amount)
  const periodEnd = me.data?.periodEnd ? new Date(me.data.periodEnd).toLocaleDateString() : null

  // The server starts the purchase and only its answer (the payment provider confirming) makes the user Premium.
  const upgrade = async () => {
    setBusy(true)
    setError('')
    try {
      const { payment } = await startCheckout(interval, price.currency)
      // Until a real payment gateway is connected the mock provider confirms the payment (development servers only).
      if (payment?.id) await completeMockPayment(payment.id)
      me.refetch()
      planState.refresh()
      toast.success(t.upgraded)
    } catch (e) {
      setError(e?.response?.status === 403 ? t.paymentsSoon : getErrorInfo(e, 'billing').message)
    } finally {
      setBusy(false)
    }
  }

  const changeRenewal = async (cancel) => {
    setBusy(true)
    setError('')
    try {
      await (cancel ? cancelSubscription() : resumeSubscription())
      me.refetch()
      planState.refresh()
      toast.success(cancel ? t.cancelled : t.resumed)
    } catch (e) {
      setError(getErrorInfo(e, 'billing').message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-narrow">
      <header className="page-head">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      {loading && <div className="sk" style={{ height: 240, borderRadius: 14 }} aria-hidden="true" />}

      {!loading && failed && (
        <div className="dc-state" role="alert">
          <p>{t.loadFailed}</p>
          <button type="button" className="dc-retry" onClick={() => { me.retry(); plans.retry() }}>
            {APP_TEXT.common.retry}
          </button>
        </div>
      )}

      {!loading && !failed && (
        <>
          <section className={`panel plan-current ${isPremium ? 'is-premium' : ''}`} aria-labelledby="plan-current-title">
            <Crown size={26} aria-hidden="true" />
            <div>
              <span className="plan-current-label">{t.current}</span>
              <h2 id="plan-current-title">{isPremium ? t.premium : t.free}</h2>
              <p>{isPremium ? t.premiumBody : t.freeBody}</p>
              {me.data.status === 'PAST_DUE' && <p className="plan-warning">{t.pastDue}</p>}
              {isPremium && periodEnd && <p>{me.data.cancelAtPeriodEnd ? t.endsOn(periodEnd) : t.renewsOn(periodEnd)}</p>}
            </div>
          </section>

          <section className="panel" aria-labelledby="plan-compare-title">
            <h2 id="plan-compare-title" className="panel-title">
              {t.compare}
            </h2>
            <Comparison plans={plans.data} />
          </section>

          {error && (
            <div className="plan-error" role="alert">
              {error}
            </div>
          )}

          {!isPremium && price && (
            <section className="panel plan-offer" aria-labelledby="plan-offer-title">
              <h2 id="plan-offer-title" className="panel-title">
                {t.upgrade}
              </h2>
              <div className="plan-intervals" role="group" aria-label={t.billing}>
                {['MONTHLY', 'YEARLY'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`plan-interval ${interval === value ? 'is-active' : ''}`}
                    aria-pressed={interval === value}
                    onClick={() => setInterval(value)}
                  >
                    {value === 'MONTHLY' ? t.monthly : t.yearly}
                  </button>
                ))}
              </div>
              <p className="plan-price">
                <strong>{money(interval === 'MONTHLY' ? price.monthly : price.yearly)}</strong>{' '}
                {interval === 'MONTHLY' ? t.perMonth : t.perYear}
              </p>
              {interval === 'YEARLY' && saved > 0 && <p className="plan-save">{t.yearlySave(saved)}</p>}
              <button type="button" className="btn btn-primary" onClick={upgrade} disabled={busy}>
                {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
                {t.upgradeButton}
              </button>
            </section>
          )}

          {isPremium && (
            <div className="profile-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => changeRenewal(!me.data.cancelAtPeriodEnd)}
                disabled={busy}
              >
                {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
                {me.data.cancelAtPeriodEnd ? t.resume : t.cancel}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
