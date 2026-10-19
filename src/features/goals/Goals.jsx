import { useState } from 'react'
import { CircleAlert, Flag, Plus } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useFormat } from '../../hooks/useFormat.js'
import { useGoals } from '../../hooks/useGoals.js'
import { useToast } from '../../hooks/useToast.js'
import * as goalsApi from '../../services/goalsApi.js'
import ContributionModal from './ContributionModal.jsx'
import GoalCard from './GoalCard.jsx'
import GoalFormModal from './GoalFormModal.jsx'
import GoalPlanner from './GoalPlanner.jsx'
import GoalsHeader from './GoalsHeader.jsx'
import { useGoalsText } from './useGoalsText.js'
import './Goals.css'

function GoalsSkeleton() {
  return (
    <div className="goals-shell">
      <div className="goals-list">
        {[0, 1, 2, 3].map((item) => (
          <span key={item} className="sk goals-card-sk" />
        ))}
      </div>
      <span className="sk goals-plan-sk" />
    </div>
  )
}

function StateCard({ icon: Icon, title, body, children }) {
  return (
    <div className="goals-state dc-state">
      <Icon size={32} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{body}</p>
      {children}
    </div>
  )
}

export default function Goals() {
  const t = useGoalsText()
  const toast = useToast()
  const { currency, timeZone } = useFormat()
  const { goals, planner, loading, error, retry, refetch } = useGoals()
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [contributing, setContributing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const saveGoal = async (input) => {
    try {
      if (editing) await goalsApi.updateGoal(editing.id, input)
      else await goalsApi.createGoal(input)
      toast.success(editing ? t.toasts.updated : t.toasts.created)
      setFormOpen(false)
      setEditing(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || t.toasts.failed)
      throw err
    }
  }

  const addContribution = async (input) => {
    try {
      await goalsApi.addContribution(contributing.id, input)
      toast.success(t.toasts.contributed)
      setContributing(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || t.toasts.failed)
      throw err
    }
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await goalsApi.deleteGoal(deleting.id)
      toast.success(t.toasts.deleted)
      setDeleting(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || t.toasts.failed)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="goals-page" dir={t.dir} lang={t.dir === 'rtl' ? 'ar' : 'en'}>
      <GoalsHeader t={t} onCreate={openCreate} />

      {loading ? (
        <GoalsSkeleton />
      ) : error ? (
        <StateCard icon={CircleAlert} title={t.loadingError} body={error.message}>
          <button type="button" className="dc-retry" onClick={retry}>
            {t.retry}
          </button>
        </StateCard>
      ) : goals.length === 0 ? (
        <StateCard icon={Flag} title={t.emptyTitle} body={t.emptyBody}>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={17} aria-hidden="true" />
            {t.addFirst}
          </button>
        </StateCard>
      ) : (
        <div className="goals-shell">
          <section className="goals-list" aria-label={t.title}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                t={t}
                currency={currency}
                timeZone={timeZone}
                onEdit={(item) => {
                  setEditing(item)
                  setFormOpen(true)
                }}
                onContribute={setContributing}
                onDelete={setDeleting}
              />
            ))}
          </section>
          <GoalPlanner planner={planner} t={t} currency={currency} />
        </div>
      )}

      <GoalFormModal
        open={formOpen}
        goal={editing}
        t={t}
        currency={currency}
        timeZone={timeZone}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={saveGoal}
      />
      <ContributionModal
        goal={contributing}
        t={t}
        currency={currency}
        timeZone={timeZone}
        onClose={() => setContributing(null)}
        onSubmit={addContribution}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t.delete.title}
        body={t.delete.body}
        confirmLabel={t.delete.confirm}
        busyLabel={t.delete.deleting}
        cancelLabel={t.delete.cancel}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
