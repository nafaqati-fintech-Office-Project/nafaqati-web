import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, CircleAlert, Inbox, Plus } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useBudgets } from '../../hooks/useBudgets.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useFormat } from '../../hooks/useFormat.js'
import { useToast } from '../../hooks/useToast.js'
import { getErrorInfo } from '../../lib/errors.js'
import { BUDGET_TRACKING, archiveBudget, createBudget, updateBudget } from '../../services/budgetApi.js'
import AlertsPanel from './AlertsPanel.jsx'
import BudgetFormModal from './BudgetFormModal.jsx'
import BudgetOverview from './BudgetOverview.jsx'
import BudgetsHeader from './BudgetsHeader.jsx'
import CategoryLimitList from './CategoryLimitList.jsx'
import { budgetMonthWindow, currentMonthKey, monthLabel } from './budgetUtils.js'
import './Budgets.css'

function StateCard({ icon: Icon, title, body, children }) {
  return (
    <div className="budget-state dc-state">
      <Icon size={32} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{body}</p>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="budget-skeleton">
      <span className="sk budget-sk-head" />
      <span className="sk budget-sk-card" />
      <span className="sk budget-sk-card" />
    </div>
  )
}

export default function Budgets() {
  const toast = useToast()
  const { user } = useAuth()
  const { currency, timeZone } = useFormat()
  const { categories, byCode, loading: categoriesLoading, error: categoriesError, retry: retryCategories } = useCategories()
  const [searchParams, setSearchParams] = useSearchParams()
  const thisMonth = useMemo(() => currentMonthKey(timeZone), [timeZone])
  const months = useMemo(() => budgetMonthWindow(thisMonth).map((value) => ({ value, label: monthLabel(value) })), [thisMonth])
  const [month, setMonth] = useState(() => {
    const wanted = searchParams.get('month')
    return budgetMonthWindow(thisMonth).includes(wanted) ? wanted : thisMonth
  })
  const urlMonth = searchParams.get('month')
  if (urlMonth && urlMonth !== month && months.some((m) => m.value === urlMonth)) setMonth(urlMonth)
  const budgetsState = useBudgets(month)
  const [formOpen, setFormOpen] = useState(() => searchParams.get('create') === '1')
  const [archiving, setArchiving] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [alertsRetryKey, setAlertsRetryKey] = useState(0)

  const displayBudget = budgetsState.budget
  const editableBudget = displayBudget?.status === 'ARCHIVED' ? null : displayBudget
  const loading = budgetsState.loading || categoriesLoading
  const errorMessage = budgetsState.errorMessage || categoriesError
  const monthIndex = months.findIndex((item) => item.value === month)
  const canGoNext = monthIndex > 0
  const canGoPrev = monthIndex < months.length - 1

  const openForm = () => {
    setFormOpen(true)
    const next = new URLSearchParams(searchParams)
    next.set('create', '1')
    setSearchParams(next, { replace: true })
  }

  const closeForm = () => {
    setFormOpen(false)
    if (searchParams.has('create')) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      setSearchParams(next, { replace: true })
    }
  }

  const changeMonth = (value) => {
    setMonth(value)
    const next = new URLSearchParams(searchParams)
    next.set('month', value)
    setSearchParams(next, { replace: true })
  }

  const saveBudget = async (body) => {
    if (editableBudget) await updateBudget(editableBudget.id, body)
    else await createBudget(body)
    toast.success(editableBudget ? 'Budget updated' : 'Budget created')
    closeForm()
    budgetsState.refetch()
    setAlertsRetryKey((n) => n + 1)
  }

  const confirmArchive = async () => {
    setArchiving(true)
    try {
      await archiveBudget(displayBudget.id)
      toast.success('Budget archived')
      setArchiveOpen(false)
      budgetsState.refetch()
    } catch (err) {
      toast.error(getErrorInfo(err, 'budgets').message)
    } finally {
      setArchiving(false)
    }
  }

  const retryAll = () => {
    budgetsState.retry()
    retryCategories()
  }

  return (
    <div className="budgets-page">
      <BudgetsHeader
        month={month}
        months={months}
        hasBudget={Boolean(editableBudget)}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        onMonthChange={changeMonth}
        onPrev={() => canGoPrev && changeMonth(months[monthIndex + 1].value)}
        onNext={() => canGoNext && changeMonth(months[monthIndex - 1].value)}
        onCreate={openForm}
      />

      {loading ? (
        <Skeleton />
      ) : errorMessage ? (
        <StateCard icon={CircleAlert} title="We couldn't load budgets" body={errorMessage}>
          <button type="button" className="dc-retry" onClick={retryAll}>
            Retry
          </button>
        </StateCard>
      ) : displayBudget ? (
        <>
          {displayBudget.status === 'ARCHIVED' && (
            <p className="budget-archive-note">This budget is archived. It can no longer be edited and no longer counts spending. You can create a new budget for this month.</p>
          )}
          <BudgetOverview budget={displayBudget} currency={displayBudget.currency || currency} catchUp={budgetsState} />
          <CategoryLimitList budget={displayBudget} byCode={byCode} currency={displayBudget.currency || currency} />
          <div className="budget-actions-row">
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={() => setArchiveOpen(true)}
              disabled={displayBudget.status === 'ARCHIVED'}
            >
              <Archive size={17} aria-hidden="true" />
              Archive budget
            </button>
          </div>
          {BUDGET_TRACKING && <AlertsPanel budget={displayBudget} byCode={byCode} onRetryKey={alertsRetryKey} />}
        </>
      ) : (
        <StateCard icon={Inbox} title="Set a budget" body="Create a monthly budget using your preference currency and expense categories.">
          <button type="button" className="btn btn-primary" onClick={openForm}>
            <Plus size={17} aria-hidden="true" />
            Set a budget
          </button>
        </StateCard>
      )}

      <BudgetFormModal
        open={formOpen}
        mode={editableBudget ? 'edit' : 'create'}
        budget={editableBudget}
        month={month}
        currency={currency}
        categories={categories}
        userId={user?.id}
        timeZone={timeZone}
        onClose={closeForm}
        onSubmit={saveBudget}
      />

      <ConfirmDialog
        open={archiveOpen}
        title="Archive this budget?"
        body="This cannot be undone. An archived budget stops counting spending; you can create a new budget for this month afterwards."
        confirmLabel="Archive"
        busyLabel="Archiving..."
        cancelLabel="Cancel"
        busy={archiving}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  )
}
