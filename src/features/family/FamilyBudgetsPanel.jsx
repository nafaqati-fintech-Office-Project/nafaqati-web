import { money } from './familyUtils.js'
import './FamilyBudgetsPanel.css'

const TONE = { ON_TRACK: 'blue', WARNING: 'gold', EXCEEDED: 'red' }

// "Category Budgets": the backend's utilization of the family's active budget (limits, spent, percent, status).
// Nothing is calculated here from a transaction list.
export default function FamilyBudgetsPanel({ t, budgetState, utilization, perms, byCode, busy, onAdd, onEdit, onArchive }) {
  const u = utilization.data
  const currency = u?.currency

  return (
    <section className="family-panel" aria-label={t.budgetsPanel.title}>
      <div className="panel-head">
        <h2>{t.budgetsPanel.title}</h2>
        {perms.manageBudgets && (
          <span className="fam-head-actions">
            {u ? (
              <>
                <button type="button" className="text-btn" onClick={() => onEdit(u)} disabled={busy}>
                  {t.budgetsPanel.edit}
                </button>
                <button type="button" className="text-btn" onClick={() => onArchive(u)} disabled={busy}>
                  {t.budgetsPanel.archive}
                </button>
              </>
            ) : budgetState === 'none' ? (
              <button type="button" className="text-btn" onClick={onAdd}>
                {t.budgetsPanel.add}
              </button>
            ) : null}
          </span>
        )}
      </div>
      {budgetState === 'loading' || utilization.loading ? (
        <div className="budget-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="sk fam-budget-sk" />
          ))}
        </div>
      ) : budgetState === 'error' || utilization.error ? (
        <div className="dc-state" role="alert">
          <p>{t.budgetsPanel.unavailable}</p>
          {utilization.error && (
            <button type="button" className="dc-retry" onClick={utilization.retry}>
              {t.retry}
            </button>
          )}
        </div>
      ) : budgetState === 'none' || !u ? (
        <p className="fam-empty">{perms.manageBudgets ? t.budgetsPanel.noneManage : t.budgetsPanel.none}</p>
      ) : (
        <>
          <div className="budget-list">
            <div className="budget-row fam-budget-total">
              <div className="budget-name-row">
                <span className={`budget-dot ${TONE[u.usageStatus]}`} />
                <span>{t.budgetsPanel.total}</span>
                <small className={`fam-status is-${u.usageStatus.toLowerCase()}`}>{t.budgetsPanel.status[u.usageStatus]}</small>
              </div>
              <strong>{t.budgetsPanel.spentOf(money(u.totalSpent, currency), money(u.totalLimit, currency))}</strong>
              <div className="progress-track" role="progressbar" aria-valuenow={Math.min(100, Math.floor(u.percentageUsed))} aria-valuemin={0} aria-valuemax={100} aria-label={t.budgetsPanel.total}>
                <span className={`progress-fill ${TONE[u.usageStatus]}`} style={{ width: `${Math.min(100, Number(u.percentageUsed))}%` }} />
              </div>
            </div>
            {u.categories.map((c) => (
              <div key={c.category} className="budget-row">
                <div className="budget-name-row">
                  <span className={`budget-dot ${TONE[c.usageStatus]}`} />
                  <span>{byCode[c.category]?.name ?? c.category}</span>
                  {c.usageStatus !== 'ON_TRACK' && <small className={`fam-status is-${c.usageStatus.toLowerCase()}`}>{t.budgetsPanel.status[c.usageStatus]}</small>}
                </div>
                <strong>{t.budgetsPanel.spentOf(money(c.spentAmount, currency), money(c.limitAmount, currency))}</strong>
                <div className="progress-track" role="progressbar" aria-valuenow={Math.min(100, Math.floor(c.percentageUsed))} aria-valuemin={0} aria-valuemax={100} aria-label={byCode[c.category]?.name ?? c.category}>
                  <span className={`progress-fill ${TONE[c.usageStatus]}`} style={{ width: `${Math.min(100, Number(c.percentageUsed))}%` }} />
                </div>
              </div>
            ))}
            {u.unlimitedSpending.length > 0 && (
              <div className="budget-row">
                <div className="budget-name-row">
                  <span className="budget-dot gold" />
                  <span>{t.budgetsPanel.notCovered}</span>
                </div>
                <strong>{money(u.unlimitedSpending.reduce((s, c) => s + Number(c.spentAmount), 0), currency)}</strong>
              </div>
            )}
          </div>
          {u.excludedOtherCurrencies.length > 0 && (
            <p className="fam-note">{t.budgetsPanel.excluded(u.excludedOtherCurrencies.map((c) => `${c.currency} (${c.transactionCount})`).join(', '))}</p>
          )}
        </>
      )}
    </section>
  )
}
