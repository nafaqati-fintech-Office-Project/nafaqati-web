import { useCallback, useMemo, useState } from 'react'
import { CircleAlert, Users } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import { useToast } from '../../hooks/useToast.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { monthPeriod } from '../budgets/budgetUtils.js'
import * as familyApi from '../../services/familyApi.js'
import FamilyBudgetModal from './FamilyBudgetModal.jsx'
import FamilyBudgetsPanel from './FamilyBudgetsPanel.jsx'
import FamilyFormModal from './FamilyFormModal.jsx'
import FamilyReportsPanel from './FamilyReportsPanel.jsx'
import FamilySummary from './FamilySummary.jsx'
import InvitationsPanel from './InvitationsPanel.jsx'
import InviteModal from './InviteModal.jsx'
import MembersPanel from './MembersPanel.jsx'
import MonthlyOverview from './MonthlyOverview.jsx'
import ShareTransactionModal from './ShareTransactionModal.jsx'
import SharedTransactionsPanel from './SharedTransactionsPanel.jsx'
import { monthLong, permissionsFor, recentMonths } from './familyUtils.js'
import { useFamilyResource } from './useFamilyResource.js'
import { useFamilyText } from './useFamilyText.js'
import './FamilyFinance.css'

const STORE_KEY = 'nafaqati.family.selected'
const readSelected = () => {
  try {
    return window.localStorage.getItem(STORE_KEY)
  } catch {
    return null
  }
}
const todayMonth = (timeZone) => new Date().toLocaleDateString('en-CA', { timeZone }).slice(0, 7)

