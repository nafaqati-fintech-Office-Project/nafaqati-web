import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleAlert, Inbox, Plus, SearchX } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { useAsync } from '../../hooks/useAsync.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useFormat } from '../../hooks/useFormat.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useToast } from '../../hooks/useToast.js'
import { PAGE_SIZES, toApiParams, useTransactionFilters } from '../../hooks/useTransactionFilters.js'
import { getErrorInfo } from '../../lib/errors.js'
import * as transactionApi from '../../services/transactionApi.js'
import { toCsv, downloadFile } from '../../utils/csv.js'
import { toMonthValue } from '../../utils/format.js'
import TransactionFilters from './TransactionFilters.jsx'
import TransactionTable from './TransactionTable.jsx'
import TransactionDetailsDrawer from './TransactionDetailsDrawer.jsx'
import TransactionFormModal from './TransactionFormModal.jsx'
import './Transactions.css'

const t = APP_TEXT.transactions
const NEW_TYPES = ['expense', 'income']

function StateCard({ icon: Icon, title, body, children }) {
  return (
    <div className="dc-state tx-state">
      <Icon size={32} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{body}</p>
      {children}
    </div>
  )
}

export default function Transactions() {
  const toast = useToast()
  const fmt = useFormat()
  const categoriesState = useCategories()
  const { categories, nameOf } = categoriesState
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, setFilters, clearFilters, hasActiveFilters } = useTransactionFilters()
  const apiParams = useMemo(() => toApiParams(filters, fmt.timeZone), [filters, fmt.timeZone])
  // Server-side search, filters, sort and pagination; responses for outdated params are ignored
  const list = useAsync(() => transactionApi.listTransactions(apiParams), JSON.stringify(apiParams))
  // The Card filter's choices; a failure only hides that filter
  const cards = useAsync(() => transactionApi.getCards().catch(() => []), 'tx-cards')
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [details, setDetails] = useState(null)
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  // /transactions?new=expense opens the Add modal with that type preselected
  const newType = searchParams.get('new')
  const urlForm = NEW_TYPES.includes(newType) ? { mode: 'create', type: newType.toUpperCase() } : null
  const activeForm = form ?? urlForm

  const [sortField, sortDir] = filters.sort.split(',')
  const sort = { field: sortField, dir: sortDir }
  const handleSort = (field) => {
    const dir = field === sortField && sortDir === 'desc' ? 'asc' : 'desc'
    setFilters({ sort: `${field},${dir}` })
  }

  const openDetails = useCallback((txn) => setDetails(txn), [])
  const openEdit = useCallback((txn) => setForm({ mode: 'edit', txn }), [])
  const askDelete = useCallback((txn) => setDeleting(txn), [])

  const closeForm = () => {
    setForm(null)
    if (searchParams.has('new')) {
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }

  const saveTransaction = async (data) => {
    const editing = activeForm.mode === 'edit'
    const saved = editing
      ? await transactionApi.updateTransaction(activeForm.txn.id, data)
      : await transactionApi.createTransaction(data)
    toast.success(editing ? t.toasts.updated : t.toasts.created)
    if (editing && details?.id === saved.id) setDetails(saved)
    closeForm()
    list.refetch()
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await transactionApi.deleteTransaction(deleting.id)
      toast.success(t.toasts.deleted)
      if (details?.id === deleting.id) setDetails(null)
      // Deleting the last row of a page: step back so we land on a page that exists
      if (list.data?.items.length === 1 && filters.page > 1) setFilters({ page: filters.page - 1 })
      else list.refetch()
      setDeleting(null)
    } catch (err) {
      toast.error(getErrorInfo(err, 'transactions').message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const changeCategory = useCallback(
    async (txn, categoryId) => {
      try {
        await transactionApi.updateCategory(txn.id, categoryId)
        toast.success(t.toasts.categoryChanged(nameOf(categoryId)))
        setDetails((current) => (current?.id === txn.id ? { ...current, categoryId } : current))
        list.refetch()
      } catch (err) {
        toast.error(getErrorInfo(err, 'transactions').message)
      }
    },
    [toast, nameOf, list],
  )

  const exportCsv = async () => {
    setExporting(true)
    try {
      const { items, capped, totalItems } = await transactionApi.listAllTransactions(apiParams)
      const csv = toCsv(
        t.csvHeaders,
        items.map((r) => [
          fmt.dateKey(r.occurredAt),
          r.merchant.name,
          t.typeLabel[r.type],
          nameOf(r.categoryId),
          r.currency,
          r.type === 'INCOME' ? r.amount : -r.amount,
          r.description,
          t.details.sources[r.source] ?? r.source,
          r.reference,
        ]),
      )
      downloadFile(`nafaqati-transactions-${toMonthValue(new Date())}.csv`, csv)
      toast.success(capped ? t.toasts.exportedCapped(items.length, totalItems) : t.toasts.exported(items.length))
    } catch (err) {
      toast.error(getErrorInfo(err, 'transactions').message)
    } finally {
      setExporting(false)
    }
  }

  const data = list.data
  const items = data?.items ?? []
  const loading = list.loading || categoriesState.loading
  const loadError = list.error ? getErrorInfo(list.error, 'transactions').message : categoriesState.error
  const noDataAtAll = !loading && !loadError && data?.totalItems === 0 && !hasActiveFilters
  const noResults = !loading && !loadError && data?.totalItems === 0 && hasActiveFilters

  const openAdd = () => setForm({ mode: 'create' })

  return (
    <div className="tx-page">
      <header className="tx-head">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} aria-hidden="true" />
          {t.add}
        </button>
      </header>

      <TransactionFilters
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        categories={categories}
        cards={cards.data ?? []}
        isMobile={isMobile}
        exporting={exporting}
        onExport={exportCsv}
      />

      <section className="tx-card" aria-label={t.table.label}>
        {loadError ? (
          <StateCard icon={CircleAlert} title={t.error.title} body={loadError}>
            <button
              type="button"
              className="dc-retry"
              onClick={() => {
                list.retry()
                categoriesState.retry()
              }}
            >
              {APP_TEXT.common.retry}
            </button>
          </StateCard>
        ) : noDataAtAll ? (
          <StateCard icon={Inbox} title={t.empty.title} body={t.empty.body}>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <Plus size={18} aria-hidden="true" />
              {t.empty.cta}
            </button>
          </StateCard>
        ) : noResults ? (
          <StateCard icon={SearchX} title={t.noResults.title} body={t.noResults.body}>
            <button type="button" className="btn btn-outline" onClick={clearFilters}>
              {t.filters.clear}
            </button>
          </StateCard>
        ) : (
          <TransactionTable
            items={items}
            loading={loading}
            pageSize={filters.size}
            isMobile={isMobile}
            sort={sort}
            onSort={handleSort}
            categories={categories}
            onView={openDetails}
            onEdit={openEdit}
            onDelete={askDelete}
            onChangeCategory={changeCategory}
          />
        )}

        {!loading && data && data.totalItems > 0 && (
          <Pagination
            page={filters.page}
            size={filters.size}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            sizes={PAGE_SIZES}
            onPage={(page) => setFilters({ page })}
            onSize={(size) => setFilters({ size })}
          />
        )}
      </section>

      <TransactionDetailsDrawer txn={details} onClose={() => setDetails(null)} onEdit={openEdit} onDelete={askDelete} />

      <TransactionFormModal form={activeForm} categories={categories} onSubmit={saveTransaction} onClose={closeForm} />

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
