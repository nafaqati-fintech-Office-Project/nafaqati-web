import { useCallback, useRef, useState } from 'react'
import { CircleAlert, LoaderCircle, Plus } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { usePreferences } from '../../hooks/usePreferences.js'
import { useToast } from '../../hooks/useToast.js'
import * as subscriptionApi from '../../services/subscriptionApi.js'
import SubscriptionDetailsDrawer from './SubscriptionDetailsDrawer.jsx'
import SubscriptionFormModal from './SubscriptionFormModal.jsx'
import SubscriptionInsights from './SubscriptionInsights.jsx'
import SubscriptionList from './SubscriptionList.jsx'
import SubscriptionReviewCard from './SubscriptionReviewCard.jsx'
import SubscriptionSummaryCard from './SubscriptionSummaryCard.jsx'
import SubscriptionTabs from './SubscriptionTabs.jsx'
import SyncBanner from './SyncBanner.jsx'
import { useSubscriptions } from './useSubscriptions.js'
import { useSubscriptionText } from './useSubscriptionText.js'
import './Subscriptions.css'

export default function Subscriptions() {
  const { t, dir, messageFor } = useSubscriptionText()
  const { prefs } = usePreferences()
  const toast = useToast()
  const data = useSubscriptions()
  const [tab, setTab] = useState('active')
  const [selected, setSelected] = useState(null) // { id } of the subscription shown in the drawer
  const [lookup, setLookup] = useState({ subscription: null, notFound: false }) // an existing one fetched by id (duplicate link)
  const [drawerError, setDrawerError] = useState('')
  const [form, setForm] = useState(null) // null | { mode: 'create' } | { mode: 'edit', id }
  const [confirming, setConfirming] = useState(null) // { kind: 'dismiss' | 'end', id }
  const reviewRef = useRef(null)

  const current = selected ? data.items.find((s) => s.id === selected.id) ?? lookup.subscription : null
  const drawerBusy = selected ? data.busy.has(selected.id) : false

  // 404 / 409: what the screen shows is out of date, so say so and reload it
  const fail = useCallback(
    (result, action) => {
      toast.error(messageFor(result.error, action))
      if ([404, 409].includes(result.error?.response?.status)) data.refresh()
    },
    [toast, messageFor, data],
  )

  const confirm = async (s) => {
    const result = await data.act(s.id, () => subscriptionApi.confirmSubscription(s.id))
    if (result.ok) toast.success(t.toasts.confirmed)
    else if (!result.skipped) fail(result, 'confirm')
  }
  const doConfirmed = async () => {
    const { kind, id } = confirming
    const result = await data.act(id, () => (kind === 'end' ? subscriptionApi.endSubscription(id) : subscriptionApi.dismissSubscription(id)))
    setConfirming(null)
    if (result.ok) {
      toast.success(kind === 'end' ? t.toasts.ended : t.toasts.dismissed)
      setSelected(null)
    } else if (!result.skipped) fail(result, kind)
  }
  const submitForm = async (body) => {
    const edit = form?.mode === 'edit'
    const result = edit
      ? await data.act(form.id, () => subscriptionApi.updateSubscription(form.id, body))
      : await data.created(() => subscriptionApi.createSubscription(body))
    if (result.ok) {
      toast.success(edit ? t.toasts.updated : t.toasts.added)
      setForm(null)
    }
    return result
  }
  const viewExisting = async (id) => {
    setForm(null)
    setDrawerError('')
    const known = data.items.find((s) => s.id === id)
    if (known) {
      setLookup({ subscription: null, notFound: false })
      setSelected({ id })
      return
    }
    const result = await data.runAction(`get-${id}`, () => subscriptionApi.getSubscription(id))
    if (result.ok) {
      setLookup({ subscription: result.value, notFound: false })
      setSelected({ id })
    } else {
      setLookup({ subscription: null, notFound: result.error?.response?.status === 404 })
      setSelected({ id })
      if (result.error?.response?.status !== 404) toast.error(messageFor(result.error))
    }
  }
  const closeDrawer = () => {
    setSelected(null)
    setLookup({ subscription: null, notFound: false })
    setDrawerError('')
  }
  const goReview = () => {
    setTab('active')
    setTimeout(() => reviewRef.current?.focus(), 0)
    setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const initialLoad = data.loading && !data.list
  const editing = form?.mode === 'edit' ? data.items.find((s) => s.id === form.id) : null

  return (
    <div className="subs-page" dir={dir}>
      <header className="subs-head">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}>
          <Plus size={17} aria-hidden="true" />
          {t.add}
        </button>
      </header>

      {data.error && !data.list ? (
        <div className="dc-state subs-error" role="alert">
          <CircleAlert size={32} aria-hidden="true" />
          <strong>{t.errors.load}</strong>
          <p>{messageFor(data.error)}</p>
          <button type="button" className="dc-retry" onClick={data.retry}>
            {t.actions.retry}
          </button>
        </div>
      ) : initialLoad ? (
        <div className="subs-loading" aria-busy="true">
          <p className="subs-loading-note" role="status">
            <LoaderCircle size={16} className="spin" aria-hidden="true" /> {t.sync.syncing} <small>{t.sync.syncingHint}</small>
          </p>
          <div className="subs-top">
            <span className="sk" style={{ blockSize: 120, borderRadius: 18 }} />
            <span className="sk" style={{ blockSize: 120, borderRadius: 18 }} />
          </div>
          <span className="sk" style={{ blockSize: 260, borderRadius: 18 }} />
        </div>
      ) : (
        <>
          <SyncBanner view={data.syncView} onRetry={data.retry} />
          <div className="subs-top">
            <SubscriptionSummaryCard summary={data.summary} loading={data.syncView === 'syncing' && !data.summary} failed={data.summaryError} />
            <SubscriptionReviewCard count={data.summary?.needsReview ?? data.groups.review.length} onReview={goReview} />
          </div>
          <div className="subs-main">
            <div className="subs-col">
              <SubscriptionTabs tab={tab} onTab={setTab} activeCount={data.groups.active.length} cancelledCount={data.groups.cancelled.length} />
              {data.syncView !== 'done' && data.items.length === 0 ? (
                <div className="dc-state" id="subs-panel" role="tabpanel">
                  <LoaderCircle size={30} className={data.syncView === 'syncing' ? 'spin' : ''} aria-hidden="true" />
                  <strong>{data.syncView === 'syncing' ? t.sync.syncing : t.sync.failed}</strong>
                  {data.syncView !== 'syncing' && (
                    <button type="button" className="dc-retry" onClick={data.retry}>
                      {t.sync.retry}
                    </button>
                  )}
                </div>
              ) : (
                <SubscriptionList
                  tab={tab}
                  groups={data.groups}
                  busy={data.busy}
                  reviewRef={reviewRef}
                  onOpen={(s) => {
                    setDrawerError('')
                    setSelected({ id: s.id })
                  }}
                  onConfirm={confirm}
                  onDismiss={(s) => setConfirming({ kind: 'dismiss', id: s.id })}
                  onAdd={() => setForm({ mode: 'create' })}
                />
              )}
            </div>
            <SubscriptionInsights summary={data.summary} items={data.items} />
          </div>
        </>
      )}

      <SubscriptionDetailsDrawer
        subscription={current}
        notFound={Boolean(selected) && !current && lookup.notFound}
        busy={drawerBusy}
        error={drawerError}
        onClose={closeDrawer}
        onConfirm={confirm}
        onDismiss={(s) => setConfirming({ kind: 'dismiss', id: s.id })}
        onEnd={(s) => setConfirming({ kind: 'end', id: s.id })}
        onEdit={(s) => setForm({ mode: 'edit', id: s.id })}
      />

      <SubscriptionFormModal
        open={Boolean(form) && (form.mode === 'create' || Boolean(editing))}
        subscription={editing}
        currency={prefs?.currency}
        submit={submitForm}
        onClose={() => setForm(null)}
        onViewExisting={viewExisting}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        title={confirming?.kind === 'end' ? t.endDialog.title : t.dismissDialog.title}
        body={confirming?.kind === 'end' ? t.endDialog.body : t.dismissDialog.body}
        confirmLabel={confirming?.kind === 'end' ? t.endDialog.confirm : t.dismissDialog.confirm}
        busyLabel={confirming?.kind === 'end' ? t.endDialog.busy : t.dismissDialog.busy}
        cancelLabel={confirming?.kind === 'end' ? t.endDialog.cancel : t.form.cancel}
        busy={Boolean(confirming) && data.busy.has(confirming.id)}
        onConfirm={doConfirmed}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}