export default function FamilyFinance() {
  const { t, lang, dir, messageFor } = useFamilyText()
  const { user } = useAuth()
  const { prefs } = usePreferences()
  const toast = useToast()
  const { byCode, categories } = useCategories()
  const myUserId = user?.id

  // ---- which family, which month
  const families = useFamilyResource((signal) => familyApi.listFamilies(signal), 'families')
  const [selection, setSelection] = useState(readSelected)
  const list = useMemo(() => families.data ?? [], [families.data])
  const family = list.find((f) => f.id === selection) ?? list[0] ?? null
  const fid = family?.id
  const myRole = family?.myRole
  const perms = permissionsFor(myRole)
  const [monthChoice, setMonthChoice] = useState({ familyId: null, month: null })
  const month = monthChoice.familyId === fid && monthChoice.month ? monthChoice.month : family ? todayMonth(family.timeZone) : ''
  const months = useMemo(() => (family ? recentMonths(todayMonth(family.timeZone)) : []), [family])

  const selectFamily = (id) => {
    setSelection(id)
    try {
      window.localStorage.setItem(STORE_KEY, id)
    } catch {
      /* the choice just is not remembered */
    }
  }

  // ---- data of the selected family (each request is cancelled when the family or month changes)
  const members = useFamilyResource((s) => familyApi.listMembers(fid, s), `members:${fid}`, { enabled: Boolean(fid) })
  const dashboard = useFamilyResource((s) => familyApi.getFamilyDashboard(fid, { month }, s), `dash:${fid}:${month}`, { enabled: Boolean(fid) })
  const monthly = useFamilyResource((s) => familyApi.getMonthlySpending(fid, { endMonth: month, months: 6 }, s), `monthly:${fid}:${month}`, { enabled: Boolean(fid) })
  const familyInvites = useFamilyResource((s) => familyApi.listFamilyInvitations(fid, 'PENDING', s), `finv:${fid}`, { enabled: Boolean(fid) && perms.invite })
  const mine = useFamilyResource((s) => familyApi.listMyInvitations('PENDING', s), 'mine-invites')
  const budgetId = dashboard.data?.budget?.state === 'AVAILABLE' ? dashboard.data.budget.budgetId : null
  const utilization = useFamilyResource((s) => familyApi.getFamilyBudgetUtilization(fid, budgetId, s), `util:${fid}:${budgetId}`, { enabled: Boolean(fid && budgetId) })
  const [sharedSize, setSharedSize] = useState(10)
  const shared = useFamilyResource((s) => familyApi.listFamilyTransactions(fid, { page: 0, size: sharedSize }, s), `shared:${fid}:${sharedSize}`, { enabled: Boolean(fid) })

  const budgetState = !dashboard.data && dashboard.loading ? 'loading' : dashboard.error ? 'error' : dashboard.data?.budget?.state === 'AVAILABLE' ? 'available' : dashboard.data?.budget?.reason === 'NO_ACTIVE_BUDGET' ? 'none' : dashboard.data?.budget?.state === 'NOT_AVAILABLE' ? 'error' : 'loading'

  // ---- mutations: one at a time (the gateway allows 5 writes per second), then reload what changed
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null) // { kind: 'family'|'edit'|'invite'|'budget'|'budget-edit'|'share' }
  const [confirm, setConfirm] = useState(null) // { kind, ...payload }

  const run = useCallback(
    async (request, successKey, action, after) => {
      if (busy) return { ok: false, skipped: true }
      setBusy(true)
      try {
        const value = await request()
        if (successKey) toast.success(t.toasts[successKey])
        after?.(value)
        return { ok: true, value }
      } catch (error) {
        toast.error(messageFor(error, action))
        // not found / conflict / forbidden: what is on screen is out of date
        if ([403, 404, 409].includes(error?.response?.status)) {
          families.reload()
          members.reload()
          dashboard.reload()
        }
        return { ok: false, error }
      } finally {
        setBusy(false)
      }
    },
    [busy, toast, t, messageFor, families, members, dashboard],
  )
  // modal forms show the error inside the form instead of a toast
  const runInForm = useCallback(
    async (request, successKey, after) => {
      if (busy) return { ok: false, skipped: true }
      setBusy(true)
      try {
        const value = await request()
        toast.success(t.toasts[successKey])
        setModal(null)
        after?.(value)
        return { ok: true, value }
      } catch (error) {
        return { ok: false, error }
      } finally {
        setBusy(false)
      }
    },
    [busy, toast, t],
  )

  const reloadFamilyData = () => {
    members.reload()
    dashboard.reload()
    monthly.reload()
    familyInvites.reload()
  }

  const createFamily = (body) => runInForm(() => familyApi.createFamily(body), 'created', (created) => {
    families.reload()
    selectFamily(created.id)
  })
  const editFamily = (body) => runInForm(() => familyApi.updateFamily(fid, body), 'updated', () => {
    families.reload()
    dashboard.reload()
    monthly.reload()
  })
  const invite = (userId, role) => runInForm(() => familyApi.createInvitation(fid, userId, role), 'invited', () => familyInvites.reload())
  const saveBudget = (body) => {
    if (modal.kind === 'budget-edit') {
      return runInForm(() => familyApi.updateFamilyBudget(fid, modal.budgetId, body), 'budgetUpdated', () => {
        utilization.reload()
        dashboard.reload()
      })
    }
    const { periodStart, periodEnd } = monthPeriod(month)
    return runInForm(() => familyApi.createFamilyBudget(fid, { ...body, periodStart, periodEnd, currency: family.currency, timeZone: family.timeZone }), 'budgetCreated', () => dashboard.reload())
  }
  const shareTx = (transactionId, targetFamily) =>
    runInForm(() => familyApi.shareTransaction(transactionId, targetFamily), 'shared', () => {
      if (targetFamily === fid) {
        shared.reload()
        dashboard.reload()
        monthly.reload()
        utilization.reload()
      }
    })

  const respondInvite = (inv, accept) =>
    run(() => (accept ? familyApi.acceptInvitation(inv.id) : familyApi.declineInvitation(inv.id)), accept ? 'accepted' : 'declined', 'invite', () => {
      mine.reload()
      if (accept) {
        families.reload()
        selectFamily(inv.familyId)
      }
    })

  const doConfirm = async () => {
    const c = confirm
    let result
    if (c.kind === 'delete') result = await run(() => familyApi.deleteFamily(fid), 'deleted', 'family', () => { families.reload(); selectFamily('') })
    else if (c.kind === 'leave') result = await run(() => familyApi.leaveFamily(fid), 'left', 'family', () => { families.reload(); selectFamily('') })
    else if (c.kind === 'remove') result = await run(() => familyApi.removeMember(fid, c.member.id), 'removed', 'member', reloadFamilyData)
    else if (c.kind === 'transfer') result = await run(() => familyApi.transferOwnership(fid, c.member.id), 'transferred', 'member', () => { families.reload(); reloadFamilyData() })
    else if (c.kind === 'archive') result = await run(() => familyApi.archiveFamilyBudget(fid, c.budgetId), 'budgetArchived', 'budget', () => { dashboard.reload(); utilization.reload() })
    else if (c.kind === 'unshare') result = await run(() => familyApi.unshareTransaction(c.tx.id, fid), 'unshared', 'share', () => { shared.reload(); dashboard.reload(); monthly.reload(); utilization.reload() })
    if (result && !result.skipped) setConfirm(null)
  }
  const dialog = confirm && {
    delete: t.dialogs.deleteFamily,
    leave: t.dialogs.leave,
    remove: t.dialogs.remove,
    transfer: t.dialogs.transfer,
    archive: t.dialogs.archive,
    unshare: t.dialogs.unshare,
  }[confirm.kind]

  // ---- render
  const loadingFamilies = families.loading && !families.data
  const pendingCount = perms.invite ? (familyInvites.data ?? []).filter((i) => i.status === 'PENDING').length : 0
  const retryAll = () => {
    families.retry()
    mine.retry()
  }

  return (
    <div className="family-page" dir={dir}>
      <header className="family-header">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
        </div>
        <div className="fam-header-actions">
          {list.length > 0 && (
            <label className="fam-select">
              <span>{t.familyLabel}</span>
              <select value={fid ?? ''} onChange={(e) => selectFamily(e.target.value)}>
                {list.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {family && (
            <label className="fam-select">
              <span>{t.monthLabel}</span>
              <select value={month} onChange={(e) => setMonthChoice({ familyId: fid, month: e.target.value })}>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLong(m, lang)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {perms.invite && (
            <button type="button" className="btn btn-primary" onClick={() => setModal({ kind: 'invite' })}>
              {t.invite}
            </button>
          )}
        </div>
      </header>

      {loadingFamilies ? (
        <div className="fam-loading" aria-busy="true" role="status">
          <span className="sk" style={{ blockSize: 110, borderRadius: 18 }} />
          <span className="sk" style={{ blockSize: 260, borderRadius: 22 }} />
          <span className="fam-sr">{t.loading}</span>
        </div>
      ) : families.error ? (
        <div className="dc-state fam-state" role="alert">
          <CircleAlert size={32} aria-hidden="true" />
          <strong>{t.loadError}</strong>
          <p>{messageFor(families.error)}</p>
          <button type="button" className="dc-retry" onClick={retryAll}>
            {t.retry}
          </button>
        </div>
      ) : !family ? (
        <>
          {(mine.data ?? []).length > 0 && (
            <InvitationsPanel t={t} mine={mine.data} familyInvites={[]} perms={permissionsFor(null)} myRole={null} myUserId={myUserId} busy={busy} onAccept={(i) => respondInvite(i, true)} onDecline={(i) => respondInvite(i, false)} />
          )}
          <div className="dc-state fam-state">
            <Users size={32} aria-hidden="true" />
            <strong>{t.none.title}</strong>
            <p>{t.none.body}</p>
            <button type="button" className="btn btn-primary" onClick={() => setModal({ kind: 'family' })}>
              {t.none.cta}
            </button>
          </div>
          {(mine.data ?? []).length === 0 && (
            <InvitationsPanel t={t} mine={[]} familyInvites={[]} perms={permissionsFor(null)} myRole={null} myUserId={myUserId} busy={busy} onAccept={() => {}} onDecline={() => {}} />
          )}
        </>
      ) : (
        <>
          <div className="fam-manage">
            <span className="fam-role-badge">{t.roles[myRole]}</span>
            {perms.update && (
              <button type="button" className="text-btn" onClick={() => setModal({ kind: 'edit' })}>
                {t.manage.edit}
              </button>
            )}
            {perms.leave && (
              <button type="button" className="text-btn" onClick={() => setConfirm({ kind: 'leave' })}>
                {t.manage.leave}
              </button>
            )}
            {perms.delete && (
              <button type="button" className="text-btn fam-danger" onClick={() => setConfirm({ kind: 'delete' })}>
                {t.manage.delete}
              </button>
            )}
            <button type="button" className="text-btn" onClick={() => setModal({ kind: 'family' })}>
              {t.none.cta}
            </button>
          </div>

          {dashboard.error && (
            <div className="dc-state" role="alert">
              <p>{messageFor(dashboard.error)}</p>
              <button type="button" className="dc-retry" onClick={dashboard.retry}>
                {t.retry}
              </button>
            </div>
          )}

          <FamilySummary
            t={t}
            dashboard={dashboard.data}
            loading={dashboard.loading}
            failed={Boolean(dashboard.error)}
            currency={family.currency}
            monthLabel={month ? monthLong(month, lang) : ''}
            memberCount={members.data ? members.data.length : dashboard.data?.activeMemberCount ?? null}
            pendingCount={pendingCount}
          />

          <div className="family-layout">
            <MonthlyOverview t={t} lang={lang} resource={monthly} currency={family.currency} />
            <MembersPanel
              t={t}
              members={members.data ?? []}
              loading={members.loading}
              error={members.error}
              retry={members.retry}
              myUserId={myUserId}
              myRole={myRole}
              perms={perms}
              busy={busy}
              onInvite={() => setModal({ kind: 'invite' })}
              onRole={(m, role) => run(() => familyApi.changeMemberRole(fid, m.id, role), 'roleChanged', 'member', () => members.reload())}
              onRemove={(m) => setConfirm({ kind: 'remove', member: m })}
              onTransfer={(m) => setConfirm({ kind: 'transfer', member: m })}
            />
          </div>

          <div className="family-grid">
            <FamilyBudgetsPanel
              t={t}
              budgetState={budgetState}
              utilization={utilization}
              perms={perms}
              byCode={byCode}
              busy={busy}
              onAdd={() => setModal({ kind: 'budget' })}
              onEdit={(u) => setModal({ kind: 'budget-edit', budgetId: u.budgetId })}
              onArchive={(u) => setConfirm({ kind: 'archive', budgetId: u.budgetId })}
            />
            <SharedTransactionsPanel
              t={t}
              resource={shared}
              myUserId={myUserId}
              byCode={byCode}
              busy={busy}
              onShare={() => setModal({ kind: 'share' })}
              onUnshare={(tx) => setConfirm({ kind: 'unshare', tx })}
              onMore={() => setSharedSize((n) => n + 10)}
            />
          </div>

          <FamilyReportsPanel t={t} familyId={fid} month={month} period={dashboard.data?.period} stamp={dashboard.data?.generatedAt} currency={family.currency} byCode={byCode} />

          <InvitationsPanel
            t={t}
            mine={mine.data}
            familyInvites={familyInvites.data}
            perms={perms}
            myRole={myRole}
            myUserId={myUserId}
            busy={busy}
            onAccept={(i) => respondInvite(i, true)}
            onDecline={(i) => respondInvite(i, false)}
            onRevoke={(i) => run(() => familyApi.revokeInvitation(fid, i.id), 'revoked', 'invite', () => familyInvites.reload())}
          />
        </>
      )}

      <FamilyFormModal open={modal?.kind === 'family' || modal?.kind === 'edit'} t={t} dir={dir} family={modal?.kind === 'edit' ? family : null} defaults={{ currency: prefs?.currency, timeZone: prefs?.timezone }} submit={modal?.kind === 'edit' ? editFamily : createFamily} onClose={() => setModal(null)} messageFor={messageFor} />
      <InviteModal open={modal?.kind === 'invite'} t={t} dir={dir} myRole={myRole} submit={invite} onClose={() => setModal(null)} messageFor={messageFor} />
      <FamilyBudgetModal
        open={modal?.kind === 'budget' || modal?.kind === 'budget-edit'}
        mode={modal?.kind === 'budget-edit' ? 'edit' : 'create'}
        t={t}
        lang={lang}
        dir={dir}
        utilization={utilization.data}
        month={month}
        family={family}
        categories={categories}
        submit={saveBudget}
        onClose={() => setModal(null)}
        messageFor={messageFor}
      />
      <ShareTransactionModal open={modal?.kind === 'share'} t={t} dir={dir} families={list} defaultFamilyId={fid} submit={shareTx} onClose={() => setModal(null)} messageFor={messageFor} />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={dialog?.title ?? ''}
        body={dialog?.body ?? ''}
        confirmLabel={dialog?.confirm ?? ''}
        busyLabel={dialog?.busy ?? ''}
        cancelLabel={t.dialogs.keep}
        busy={busy}
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
